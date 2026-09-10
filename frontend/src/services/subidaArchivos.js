import { postAPI, postDocumento}  from "../lib/methodAPIs.js";
import { getPDF }  from "../lib/methodAPIs.js";

export const subidaArchivo = async (formData) => {
    return await postAPI("/api/v1/upload",formData,true)
}

export const servirArchivo = async (tipo,fileId) => {
    return await getPDF(`/api/v1/uploads/${tipo}/${fileId}`)
}

export const obtenerPlantillaPermuta = async () => {
    return await getPDF("/api/v1/plantillaPermuta")
}
export const subirPDFDocumento = (id, formData) => postDocumento(`/api/v1/documentoPermuta/${id}/archivo`, formData, true);
export const descargarPDFDocumento = id => getPDF(`/api/v1/documentoPermuta/${id}/archivo`);
