import { createFlow } from "@builderbot/bot";
import { conversacionalFlow, endFlow, welcomeFlow } from "./WelcomeFlow.js";
import { reclamosFlow } from "./ReclamosFlow.js";
import {
	audioFlow,
	locationFlow,
	mediaFlow,
	documentFlow,
} from "./MediaFlow.js";

export default createFlow([
	welcomeFlow,
	conversacionalFlow,
	endFlow,
	reclamosFlow,
	audioFlow,
	locationFlow,
	mediaFlow,
	documentFlow,
	detalleReclamosFlow
]);
