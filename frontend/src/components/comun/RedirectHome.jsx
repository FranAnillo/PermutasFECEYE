import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RedirectHome() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.rol === "administrador") {
        navigate("/admin");  
      } else if (user?.rol === "estudiante") {
        navigate("/estudiante");  
      }
    }
  }, [isAuthenticated, user, navigate]);

  return null;
};
