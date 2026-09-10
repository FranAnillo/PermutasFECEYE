import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBellConcierge,
  faBug,
  faBullhorn,
  faExchangeAlt,
  faFileLines,
  faHome,
  faPlusCircle,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const studentItems = [
  { to: "/estudiante", label: "Inicio", icon: faHome },
  { to: "/permutas", label: "Permutas", icon: faExchangeAlt },
  { to: "/solicitarPermuta", label: "Solicitar", icon: faPlusCircle, primary: true },
  { to: "/misSolicitudesPermuta", label: "Solicitudes", icon: faFileLines },
  { to: "/miPerfil", label: "Perfil", icon: faUser },
];

const adminItems = [
  { to: "/admin", label: "Inicio", icon: faHome },
  { to: "/incidenciasSinAsignar", label: "Pendientes", icon: faBellConcierge },
  { to: "/incidencias", label: "Incidencias", icon: faBug, primary: true },
  { to: "/crearNotificacion", label: "Aviso", icon: faBullhorn },
  { to: "/gestionUsuarios", label: "Usuarios", icon: faUsers },
];

export default function MobileBottomNavigation({ variant }) {
  const items = variant === "admin" ? adminItems : studentItems;
  return (
    <nav className={`mobile-bottom-nav mobile-bottom-nav--${variant}`} aria-label="Navegación principal móvil">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `mobile-bottom-nav__item${isActive ? " is-active" : ""}${item.primary ? " is-primary" : ""}`}
        >
          <span className="mobile-bottom-nav__icon" aria-hidden="true">
            <FontAwesomeIcon icon={item.icon} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

MobileBottomNavigation.propTypes = {
  variant: PropTypes.oneOf(["student", "admin"]).isRequired,
};
