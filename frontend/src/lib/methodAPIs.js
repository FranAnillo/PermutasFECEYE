export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const postAPI = async (fun, body = null, isFile = false) => {
    try {
        const config = {
            method: 'POST',
            credentials: 'include', // Para enviar cookies de sesión
        };

        if (body) {
            if (isFile) {
                config.body = body; // Enviar `FormData` directamente
            } else {
                config.headers = { 'Content-Type': 'application/json' };
                config.body = JSON.stringify(body);
            }
        }

        const respuesta = await fetch(API_URL + fun, config);

        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        let data;
        try {
            data = await respuesta.json();
        } catch {
            return { err: true, errmsg: 'La respuesta no es un JSON válido' };
        }

        return { err: false, result: data };
    } catch (e) {
        return { err: true, errmsg: `Excepción en postAPI: ${e.message}` };
    }
};

export const getAPI = async (fun) => {
    let data;
    try {
        const respuesta = await fetch(API_URL + fun, {
            method: 'get',
            credentials: 'include',
        })
        // Verificar si la respuesta es una redirección
        if (respuesta.redirected) {
            window.location.href = respuesta.url
            return;
        }
        // Verificar si la respuesta es un JSON
        const contentType = respuesta.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await respuesta.json();
        } else {
            data = { err: true, errmsg: `La respuesta no es un JSON: ${respuesta}`, respuestaText: await respuesta.text(), }
        }
    } catch (e) {
        data = { err: true, errmsg: `Excepción al hacer el método getAPI: ${e}`, }
    }
    return data
}

export const getPDF = async (fun) => {
    const respuesta = await fetch(API_URL + fun, {
        method: 'get',
        credentials: 'include',
    });
    if (!respuesta.ok) throw new Error("No se pudo obtener el PDF");
    return await respuesta.arrayBuffer();
}

// El flujo documental propaga errores de transporte y de negocio sin cambiar las API heredadas.
export async function postDocumento(path, body, isFile = false) {
    const response = await fetch(API_URL + path, {
        method: 'POST', credentials: 'include',
        ...(isFile ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }),
    });
    let data;
    try { data = await response.json(); } catch { throw new Error('El servidor no ha devuelto una respuesta válida.'); }
    if (!response.ok || data.err || data.error) {
        throw Object.assign(new Error(data.message || data.errmsg || 'No se pudo completar la operación.'), { status: response.status });
    }
    return { err: false, result: data };
}
