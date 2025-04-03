import { addKeyword, EVENTS } from "@builderbot/bot";
import { fetchDialogFlow } from "../config/dialogFlow.js";
import { reclamosFlow } from "./ReclamosFlow.js";
import { consultasFlow } from "./ConsultasFlow.js";
import { sugerenciasFlow } from "./SugerenciasFlow.js";

/**
 * PLugin Configuration
 */

const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(async (ctx, ctxFn) => {
  const { state, gotoFlow, flowDynamic } = ctxFn;
  const currentState = state.getMyState();

  // Si ya estamos en medio de un reclamo, redirigir directamente al flujo de reclamos
  if (currentState?.inReclamoFlow) {
    return gotoFlow(reclamosFlow);
  }

  // 🔴 NUEVO: Verificar si el usuario está en un flujo de reclamos antes de consultar Dialogflow
  if (currentState?.inReclamoFlow) {
    return gotoFlow(reclamosFlow);
  }
  let response = await fetchDialogFlow(ctx.body, ctx.from);

  /* Validamos si es que existe una respuesta por parte del agente de dialogFlow */
  if (!response) {
    return ctxFn.flowDynamic(
      "Oops, disculpe... Por el momento, no esta funcionando el sistema"
    );
  }

  if (!response.queryResult.intent) {
    return ctxFn.flowDynamic(
      "¿Podrías recordarme tu nombre?"
    );
  }

  // Detectar cuando se haga una consulta a una pregunta cargada en Dialogflow
  if (
    response.queryResult.intent &&
    (response.queryResult.intent.displayName.includes("¿") ||
      response.queryResult.intent.displayName.includes("?"))
  ) {
   
    let nombreCompleto = response.queryResult.parameters?.nombreCompleto;
    let documento = response.queryResult.parameters?.documento;
    let consulta = response.queryResult.intent.displayName;

    if (!nombreCompleto || !documento) {
      const contexts = response.queryResult.outputContexts || [];
      contexts.forEach((context) => {
        if (context.name.includes("bienvenido-followup")) {
          const params = context.parameters;
          nombreCompleto = params.fields.nombreCompleto.stringValue;
          documento = params.fields.documento.stringValue;
        }
      });
    }

    if (!nombreCompleto || !documento) {
      return await flowDynamic([
        {
          header: "End",
          body: "No existen los parámetros necesarios",
          buttons: [{ body: "Volver al inicio" }],
        },
      ]);
    }

    await state.update({
      documento: documento,
      nombreCompleto: nombreCompleto,
      area: "-",
      consulta: consulta,
      message: response.queryResult.fulfillmentMessages[1]?.payload.fields.response
        .structValue.fields || response.queryResult.fulfillmentText,
    });
    return gotoFlow(consultasFlow);
  }

  // Detectar cuando un usuario quiera cargar una sugerencia
  if (
    response.queryResult.intent &&
    response.queryResult.intent.displayName == "Sugerencias"
  ) {
    let nombreCompleto = response.queryResult.parameters?.nombreCompleto;
    let documento = response.queryResult.parameters?.documento;

    if (!nombreCompleto || !documento) {
      const contexts = response.queryResult.outputContexts || [];
      contexts.forEach((context) => {
        if (context.name.includes("bienvenido-followup")) {
          const params = context.parameters;
          nombreCompleto = params.fields.nombreCompleto.stringValue;
          documento = params.fields.documento.stringValue;
        }
      });
    }

    if (!nombreCompleto || !documento) {
      return await flowDynamic([
        {
          header: "End",
          body: "No existen los parámetros necesarios",
          buttons: [{ body: "Volver al inicio" }],
        },
      ]);
    }
    await state.update({
      documento: documento,
      nombreCompleto: nombreCompleto,
    });

    return gotoFlow(sugerenciasFlow);
  }

  // Detectar cuando un usuario quiere cargar un reclamo
  if (
    response.queryResult.intent &&
    response.queryResult.intent.displayName.startsWith("Reclamos") &&
    response.queryResult.intent.displayName != "Reclamos"
  ) {
    let nombreCompleto = response.queryResult.parameters?.nombreCompleto;
    let documento = response.queryResult.parameters?.documento;

    if (!nombreCompleto || !documento) {
      const contexts = response.queryResult.outputContexts || [];
      contexts.forEach((context) => {
        if (context.name.includes("bienvenido-followup")) {
          const params = context.parameters;
          nombreCompleto = params.fields.nombreCompleto.stringValue;
          documento = params.fields.documento.stringValue;
        }
      });
    }

    if (!nombreCompleto || !documento) {
      return await flowDynamic([
        {
          header: "End",
          body: "No existen los parámetros necesarios",
          buttons: [{ body: "Volver al inicio" }],
        },
      ]);
    }

    let intentName = response.queryResult.intent.displayName;
    let additionalData = "";

    if (intentName === "Reclamos - Servicios Públicos-4") {
      additionalData = "Servicios Públicos";
    } else if (intentName === "Reclamos - Defensa del consumidor-1") {
      additionalData = "Defensa del Consumidor";
    } else if (intentName === "Reclamos - Juventud-3") {
      additionalData = "Juventud";
    } else if (intentName === "Reclamos - Defensoría Itinerante-5") {
      additionalData = "Defensoría Itinerante";
    } else if (intentName === "Reclamos - Derechos del Inquilino-2") {
      additionalData = "Derechos de Inquilinos";
    }

    await state.update({
      documento: documento,
      nombreCompleto: nombreCompleto,
      area: additionalData,
      inReclamoFlow: true // Indicamos que se inicia el flujo de reclamos
    });
    return gotoFlow(reclamosFlow);
  }

  await state.update({
    message:
      response.queryResult.fulfillmentMessages[1]?.payload.fields.response
        .structValue.fields || response.queryResult.fulfillmentText,
  });

  /* Si la respuesta del DialogFlow tiene el atributo endInteraction 
     se redirige la conversación para que posea un Botón de "volver al Inicio" */
  if (response.queryResult.intent.endInteraction) {
    return gotoFlow(endFlow);
  }

  /* Si no, continúa su flujo normal */
  return gotoFlow(conversacionalFlow);
});

const conversacionalFlow = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { state, flowDynamic, provider }) => {
    const currentState = state.getMyState();
    try {
      if (currentState.message.type?.stringValue == "mainMenu") {
        await flowDynamic([
          {
            header: "Menu",
            body: currentState.message.response?.stringValue,
            buttons: currentState.message.button?.listValue.values.map((i) => {
              return { body: i.stringValue };
            }),
          },
        ]);
      } else if (currentState.message.type?.stringValue == "areasMenu") {
        const list = {
          type: "list",
          header: {
            type: "text",
            text: "Menú de Áreas",
          },
          body: {
            text:
              currentState.message.response?.stringValue ||
              currentState.message,
          },
          footer: {
            text: "Por favor, presiona el botón debajo y selecciona una opción.",
          },
          action: {
            button: "Desplegar opciones",
            sections: [
              {
                title: "Áreas",
                rows: [
                  {
                    id: "Defensa al Consumidor",
                    title: "Defensa al Consumidor",
                  },
                  {
                    id: "Derechos de Inquilinos",
                    title: "Derechos de inquilinos",
                  },
                  {
                    id: "Juventud",
                    title: "Juventud",
                  },
                  {
                    id: "Servicios Públicos",
                    title: "Servicios Públicos",
                  },
                  {
                    id: "Defensoría Itinerante",
                    title: "Defensoría Itinerante",
                  },
                ],
              },
            ],
          },
        };

        await provider.sendList(ctx.from, list);
      } else {
        await flowDynamic(
          currentState.message.response?.stringValue || currentState.message
        );
      }
    } catch (error) {
      await flowDynamic("Oops... Ocurrio un error");
    }
  }
);

const endFlow = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { state, flowDynamic }) => {
    const currentState = state.getMyState();
    try {
      await flowDynamic([
        {
          header: "End",
          body:
            currentState.message.response?.stringValue || currentState.message,
          buttons: [{ body: "Volver al Inicio" }, { body: "Abandonar" }],
        },
      ]);
    } catch (error) {
      await flowDynamic("Oops... Ocurrio un error");
    }
  }
);

export { welcomeFlow, conversacionalFlow, endFlow };
