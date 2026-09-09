import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PropTypes from "prop-types";

export const ProtectedRoute = ({ children }) => {
    const { t } = useTranslation();
  const { loading, isAuthenticated } = useAuth();
    if (loading) return <div role="status">{t("common.loading")}</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};
ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };
