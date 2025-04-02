import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

export const consultasFlow = addKeyword(EVENTS.ACTION)
    .addAction( async (ctx, { flowDynamic, state }) => {
        const { nombreCompleto, documento, area, consulta, message } = state.getMyState();
        await insertInSheets(
            {
                nombreCompleto,
                documento,
                area,
                motivo: consulta,
                telefono: ctx.from,
            },
            "CONSULTAS"
        );
        await flowDynamic([
				{
					header: "End",
					body:
						message.response?.stringValue || message,
					buttons: [{ body: "Volver al Inicio" }, { body: "Abandonar" }],
				},
			]);
    });
