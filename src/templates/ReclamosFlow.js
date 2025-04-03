import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo para manejar los reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION)
  .addAction(
    async (ctx, { flowDynamic, state }) => {
      console.log("Iniciando reclamosFlow: solicitando detalle de reclamo.");
      await state.update({ detalleReclamo: undefined }); // Reiniciamos solo esta variable
      await flowDynamic("Escribe más detalles sobre tu reclamo.");
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const detalleReclamo = ctx.body ? ctx.body.trim() : "";
      console.log("Detalle recibido:", detalleReclamo);

      const { nombreCompleto, documento, area } = state.getMyState();
      if (!nombreCompleto || !documento || !area) {
        console.error("Error: Faltan datos del estado en reclamosFlow", { nombreCompleto, documento, area });
        await flowDynamic("Hubo un problema interno al recuperar tus datos. Por favor, intenta iniciar el proceso de reclamo nuevamente.");
        return;
      }

      try {
        const response = await insertInSheets(
          {
            nombreCompleto,
            documento,
            area,
            telefono: ctx.from,
            motivo: detalleReclamo,
          },
          "RECLAMOS"
        );

        await flowDynamic([
          {
            body: response,
            buttons: [
              { body: "Hacer otro reclamo" },
              { body: "Volver al Inicio" }
            ]
          }
        ]);
        
        // Limpia solo `detalleReclamo`, pero mantiene `inReclamoFlow`
        await state.update({ detalleReclamo: undefined });

      } catch (error) {
        console.error("Error al insertar en Sheets:", error);
        await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
      }
    }
  )
  .addAnswer(
    "¿En qué más puedo ayudarte?",
    { capture: true },
    async (ctx, { state, flowDynamic }) => {
      const mensaje = ctx.body.toLowerCase();

      if (mensaje === "hacer otro reclamo") {
        console.log("Usuario quiere hacer otro reclamo.");
        await flowDynamic("Por favor, escribe los detalles de tu nuevo reclamo.");
        return;
      }

      if (mensaje === "volver al inicio") {
        console.log("Usuario vuelve al inicio.");
        await state.update({ inReclamoFlow: false }); // Ahora sí limpiamos `inReclamoFlow`
        await flowDynamic("Te hemos llevado al inicio. ¿En qué más podemos ayudarte?");
      }
    }
  );
