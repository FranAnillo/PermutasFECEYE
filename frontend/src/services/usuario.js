import { postAPI}  from "../lib/methodAPIs.js";

export const obtenerDatosUsuario = async () => {
    return await postAPI("/api/v1/usuario/obtenerDatosUsuario")
}

export const actualizarEstudiosUsuario = async (paramEstudio) => {
    return await postAPI("/api/v1/usuario/actualizarEstudiosUsuario", {estudio:paramEstudio})
}

export const obtenerDatosUsuarioAdmin = async () => {
    return await postAPI("/api/v1/usuario/obtenerDatosUsuarioAdmin")
}

export const obtenerTodosUsuarios = async () => {
    return await postAPI("/api/v1/usuario/obtenerTodosUsuarios");
}

export const actualizarUsuario = async (uvus, userData) => {
    const payload = {
        uvus,
        ...userData
    };
    return await postAPI(`/api/v1/usuario/actualizarUsuario/`, payload);
}