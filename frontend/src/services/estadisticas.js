import { postAPI } from "../lib/methodAPIs.js";

export const obtenerEstadisticasPermutas = async () => {
    return await postAPI("/api/v1/estadisticas/permutas");
};

export const obtenerEstadisticasSolicitudes = async () => {
    return await postAPI("/api/v1/estadisticas/solicitudes");
};

export const obtenerEstadisticasIncidencias = async () => {
    return await postAPI("/api/v1/estadisticas/obtenerEstadisticasIncidencias");
};

export const obtenerEstadisticasUsuarios = async () => {
    return await postAPI("/api/v1/estadisticas/estadisticasUsuarios");
};

export const importAsignaturas = async () => {
    return await postAPI("/api/v1/estadisticas/importar-asignaturas");
}