import { postAPI}  from "../lib/methodAPIs.js";

export const obtenerTodosGruposMisAsignaturasUsuario = async () => {
    return await postAPI("/api/v1/grupo/obtenerTodosGruposMisAsignaturasUsuario")
}

export const obtenerMiGrupoAsignatura = async () => {
    return await postAPI("/api/v1/grupo/obtenerMiGrupoAsignatura")
}

export const insertarMisGrupos = async (paramNumGrupo,paramCodigo) => {
    return await postAPI("/api/v1/grupo/insertarMisGrupos", {num_grupo:paramNumGrupo,codigo:paramCodigo})
}

export const obtenerTodosGruposMisAsignaturasSinGrupoUsuario = async () => {
    return await postAPI("/api/v1/grupo/obtenerTodosGruposMisAsignaturasSinGrupoUsuario")
}