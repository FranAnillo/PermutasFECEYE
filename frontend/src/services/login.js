import { API_URL } from "../lib/methodAPIs.js";

// La autenticación usa respuestas HTTP reales, sin los sobres de las API heredadas.
async function authRequest(path, body) {
    const response = await fetch(`${API_URL}/api/v1/autorizacion/${path}`, {
        method: path === "obtenerSesion" ? "GET" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("No se ha podido conectar con el servicio de acceso.");
    }
    if (!response.ok) {
        const error = new Error(data.message || "No se ha podido completar la solicitud.");
        error.status = response.status;
        throw error;
    }
    return data;
}

export const login = (credentials) => authRequest("login", credentials);
export const registro = (user) => authRequest("registro", user);
export const logout = () => authRequest("logout");
export const obtenerSesion = () => authRequest("obtenerSesion");
