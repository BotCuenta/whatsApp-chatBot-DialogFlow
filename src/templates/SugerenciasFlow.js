import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

export const sugerenciasFlow = addKeyword(EVENTS.ACTION)
	.addAction(async (ctx, { flowDynamic, gotoFlow }) => {
		await flowDynamic(`Escribe más detalles sobre tu sugerencia.`);
		return gotoFlow(detalleSugerenciasFlow);
	})
export const detalleSugerenciasFlow = addKeyword(EVENTS.ACTION)
	.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
		console.log(ctx.body)
		const { nombreCompleto, documento, area, sugerencia } = state.getMyState();
		const response = await insertInSheets(
			{
				nombreCompleto,
				documento,
				area,
				telefono: ctx.from,
				motivo: ctx.body,
			},
			"SUGERENCIAS"
		);
		await flowDynamic([
			{ body: response, buttons: [{ body: "Volver al Inicio" },{ body: "Abandonar" }] },
		]);
	});
