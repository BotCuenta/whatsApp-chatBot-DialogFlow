import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

export const reclamosFlow = addKeyword(EVENTS.ACTION)
	.addAction(async (ctx, { flowDynamic }) => {
		await flowDynamic(`Escribe más detalles sobre tu reclamo.`);
	})
	.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
		const { nombreCompleto, documento, area } = state.getMyState();
		const response = await insertInSheets(
			{
				nombreCompleto,
				documento,
				area,
				telefono: ctx.from,
				motivo: ctx.body,
			},
			"RECLAMOS"
		);
		await flowDynamic([
			{ body: response, buttons: [{ body: "Volver al Inicio" }] },
		]);
	});
