import { addKeyword,EVENTS  } from "@builderbot/bot";
import { insertInSheets } from "../config/sheets.js";

// Flujo de reclamos
export const reclamosFlow = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { flowDynamic,state }) => {
    const { nombreCompleto, documento, area, motivo } = state.getMyState();
    const response = await insertInSheets(
      {
        nombreCompleto,
        documento,
        area,
        telefono: ctx.from,
        motivo,
      },
      "RECLAMOS"
    );
    await flowDynamic([
      { body: response, buttons: [{ body: "Volver al Inicio" },{ body: "Abandonar" }] },
    ]);
})