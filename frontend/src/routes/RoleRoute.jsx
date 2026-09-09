import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PropTypes from "prop-types";

export const RoleRoute = ({ children, allowedRoles }) => {
  const { t } = useTranslation();
  const { loading, isAuthenticated, user } = useAuth();
  if (loading) return <div role="status">{t("common.loading")}</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user?.rol)) return <Navigate to="/unauthorized" replace />;
  return children;
};
RoleRoute.propTypes = { children: PropTypes.node.isRequired,allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired };
