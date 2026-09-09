import { useCallback, useEffect, useRef, useState } from "react";
import AuthContext from "./AuthContext.jsx";
import PropTypes from "prop-types";
import { obtenerSesion, logout as cerrarSesion } from "../services/login.js";

const anonymous = { loading: false, isAuthenticated: false, user: null };
const normalizeSession = (data) => data?.isAuthenticated === true && data.user?.uvus && data.user?.rol
    ? { loading: false, isAuthenticated: true, user: data.user }
    : anonymous;

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ ...anonymous, loading: true });
    const requestVersion = useRef(0);

    const setSession = useCallback((data) => {
        // Ignorar comprobaciones anteriores que lleguen después del login/logout.
        requestVersion.current += 1;
        setAuth(normalizeSession(data));
    }, []);

    const refreshSession = useCallback(async () => {
        const version = ++requestVersion.current;
        try {
            const data = await obtenerSesion();
            if (version === requestVersion.current) setAuth(normalizeSession(data));
            return data;
        } catch {
            if (version === requestVersion.current) setAuth(anonymous);
            return null;
        }
    }, []);

    const logout = useCallback(async () => {
        await cerrarSesion();
        setSession(null);
    }, [setSession]);

    useEffect(() => {
        refreshSession();
        return () => { requestVersion.current += 1; };
    }, [refreshSession]);

    return <AuthContext.Provider value={{ ...auth, setSession, refreshSession, logout }}>{children}</AuthContext.Provider>;
};
AuthProvider.propTypes = { children: PropTypes.node.isRequired };
