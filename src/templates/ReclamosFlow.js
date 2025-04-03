import { addKeyword } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo para manejar los reclamos
export const reclamosFlow = addKeyword("reclamo")
  .addAction(
    async (ctx, { flowDynamic, state }) => {
      console.log("✅ Iniciando reclamosFlow: solicitando detalle de reclamo.");
      await state.update({ detalleReclamo: undefined, inReclamoFlow: true });

      // Usamos un pequeño delay para asegurar la transición
      setTimeout(async () => {
        await flowDynamic("✏️ Escribe más detalles sobre tu reclamo.");
      }, 500);
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      console.log("📥 Capturando detalle del reclamo...");
      
      // Asegurar que ctx.body tenga contenido válido
      const detalleReclamo = ctx.body ? ctx.body.trim() : "";
      if (!detalleReclamo) {
        console.log("❌ No se recibió detalle del reclamo.");
        await flowDynamic("No entendí tu mensaje. Por favor, escribe los detalles de tu reclamo.");
        return;
      }
      
      console.log("📌 Detalle recibido:", detalleReclamo);

      const { nombreCompleto, documento, area } = state.getMyState();
      if (!nombreCompleto || !documento || !area) {
        console.error("⚠️ Error: Datos faltantes en reclamosFlow", { nombreCompleto, documento, area });
        await flowDynamic("Hubo un problema al recuperar tus datos. Por favor, intenta iniciar el proceso de reclamo nuevamente.");
        return;
      }

      try {
        console.log("📤 Enviando datos a Sheets...");
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

        console.log("✅ Reclamo guardado con éxito.");
        await flowDynamic([
          {
            body: response,
            buttons: [
              { body: "Hacer otro reclamo" },
              { body: "Volver al Inicio" }
            ]
          }
        ]);
        
        // No limpiamos inReclamoFlow aún, solo detalleReclamo
        await state.update({ detalleReclamo: undefined,  inReclamoFlow:false});

      } catch (error) {
        console.error("❌ Error al insertar en Sheets:", error);
        await state.update({ detalleReclamo: undefined,  inReclamoFlow:false});
        await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
      }
    }
  )
