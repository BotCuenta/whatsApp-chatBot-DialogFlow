import { addKeyword,EVENTS  } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo de reclamos
export const reclamosFlow = addKeyword("reclamo")
  .addAction(async (ctx, { flowDynamic, state }) => {
    console.log("📌 Iniciando reclamo...");

    // Reiniciar datos previos
    await state.update({
      area: undefined,
      motivo: undefined,
      nombreCompleto: undefined,
      documento: undefined,
      inReclamoFlow: true
    });

    await flowDynamic("Para verificar tu identidad, necesitaremos algunos datos.");
    return gotoFlow(pedirAreaFlow);
  });

// Flujo para pedir el área con una lista desplegable
export const pedirAreaFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { provider }) => {
    const list = {
      type: "list",
      header: { type: "text", text: "Menú de Áreas" },
      body: { text: "¿Dónde deseas cargar tu reclamo?" },
      footer: { text: "Presiona el botón y selecciona una opción." },
      action: {
        button: "Desplegar opciones",
        sections: [
          {
            title: "Áreas",
            rows: [
              { id: "Defensa al Consumidor", title: "Defensa al Consumidor" },
              { id: "Derechos de Inquilinos", title: "Derechos de inquilinos" },
              { id: "Juventud", title: "Juventud" },
              { id: "Servicios Públicos", title: "Servicios Públicos" },
              { id: "Defensoría Itinerante", title: "Defensoría Itinerante" }
            ]
          }
        ]
      }
    };

    await provider.sendList(ctx.from, list);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state,gotoFlow }) => {
    const areaSeleccionada = ctx.body.trim();
    const AREAS_VALIDAS = [
      "Defensa al Consumidor",
      "Derechos de Inquilinos",
      "Juventud",
      "Servicios Públicos",
      "Defensoría Itinerante"
    ];

    if (!AREAS_VALIDAS.includes(areaSeleccionada)) {
      await flowDynamic("⚠️ Opción inválida. Selecciona un área de la lista.");
      return gotoFlow(pedirAreaFlow);
    }

    await state.update({ area: areaSeleccionada });
    await flowDynamic(`Área seleccionada: *${areaSeleccionada}*`);
    return gotoFlow(pedirMotivoFlow);
  });

// Flujo para pedir el motivo del reclamo
export const pedirMotivoFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic("Describe brevemente tu reclamo:");
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state,gotoFlow  }) => {
    const motivo = ctx.body.trim();
    if (!motivo) {
      await flowDynamic("⚠️ No entendí tu mensaje. Escribe los detalles de tu reclamo.");
      return gotoFlow(pedirMotivoFlow);
    }

    await state.update({ motivo });
    await flowDynamic("📌 Reclamo registrado. Ahora necesitamos verificar tu identidad.");
    return gotoFlow(pedirNombreFlow);
  });

// Flujo para pedir el nombre completo
export const pedirNombreFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic("Escribe tu nombre completo:");
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state,gotoFlow  }) => {
    const nombreCompleto = ctx.body.trim();
    if (!nombreCompleto.includes(" ")) {
      await flowDynamic("⚠️ Ingresa tu nombre y apellido.");
      return gotoFlow(pedirNombreFlow);
    }

    await state.update({ nombreCompleto });
    await flowDynamic("✅ Nombre registrado.");
    return gotoFlow(pedirDocumentoFlow);
  });

// Flujo para pedir el documento
export const pedirDocumentoFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic("Ingresa tu número de documento con el formato 99.999.999:");
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state,gotoFlow  }) => {
    const documento = ctx.body.trim();
    const formatoValido = /^\d{8}$|^\d{2}\.\d{3}\.\d{3}$/.test(documento);

    if (!formatoValido) {
      await flowDynamic("⚠️ Formato inválido. Usa el formato 99.999.999.");
      return gotoFlow(pedirDocumentoFlow);
    }

    await state.update({ documento });
    await flowDynamic("✅ Documento registrado.");

    return gotoFlow(guardarReclamoFlow);
  });

// Flujo para guardar el reclamo
export const guardarReclamoFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic, state }) => {
    const { nombreCompleto, documento, area, motivo } = state.getMyState();
    
    try {
      console.log("📤 Guardando reclamo en Sheets...");
      const response = await insertInSheets(
        {
          nombreCompleto,
          documento,
          area,
          telefono: ctx.from,
          motivo
        },
        "RECLAMOS"
      );

      console.log("✅ Reclamo guardado con éxito.");
      await flowDynamic([
        {
          body: response,
          buttons: [{ body: "Abandonar" }, { body: "Volver al Inicio" }]
        }
      ]);

      await state.update({ inReclamoFlow: false });

    } catch (error) {
      console.error("❌ Error al guardar reclamo:", error);
      await flowDynamic("Hubo un problema al registrar tu reclamo. Intenta nuevamente más tarde.");
    }
  });
