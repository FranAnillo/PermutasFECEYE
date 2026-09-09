import { useState, useEffect } from "react";
import "../../styles/navbar-style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { obtenerNotificaciones } from "../../services/notificacion.js";
import { useAuth } from "../../hooks/useAuth.js";
import { toast } from "react-toastify";
import { formatearFecha } from "../../lib/formateadorFechas.js";
import { Link } from "react-router-dom";
import { logError } from "../../lib/logger.js";
import ThemeToggle from "../comun/ThemeToggle";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../comun/LanguageSwitcher";


export default function NavbarAdmin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const data = await obtenerNotificaciones();
        if (Array.isArray(data.result.result)) {
          setNotificaciones(data.result.result);
        } else {
          logError(data);
        }
      } catch (error) {
        logError(error);
      } finally {
        setCargando(false);
      }
    };
    cargarNotificaciones();
  }, []);

  const handleClickLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error(t("navbar.logout_error"));
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleLinkClick = (to) => {
    setOpen(false);
    if (to === "/logout") {
      handleClickLogout();
    } else {
      navigate(to);
    }
  };

  if (cargando) {
    return <div className="loading-text">{t("common.loading")}</div>;
  }

  return (
    <>
      <nav className="navbar navbar-admin">
        <div className="navbar-brand">{t("navbar.brand")}</div>
        <button className="hamburger" aria-label={t("navbar.menu")} aria-expanded={open} onClick={() => setOpen(!open)}>
          ☰
        </button>

        {/* Overlay para cerrar menú al hacer click fuera */}
        <div className={`navbar-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)}></div>

        <ul className={`nav-links-responsive ${open ? "open" : ""}`}>
          <li className="nav-group">
            <button
              className="nav-group-btn"
              onClick={() => setOpenGroup(openGroup === 0 ? null : 0)}
            >
              {t("navbar.management")} {openGroup === 0 ? "▲" : "▼"}
            </button>

            <ul className={`nav-submenu ${openGroup === 0 ? "show" : ""}`}>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/")}>
                  <span className="nav-icon">🏠</span> {t("navbar.home")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/incidenciasSinAsignar")}>
                  <span className="nav-icon">📋</span> {t("navbar.incidents")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/incidencias")}>
                  <span className="nav-icon">🐛</span> {t("navbar.my_incidents")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/crearNotificacion")}>
                  <span className="nav-icon">📢</span> {t("navbar.create_notification")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/estadisticas")}>
                  <span className="nav-icon">📊</span> {t("navbar.view_stats")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/gestionUsuarios")}>
                  <span className="nav-icon">👥</span> {t("navbar.user_management")}
                </button>
              </li>
            </ul>

          </li>
          <li className="nav-group">
            <button
              className="nav-group-btn"
              onClick={() => setOpenGroup(openGroup === 1 ? null : 1)}
            >
              {t("navbar.profile")} {openGroup === 1 ? "▲" : "▼"}
            </button>

            <ul className={`nav-submenu ${openGroup === 1 ? "show" : ""}`}>
              <li>
                <button className="nav-link-btn" onClick={() => handleLinkClick("/miPerfilAdmin")}>
                  <span className="nav-icon">👤</span> {t("navbar.my_profile")}
                </button>
              </li>
              <li>
                <button className="nav-link-btn" disabled={loggingOut} onClick={() => handleLinkClick("/logout")}>
                  <span className="nav-icon">🚪</span> {t("navbar.logout")}
                </button>
              </li>
            </ul>

          </li>
        </ul>
        {/* Menú clásico para escritorio */}
        <ul className="nav-links">
          <li>
            <Link to="/">{t("navbar.home")}</Link>
          </li>
          <li>
            <Link to="/incidenciasSinAsignar">{t("navbar.incidents")}</Link>
          </li>
          <li>
            <Link to="/incidencias">{t("navbar.my_incidents")}</Link>
          </li>
          <li>
            <Link to="/crearNotificacion">{t("navbar.create_notification")}</Link>
          </li>
          <li>
            <Link to="/estadisticas">{t("navbar.view_stats")}</Link>
          </li>
          <li>
            <Link to="/gestionUsuarios">{t("navbar.user_management")}</Link>
          </li>
        </ul>

        <div className="nav-icons">
          <LanguageSwitcher />
          <ThemeToggle />

          <button className="nav-icon-button" aria-label={t("common.notifications")} aria-expanded={sidebarVisible} onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBell} className="icon bell-icon" />
          </button>
          <button className="nav-icon-button" aria-label={t("navbar.my_profile")} onClick={() => navigate("/miPerfilAdmin")}>
            <FontAwesomeIcon icon={faUser} className="icon user" />
          </button>
          <button className="nav-icon-button" aria-label={t("navbar.logout")} disabled={loggingOut} onClick={handleClickLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="icon fa-sign-out-alt" />
          </button>
        </div>
      </nav>
      {sidebarVisible && (
        <div className="sidebar">
          <h2>{t("common.notifications")}</h2>

          {notificaciones.length > 0 ? (
            notificaciones.slice(0, 5).map((notificacion) => (
              <div key={notificacion.id} className="notification-item">
                <p className="contenido">{notificacion.contenido}</p>
                <p className="fecha">
                  {formatearFecha(notificacion.fecha_creacion)}
                </p>
              </div>
            ))
          ) : (
            <p>{t("common.no_notifications")}</p>
          )}
        </div>
      )}
    </>
  );
}
