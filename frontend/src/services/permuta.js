import { postAPI } from "../lib/methodAPIs.js";

export const solicitarPermuta = async (paramNumGrupo, paramCodigo) => {
    return await postAPI("/api/v1/solicitudPermuta/solicitarPermuta", { asignatura: paramNumGrupo, grupos_deseados: paramCodigo })
}
export const cancelarSolicitudPermuta = async (solicitud_id) => {
    return await postAPI("/api/v1/solicitudPermuta/cancelarSolicitudPermuta", { solicitud: solicitud_id })
}
export const obtenerSolicitudesPermuta = async () => {
    return await postAPI("/api/v1/solicitudPermuta/getMisSolicitudesPermuta")
}

export const obtenerPermutasInteresantes = async () => {
    return await postAPI("/api/v1/solicitudPermuta/getSolicitudesPermutaInteresantes");
}

export const verListaPermutas = async () => {
    return await postAPI("/api/v1/solicitudPermuta/verListaPermutas");
}

export const getTodasSolicitudesPermuta = async () => {
    return await postAPI("/api/v1/solicitudPermuta/getTodasSolicitudesPermuta");
}

export const aceptarPermutaSolicitudesPermuta = async (solicitud) => {
    return await postAPI("/api/v1/solicitudPermuta/aceptarSolicitudPermuta", { solicitud });
}

export const validarPermuta = async (solicitud) => {
    return await postAPI("/api/v1/solicitudPermuta/validarSolicitudPermuta", { solicitud });
}

export const actualizarVigenciaSolicitudes = async (solicitud) => {
    return await postAPI("/api/v1/solicitudPermuta/actualizarLaVigenciaSolicitud");
}

export const denegarPermuta = async (solicitud) => {
    return await postAPI("/api/v1/permutas/rechazarSolicitudPermuta", { solicitud });
}

export const misPermutasPropuestas = async () => {
    return await postAPI("/api/v1/permutas/misPermutasPropuestas");
}

export const misPermutasPropuestasPorMi = async () => {
    return await postAPI("/api/v1/permutas/misPermutasPropuestasPorMi");
}

export const listarPermutas = async (IdsPermuta) => {
    return await postAPI("/api/v1/permutas/listarPermutas", { IdsPermuta });
}

export const firmarPermuta = async (archivo, permutaId) => {
    return await postAPI("/api/v1/permutas/firmarPermuta", { archivo, permutaId })
}
export const validarSolicitudPermuta = async (permutaId) => {
    return await postAPI("/api/v1/permutas/validarPermuta", { permutaId })
}

export const aceptarPermuta = async (archivo, permutaId) => {
    return await postAPI("/api/v1/permutas/aceptarPermuta", { archivo, permutaId })
}

export const obtenerPermutasAgrupadasPorUsuario = async () => {
    return await postAPI("/api/v1/permutas/obtenerPermutasAgrupadasPorUsuario");
}

export const generarBorradorPermuta = async (IdsPermuta) => {
    return await postAPI("/api/v1/permutas/generarBorradorPermuta", { IdsPermuta });
}

export const actualizarVigenciaPermutas = async (solicitud) => {
    return await postAPI("/api/v1/solicitudPermuta/actualizarVigenciaPermutas");
}