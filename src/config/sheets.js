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
			credentials: JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON), // Usa el JSON de las credenciales
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});

		const client = await auth.getClient();

		// Preparar los valores para insertar en Google Sheets

		let codigoReclamoGenerado = Math.round(Date.now() + Math.random())
			.toString()
			.slice(-8);

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
			range: `${nombreDeHoja}!A1`, // Asegúrate de que el rango sea correcto
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: valores,
			},
		});

		if (nombreDeHoja == "RECLAMOS") {
			return `Tu reclamo se han guardado correctamente.\nTu codigo es: ${codigoReclamoGenerado} \nPronto se comunicarán contigo`;
		} else {
			return "Tu comentarios se han guardado correctamente. \nPronto se comunicarán contigo";
		}
	} catch (error) {
		console.error("Error fetching sheets response:", error.message);
		return "Ocurrio un error al guardar. \nIntentalo más tarde";
	}
};
