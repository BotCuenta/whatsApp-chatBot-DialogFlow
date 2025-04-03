import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo único para manejar los reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION) // Se activa por el gotoFlow desde welcomeFlow
    .addAction(
        // Acción 1: Pedir los detalles y reiniciar variables específicas del flujo
        async (ctx, { flowDynamic, state }) => {
            console.log("Iniciando reclamosFlow: solicitando detalle de reclamo.");
            // Reiniciamos la variable del detalle para evitar contaminación de ciclos anteriores
            state.update({ detalleReclamo: undefined });
            await flowDynamic("Escribe más detalles sobre tu reclamo.");
            // El bot quedará a la espera de la respuesta del usuario para pasar a la siguiente acción.
        }
    )
    .addAction(
        // Acción 2: Capturar la respuesta y procesarla
        { capture: true }, // Captura la respuesta del usuario a la pregunta anterior
        async (ctx, { flowDynamic, state, endFlow }) => {
            const detalleReclamo = ctx.body ? ctx.body.trim() : "";
            console.log("Detalle recibido:", detalleReclamo);

            // Validación: verificar que el detalle tenga al menos 10 caracteres y no sea una palabra reservada
            if (!detalleReclamo || detalleReclamo.length < 10 || detalleReclamo.toLowerCase() === "reclamo") {
                await flowDynamic("Por favor, necesito que me des más detalles sobre tu reclamo para poder registrarlo.");
                return; // Se espera nueva respuesta sin avanzar en el flujo
            }

            // Obtener datos del estado previamente almacenados (estos deberían haberse establecido en welcomeFlow)
            const { nombreCompleto, documento, area } = state.getMyState();

            // Validar que existan los datos esenciales
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
                // Finalizamos el flujo para evitar que se interprete algún mensaje posterior en otro intent.
                return endFlow();
            } catch (error) {
                console.error("Error al insertar en Sheets:", error);
                await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
                return endFlow();
            }
        }
    );
