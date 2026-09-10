import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/navbar-style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { obtenerNotificaciones } from "../../services/notificacion.js";
import ThemeToggle from "../comun/ThemeToggle";
import { useAuth } from "../../hooks/useAuth.js";
import { toast } from "react-toastify";
import NotificacionesPanel from "../comun/NotificacionesPanel";
import { logError } from "../../lib/logger.js";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../comun/LanguageSwitcher";

const menu = [
  {
    label: "navbar.home",
    to: "/",
    icon: "🏠"
  },
  {
    label: "navbar.exchanges",
    sub: [
      { to: "/permutas", label: "navbar.view_available", icon: "👁️" },
      { to: "/misPermutas", label: "navbar.my_exchanges", icon: "👤" },
      { to: "/solicitarPermuta", label: "navbar.request_exchange", icon: "📝" },
      { to: "/misSolicitudesPermuta", label: "navbar.my_requests", icon: "📄" },
      { to: "/permutasAceptadas", label: "navbar.accepted_exchanges", icon: "📄" },
    ],
  },
  {
    label: "navbar.incidents",
    sub: [
      { to: "/misIncidencias", label: "navbar.my_incidents", icon: "👤" },
      { to: "/reportarIncidencia", label: "navbar.report_incident", icon: "⚠️" },
    ],
  },
];

export default function NavbarEstudiante() {
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


  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">{t("navbar.student_brand")}</div>
        <button className="hamburger" aria-label={t("navbar.menu")} aria-expanded={open} onClick={() => setOpen(!open)}>
          ☰
        </button>

        {/* Overlay para cerrar menú al hacer click fuera */}
        <div className={`navbar-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)}></div>

        <ul className={`nav-links-responsive ${open ? "open" : ""}`}>
          {menu.map((group, idx) => (
            <li key={group.label} className="nav-group">
              {group.to ? (
                <button
                  className="nav-group-btn"
                  onClick={() => handleLinkClick(group.to)}
                >
                  <span className="nav-icon">{group.icon}</span> {t(group.label)}
                </button>
              ) : (
                <>
                  <button
                    className="nav-group-btn"
                    onClick={() => setOpenGroup(openGroup === idx ? null : idx)}
                  >
                    {t(group.label)} {openGroup === idx ? "▲" : "▼"}
                  </button>
                  <ul className={`nav-submenu ${openGroup === idx ? "show" : ""}`}>
                    {group.sub.map((item) => (
                      <li key={item.to}>
                        <button
                          className="nav-link-btn"
                          onClick={() => handleLinkClick(item.to)}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          {t(item.label)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
        {/* Menú clásico para escritorio */}
        <ul className="nav-links">
          {menu.map((group) => (
            <li key={group.label} className={group.sub ? "dropdown" : ""}>
              {group.to ? (
                <Link to={group.to}>{t(group.label)}</Link>
              ) : (
                <>
                  <button className="dropdown-btn">
                    {t(group.label)} <span className="arrow">▼</span>
                  </button>
                  <ul className="dropdown-content">
                    {group.sub.map((item) => (
                      <li key={item.to}>
                        <Link to={item.to}>{t(item.label)}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="nav-icons">
          <LanguageSwitcher />
          <ThemeToggle />
          <button className="nav-icon-button" aria-label={t("common.notifications")} aria-expanded={sidebarVisible} onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBell} className="icon bell-icon" />
          </button>
          <button className="nav-icon-button" aria-label={t("navbar.my_profile")} onClick={() => navigate("/miPerfil")}>
            <FontAwesomeIcon icon={faUser} className="icon user" />
          </button>
          <button className="nav-icon-button" aria-label={t("navbar.logout")} disabled={loggingOut} onClick={handleClickLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="icon fa-sign-out-alt" />
          </button>
        </div>
      </nav>
      {sidebarVisible && <NotificacionesPanel notificaciones={notificaciones}
        cargando={cargando} onClose={() => setSidebarVisible(false)} />}

    </>
  );
}
