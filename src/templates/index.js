import { createFlow } from "@builderbot/bot";
import { conversacionalFlow, endFlow, welcomeFlow } from "./WelcomeFlow.js";
import { reclamosFlow, pedirAreaFlow, pedirMotivoFlow, pedirNombreFlow, pedirDocumentoFlow, guardarReclamoFlow } from "./ReclamosFlow.js";
import { consultasFlow } from "./ConsultasFlow.js";
import { sugerenciasFlow, detalleSugerenciasFlow, subirSugerenciasFlow } from "./SugerenciasFlow.js";
import { audioFlow, locationFlow, mediaFlow, documentFlow } from "./MediaFlow.js";

export default createFlow([
    welcomeFlow,
    conversacionalFlow,
    endFlow,
    reclamosFlow,
    pedirAreaFlow,
    pedirMotivoFlow,
    pedirNombreFlow,
    pedirDocumentoFlow,
    guardarReclamoFlow,
    audioFlow,
    locationFlow,
    mediaFlow,
    documentFlow,
    consultasFlow,
    sugerenciasFlow,
    detalleSugerenciasFlow,
    subirSugerenciasFlow
]);
