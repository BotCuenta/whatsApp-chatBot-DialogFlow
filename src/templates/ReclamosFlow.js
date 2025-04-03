import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo para manejar los reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION)
  .addAction(
    // Acción 1: Solicitar el detalle y reiniciar variables específicas
    async (ctx, { flowDynamic, state }) => {
      console.log("Iniciando reclamosFlow: solicitando detalle de reclamo.");
      // Reiniciamos la variable para evitar datos residuales
      await state.update({ detalleReclamo: undefined });
      await flowDynamic("Escribe más detalles sobre tu reclamo.");
    }
  )
  .addAction(
    // Acción 2: Capturar y procesar el detalle del reclamo
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const detalleReclamo = ctx.body ? ctx.body.trim() : "";
      console.log("Detalle recibido:", detalleReclamo);

      // Validación: el detalle debe tener al menos 10 caracteres y no ser la palabra "reclamo"
      if (!detalleReclamo || detalleReclamo.length < 10 || detalleReclamo.toLowerCase() === "reclamo") {
        await flowDynamic("Por favor, necesito que me des más detalles sobre tu reclamo para poder registrarlo.");
        return;
      }

      // Obtener datos previamente almacenados en el estado (de welcomeFlow)
      const { nombreCompleto, documento, area } = state.getMyState();
      if (!nombreCompleto || !documento || !area) {
        console.error("Error: Faltan datos del estado en reclamosFlow", { nombreCompleto, documento, area });
        await flowDynamic("Hubo un problema interno al recuperar tus datos. Por favor, intenta iniciar el proceso de reclamo nuevamente.");
        return;
      }

      try {
        // Insertar los datos en Sheets
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
              { body: "Volver al Inicio" },
              { body: "Abandonar" }
            ]
          }
        ]);
        // Al finalizar, limpiar el flag del flujo de reclamos para que la próxima interacción se procese en welcomeFlow
        await state.update({ inReclamoFlow: false, detalleReclamo: undefined });
        return;
      } catch (error) {
        console.error("Error al insertar en Sheets:", error);
        await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
        await state.update({ inReclamoFlow: false });
        return;
      }
    }
  );
