import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Un único flujo para manejar los reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION) // Se activa por el gotoFlow desde welcomeFlow
    .addAction(
        // Acción 1: Pedir los detalles
        async (ctx, { flowDynamic }) => {
            console.log("Iniciando reclamosFlow: solicitando detalle de reclamo.");
            await flowDynamic(`Escribe más detalles sobre tu reclamo.`);
            // El bot espera la respuesta del usuario para pasar a la siguiente acción.
        }
    )
    .addAction(
        // Acción 2: Capturar la respuesta y procesarla
        { capture: true }, // Captura la respuesta del usuario a la pregunta anterior
        async (ctx, { flowDynamic, state, endFlow }) => {
            const detalleReclamo = ctx.body ? ctx.body.trim() : "";
            console.log("Detalle recibido:", detalleReclamo);

            // Validación para asegurarse de que se recibe un detalle adecuado
            if (!detalleReclamo || detalleReclamo.length < 10 || detalleReclamo.toLowerCase() === "reclamo") {
                await flowDynamic("Por favor, necesito que me des más detalles sobre tu reclamo para poder registrarlo.");
                return; // Se espera una nueva respuesta sin continuar el flujo
            }

            // Obtener datos del estado previamente almacenados
            const { nombreCompleto, documento, area } = state.getMyState();

            // Verifica que los datos esenciales existen
            if (!nombreCompleto || !documento || !area) {
                console.error("Error: Faltan datos del estado en reclamosFlow", { nombreCompleto, documento, area });
                await flowDynamic("Hubo un problema interno al recuperar tus datos. Por favor, intenta iniciar el proceso de reclamo nuevamente.");
                return endFlow(); // Termina el flujo si faltan datos esenciales
            }

            try {
                // Insertar los datos en Sheets
                const response = await insertInSheets(
                    {
                        nombreCompleto,
                        documento,
                        area,
                        telefono: ctx.from,
                        motivo: detalleReclamo, // Usar el detalle capturado
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
                // El flujo termina aquí, los botones disparan otros flujos según su keyword.
            } catch (error) {
                console.error("Error al insertar en Sheets:", error);
                await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
                return endFlow();
            }
        }
    );
