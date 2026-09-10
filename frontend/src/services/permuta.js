import { postAPI, postDocumento } from "../lib/methodAPIs.js";

export const solicitarPermuta = async (asignatura, gruposDeseados) => {
    return await postAPI("/api/v1/solicitudPermuta/solicitarPermuta", { asignatura, grupos_deseados: gruposDeseados })
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

export const actualizarVigenciaSolicitudes = async () => {
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
    return await postDocumento("/api/v1/permutas/listarPermutas", { IdsPermuta });
}

export const resolverDocumentoPermuta = async (IdsPermuta) => {
    if (!Array.isArray(IdsPermuta) || !IdsPermuta.length ||
        IdsPermuta.some(id => !Number.isSafeInteger(id) || id < 1)) {
        throw new Error('No se pueden identificar las permutas seleccionadas.');
    }
    const response = await listarPermutas(IdsPermuta);
    const documentos = response?.result?.result;
    if (!Array.isArray(documentos) || documentos.length !== 1 ||
        !Number.isSafeInteger(documentos[0]?.id) || documentos[0].id < 1) {
        throw new Error('No se ha encontrado un único documento para estas permutas. Actualiza el listado y vuelve a intentarlo.');
    }
    const filas = documentos[0].grupo?.permutas;
    if (filas && (filas.length !== IdsPermuta.length || filas.some(p => !IdsPermuta.includes(p.permuta_id)))) {
        throw new Error('El documento no coincide con las permutas seleccionadas. Actualiza el listado.');
    }
    return documentos[0].id;
};

export const firmarPermuta = async (archivo, permutaId) => {
    return await postDocumento("/api/v1/permutas/firmarPermuta", { archivo, permutaId })
}
export const validarSolicitudPermuta = async (permutaId) => {
    return await postDocumento("/api/v1/permutas/validarPermuta", { permutaId })
}

export const aceptarPermuta = async (archivo, permutaId) => {
    return await postDocumento("/api/v1/permutas/aceptarPermuta", { archivo, permutaId })
}

export const obtenerPermutasAgrupadasPorUsuario = async () => {
    return await postDocumento("/api/v1/permutas/obtenerPermutasAgrupadasPorUsuario");
}

export const generarBorradorPermuta = async (IdsPermuta) => {
    return await postDocumento("/api/v1/permutas/generarBorradorPermuta", { IdsPermuta });
}

export const actualizarVigenciaPermutas = async () => {
    return await postAPI("/api/v1/solicitudPermuta/actualizarVigenciaPermutas");
}

export const obtenerDocumentoPermuta = async permutaId => {
    try { return await postDocumento('/api/v1/permutas/obtenerDocumento', { permutaId }); }
    catch (error) {
        if (error.status === 404 && error.message === 'Ruta no encontrada.') {
            throw new Error('El backend que atiende esta web no tiene la consulta de documentos actualizada. Comprueba el despliegue del servicio y la URL de la API.');
        }
        throw error;
    }
};
