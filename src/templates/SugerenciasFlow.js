import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";


export const sugerenciasFlow = addKeyword(EVENTS.ACTION).addAction(
		async (ctx, { flowDynamic,state }) => {
			const { nombreCompleto, documento, area } = state.getMyState();
			const response = await insertInSheets(
				{
					nombreCompleto,
					documento,
					area,
					telefono: ctx.from,
					motivo,
				},
				"SUGERENCIAS"
			);
			await flowDynamic([
				{ body: response, buttons: [{ body: "Volver al Inicio" },{ body: "Abandonar" }] },
			]);
	})
    
