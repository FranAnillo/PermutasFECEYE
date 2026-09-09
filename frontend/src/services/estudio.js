import { postAPI}  from "../lib/methodAPIs.js";

export const obtenerEstudios = async () => {
    return await postAPI("/api/v1/estudio/obtenerEstudios")
}

export const crearEstudio = async (estudio,siglas) => {
    return await postAPI("/api/v1/estudio/crearEstudio", {estudio, siglas})
}   