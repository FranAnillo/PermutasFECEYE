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
      <main className="content home-content">
        <section className="home-brand-hero" aria-labelledby="home-title">
          <div className="home-brand-copy">
            <p className="home-eyebrow">{t("footer.school_name")}</p>
            <h1 id="home-title">{t("common.welcome")}</h1>
            <p className="home-description">{t("common.description")}</p>
          </div>
          <div className="home-faculty-logo-frame">
            <img src="/brand/fceye-facultad.jpg" alt={t("brand.faculty_logo_alt")} className="home-faculty-logo" fetchPriority="high" />
          </div>
        </section>

        <section className="home-management" aria-labelledby="management-title">
          <div className="home-delegation-logo-frame">
            <img src="/brand/delegacion-estudiantes.jpg" alt={t("brand.delegation_logo_alt")} className="home-delegation-logo" loading="lazy" />
          </div>
          <div className="home-management-copy">
            <p className="home-management-label">{t("brand.managed_label")}</p>
            <h2 id="management-title">{t("brand.delegation_name")}</h2>
            <p>{t("brand.managed_description")}</p>
          </div>
        </section>

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
            {notificaciones.length === 0 && <p className="home-empty-notifications">{t("common.no_notifications")}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
