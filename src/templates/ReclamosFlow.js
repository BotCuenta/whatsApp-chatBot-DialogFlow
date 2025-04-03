import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Un único flujo para manejar los reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION) // Se activa por el gotoFlow desde welcomeFlow
    .addAction(
        // Acción 1: Pedir los detalles
        async (ctx, { flowDynamic }) => {
            await flowDynamic(`Escribe más detalles sobre tu reclamo.`);
            // NO usamos gotoFlow aquí. El bot esperará la respuesta del usuario
            // para pasar a la siguiente acción encadenada.
        }
    )
    .addAction(
        // Acción 2: Capturar la respuesta y procesarla
        { capture: true }, // Captura la respuesta del usuario a la pregunta anterior
        async (ctx, { flowDynamic, state, endFlow }) => { // Puedes añadir endFlow si necesitas terminar explícitamente
            console.log("Detalle recibido:", ctx.body); // Verifica que el detalle se recibe
            const detalleReclamo = ctx.body;

            // Es buena idea validar que el usuario envió algo
            if (!detalleReclamo || detalleReclamo.trim() === '') {
                 await flowDynamic("Por favor, necesito que me des algún detalle sobre tu reclamo para poder registrarlo.");
                 // Podrías querer volver a pedirlo o simplemente terminar.
                 // Si quieres volver a pedir, necesitarías un gotoFlow a este mismo flujo o una estructura diferente.
                 // Por simplicidad, aquí podríamos simplemente no hacer nada o terminar.
                 // return; // Opcional: salir si no hay detalle
                 // O podrías simplemente continuar y registrarlo vacío/inválido si la lógica lo permite.
            }

            const { nombreCompleto, documento, area } = state.getMyState(); // Obtener datos del estado

            // Verifica que los datos del estado existen
            if (!nombreCompleto || !documento || !area) {
                console.error("Error: Faltan datos del estado en reclamosFlow", { nombreCompleto, documento, area });
                await flowDynamic("Hubo un problema interno al recuperar tus datos. Por favor, intenta iniciar el proceso de reclamo nuevamente.");
                return endFlow(); // Termina el flujo si faltan datos esenciales
            }


            try {
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
                    { body: response, buttons: [{ body: "Volver al Inicio" }, { body: "Abandonar" }] },
                ]);
                // El flujo termina aquí naturalmente después de enviar el mensaje.
                // Los botones usualmente disparan EVENTS.WELCOME o keywords específicos si el usuario los presiona.
                // Si 'Abandonar' necesita una lógica especial, deberías manejar esa keyword/payload.
            } catch (error) {
                 console.error("Error al insertar en Sheets:", error);
                 await flowDynamic("Lo siento, ocurrió un error al intentar guardar tu reclamo. Por favor, inténtalo de nuevo más tarde.");
                 // Considera terminar el flujo aquí también si ocurre un error
                 // return endFlow();
            }
        }
    );

// Ya no necesitas el 'detalleReclamosFlow' separado si usas el encadenamiento.
// export const detalleReclamosFlow = ... // Eliminar o comentar esta parte
