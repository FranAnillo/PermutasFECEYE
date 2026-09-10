import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { login, registro } from "../../services/login.js";
import { useAuth } from "../../hooks/useAuth.js";
import Footer from "./footer.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import "../../styles/login-style.css";

export default function AuthForm({ register = false }) {
    const { t } = useTranslation();
    const { loading, isAuthenticated, user, setSession } = useAuth();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const errorRef = useRef(null);
    const submission = useRef(false);
    const prefix = register ? "register" : "login";

    function showError(message) {
        setError(message);
        requestAnimationFrame(() => errorRef.current?.focus());
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (submission.current) return;
        setError("");
        const form = new FormData(event.currentTarget);
        const credentials = {
            nombre_usuario: String(form.get("nombre_usuario") || "").trim().toLowerCase(),
            password: String(form.get("password") || ""),
        };
        if (!credentials.nombre_usuario || !credentials.password) {
            showError(t("auth.required"));
            return;
        }
        if (register) {
            credentials.nombre_completo = String(form.get("nombre_completo") || "").trim();
            credentials.correo = String(form.get("correo") || "").trim().toLowerCase();
            if (!/^[a-z0-9._-]{3,50}$/.test(credentials.nombre_usuario)) {
                showError(t("auth.username_hint"));
                return;
            }
            if (credentials.nombre_completo.length < 2 || credentials.nombre_completo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.correo)) {
                showError(t("auth.invalid_details"));
                return;
            }
            if (credentials.password.length < 12 || credentials.password.length > 128) {
                showError(t("auth.password_hint"));
                return;
            }
            if (credentials.password !== form.get("confirmarPassword")) {
                showError(t("auth.password_mismatch"));
                return;
            }
        }
        submission.current = true;
        setPending(true);
        try {
            const session = await (register ? registro(credentials) : login(credentials));
            if (!session?.isAuthenticated || !session.user?.uvus || !session.user?.rol) {
                throw new Error(t("auth.session_error"));
            }
            setSession(session);
        } catch (cause) {
            showError(cause instanceof TypeError ? t("auth.network_error") : cause.message || t("auth.request_error"));
        } finally {
            submission.current = false;
            setPending(false);
        }
    }

    if (loading) return <div role="status" className="loading-text">{t("common.loading")}</div>;
    if (isAuthenticated) {
        return <Navigate to={user?.rol === "administrador" ? "/admin" : user?.rol === "estudiante" ? (register ? "/miPerfil" : "/estudiante") : "/unauthorized"} replace />;
    }

    return (
        <>
            <div className="auth-page">
                <header className="auth-header">
                    <Link className="auth-brand" to="/login">Permutas <span>FCEYE</span></Link>
                    <LanguageSwitcher />
                </header>
                <div className="auth-content">
                    <p className="auth-school">{t("footer.school_name")}<br />{t("footer.university_name")}</p>
                    <section className="auth-card" aria-labelledby="auth-title">
                        <h1 id="auth-title" className="login-title">{t(`${prefix}.title`)}</h1>
                        <p className="auth-description">{t(`${prefix}.description`)}</p>
                        <form className="auth-form" onSubmit={handleSubmit} aria-busy={pending}>
                            <label htmlFor="nombre_usuario">{t("auth.username")}</label>
                            <input id="nombre_usuario" name="nombre_usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={50} disabled={pending} />
                            {register && <>
                                <label htmlFor="nombre_completo">{t("auth.full_name")}</label>
                                <input id="nombre_completo" name="nombre_completo" autoComplete="name" required minLength={2} maxLength={150} disabled={pending} />
                                <label htmlFor="correo">{t("auth.email")}</label>
                                <input id="correo" name="correo" type="email" autoComplete="email" required maxLength={254} disabled={pending} />
                            </>}
                            <label htmlFor="password">{t("auth.password")}</label>
                            <input id="password" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} aria-describedby={register ? "password-hint" : undefined} required maxLength={128} disabled={pending} />
                            {register && <>
                                <p id="password-hint" className="auth-hint">{t("auth.password_hint")}</p>
                                <label htmlFor="confirmarPassword">{t("auth.confirm_password")}</label>
                                <input id="confirmarPassword" name="confirmarPassword" type="password" autoComplete="new-password" required maxLength={128} disabled={pending} />
                            </>}
                            <div ref={errorRef} tabIndex={-1} role={error ? "alert" : undefined} className={error ? "auth-error" : "auth-error-empty"}>{error}</div>
                            <button className="login-button" type="submit" disabled={pending}>{t(pending ? "auth.submitting" : `${prefix}.button`)}</button>
                        </form>
                        <p className="auth-switch">{t(`${prefix}.switch_prompt`)} <Link to={register ? "/login" : "/registro"}>{t(`${prefix}.switch_link`)}</Link></p>
                    </section>
                </div>
            </div>
            <Footer />
        </>
    );
}

AuthForm.propTypes = { register: PropTypes.bool };
