import { useState, useEffect } from "react";
import "../../styles/home-style.css";
import { obtenerNotificaciones } from "../../services/notificacion.js";
import { formatearFecha } from "../../lib/formateadorFechas.js";
import { logError } from "../../lib/logger.js";
import { useTranslation } from "react-i18next";


export default function Home() {
  const { t } = useTranslation();
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
          setNotificaciones([]);
        }
      } catch (error) {
        logError(error);
      } finally {
        setCargando(false);
      }
    };
    cargarNotificaciones();
  }, []);

  if (cargando) {
    return <div className="loading-text">{t("common.loading")}</div>;
  }


  return (
    <div className="home-container">
      <div className="content">
        <h1>{t("common.welcome")}</h1>
        <p>{t("common.description")}</p>
        <div className="notificaciones">
          <h2>{t("common.last_notifications")}</h2>

          <div className="notificaciones-cards">
            {notificaciones.slice(0, 9).map((notificacion) => (
              <div className="notificacion-card" key={notificacion.id}>
                <div className="notificacion-contenido">
                  <h3>{notificacion.contenido}</h3>
                  <p>{formatearFecha(notificacion.fecha_creacion)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
