import { google } from "googleapis";

const sheets = google.sheets("v4");

export const insertInSheets = async (
	{ nombreCompleto, documento, area, motivo, telefono },
	nombreDeHoja
) => {
	try {
		const { GOOGLE_APPLICATION_CREDENTIALS_JSON, SPREADSHEET_ID } = process.env;
		
		// Autenticación con Google Sheets
		const auth = new google.auth.GoogleAuth({
			credentials: JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON),
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});

		const client = await auth.getClient();

		// Obtener la última fila ocupada
		const response = await sheets.spreadsheets.values.get({
			auth: client,
			spreadsheetId: SPREADSHEET_ID,
			range: `${nombreDeHoja}!A:A`, // Leer la columna A donde se guardan los datos
		});

		// Calcular el número de fila siguiente
		const numFila = response.data.values ? response.data.values.length + 1 : 1;

		// Generar código de reclamo basado en la fila
		let codigoReclamoGenerado = `REC${numFila.toString().padStart(5, "0")}`; // Ejemplo: REC00001

		// Preparar los valores para insertar en Google Sheets
		const valores = [
			[
				documento,
				nombreCompleto,
				telefono,
				new Date().toLocaleString("es-AR", {
					timeZone: "America/Argentina/Buenos_Aires",
				}),
				area,
				motivo,
				codigoReclamoGenerado,
			],
		];

		// Escribir en Google Sheets
		await sheets.spreadsheets.values.append({
			auth: client,
			spreadsheetId: SPREADSHEET_ID,
			range: `${nombreDeHoja}!A1`, // Google Sheets encuentra la primera fila vacía automáticamente
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: valores,
			},
		});

		if (nombreDeHoja == "RECLAMOS") {
			return `Tu reclamo se ha guardado correctamente.\nTu código es: ${codigoReclamoGenerado} \nPronto se comunicarán contigo.`;
		} else {
			return "Tus comentarios se han guardado correctamente. \nPronto se comunicarán contigo.";
		}
	} catch (error) {
		console.error("Error al guardar en Sheets:", error.message);
		return "Ocurrió un error al guardar. \nInténtalo más tarde.";
	}
};
