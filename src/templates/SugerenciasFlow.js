import { addKeyword, EVENTS } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

export const sugerenciasFlow = addKeyword(EVENTS.ACTION)
	.addAction(async (ctx, { provider, gotoFlow })=>{
		
		const list = {
					type: "list",
					header: {
						type: "text",
						text: "Menú de Áreas",
					},
					body: {
						text:
							"¿Donde deseas cargar tu sugerencia?"
					},
					footer: {
						text: "Por favor, presiona el botón debajo y selecciona una opción.",
					},
					action: {
						button: "Desplegar opciones",
						sections: [
							{
								title: "Áreas",
								rows: [
									{
										id: "Defensa al Consumidor",
										title: "Defensa al Consumidor",
									},
									{
										id: "Derechos de Inquilinos",
										title: "Derechos de inquilinos",
									},
									{
										id: "Juventud",
										title: "Juventud",
									},
									{
										id: "Servicios Públicos",
										title: "Servicios Públicos",
									},
									{
										id: "Defensoría Itinerante",
										title: "Defensoría Itinerante",
									},
								],
							},
						],
					},
				};

				await provider.sendList(ctx.from, list);
				return gotoFlow(detalleSugerenciasFlow)
	}) 

export const detalleSugerenciasFlow = addKeyword(EVENTS.ACTION)
	.addAction({ capture: true },async (ctx, { flowDynamic, gotoFlow,state }) => {
        if (ctx.body!= "Defensa al Consumidor" && ctx.body!= "Derechos de Inquilinos" && ctx.body!= "Juventud" && ctx.body!= "Servicios Públicos" && ctx.body!= "Defensoría Itinerante"){
            await flowDynamic("Por favor selecciona una opción válida.")
            return gotoFlow(sugerenciasFlow)
        }
		await state.update({
		area: ctx.body
	});
		await flowDynamic(`Escribe más detalles sobre tu sugerencia.`);
		return gotoFlow(subirSugerenciasFlow);
	})
    
export const subirSugerenciasFlow = addKeyword(EVENTS.ACTION)
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
			"SUGERENCIAS"
		);
		return await flowDynamic([
			{ body: response, buttons: [{ body: "Volver al Inicio" },{ body: "Abandonar" }] },
		]);
	});
