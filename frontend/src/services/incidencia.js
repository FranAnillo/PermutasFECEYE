import { postAPI}  from "../lib/methodAPIs.js";

export const crearIncidencia = async (descripcion, tipo_incidencia, fileId) => {
    return await postAPI("/api/v1/incidencia/crearIncidencia",{tipo_incidencia, descripcion, fileId})
}

export const obtenerIncidenciasAsignadasUsuario = async () => {
    return await postAPI("/api/v1/incidencia/obtenerIncidenciasAsignadasUsuario")
}

export const obtenerIncidencias = async () => {
    return await postAPI("/api/v1/incidencia/obtenerIncidencias")
}

export const obtenerIncidenciasAsignadas = async () => {
    return await postAPI("/api/v1/incidencia/obtenerIncidenciasAsignadas")
}
export const obtenerIncidenciasAsignadasAdmin = async () => {
    return await postAPI("/api/v1/incidencia/obtenerIncidenciasAsignadasAdmin")
}

export const obtenerIncidenciasSinAsignar = async () => {
    return await postAPI("/api/v1/incidencia/obtenerIncidenciasSinAsignar")
}

export const solucionarIncidencia = async (id_incidencia) => {
    return await postAPI("/api/v1/incidencia/solucionarIncidencia",{id_incidencia})
}

export const asignarmeIncidencia = async (id_incidencia) => {
    return await postAPI("/api/v1/incidencia/asignarmeIncidencia",{id_incidencia})
}

export const obtenerIncidenciaPorId = async (id_incidencia) => {
    return await postAPI("/api/v1/incidencia/obtenerIncidenciaPorId",{id_incidencia})
}