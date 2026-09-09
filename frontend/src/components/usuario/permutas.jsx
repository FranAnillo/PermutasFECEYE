import { useState, useEffect } from "react";
import "../../styles/user-common.css";
import { obtenerPermutasInteresantes, aceptarPermutaSolicitudesPermuta } from "../../services/permuta.js";
import { useNavigate } from "react-router-dom";
import { logError } from "../../lib/logger.js";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchangeAlt, faCheck, faBookReader } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

export default function Permutas() {
  const { t } = useTranslation();
  const [permutas, setPermutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPermutas();
  }, []);

  const cargarPermutas = async () => {
    try {
      const response = await obtenerPermutasInteresantes();
      if (response && response.result && Array.isArray(response.result.result)) {
        setPermutas(response.result.result);
      } else {
        setError(t("available_swaps.error_loading"));
        logError(response);
      }
      setCargando(false);
    } catch (error) {
      setError(t("available_swaps.error_loading"));
      setCargando(false);
      logError(error);
    }
  };

  const handleAceptarPermuta = async (solicitudId) => {
    try {
      await aceptarPermutaSolicitudesPermuta(solicitudId);
      toast.success(t("available_swaps.success_accepted"));
      navigate("/misPermutas");
    } catch (error) {
      toast.error(t("available_swaps.error_accepted"));
      setError(t("available_swaps.error_accepted"));
      logError(error);
    }
  };

  if (cargando) {
    return (
      <div className="page-container">
        <div className="user-loading">{t("available_swaps.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="user-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">{t("available_swaps.title")}</h1>
          <p className="page-subtitle">
            {t("available_swaps.subtitle")}
          </p>
        </div>

        {permutas.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {permutas.map((permuta) => (
              <div key={permuta.solicitud_id} className="user-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="permuta-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: 'var(--user-primary)' }}>
                    <FontAwesomeIcon icon={faBookReader} style={{ marginRight: '8px' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{permuta.siglas_asignatura}</h3>
                  </div>
                  <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                  <p><strong><FontAwesomeIcon icon={faExchangeAlt} /> {t("available_swaps.swap_label")}:</strong> G.{permuta.grupo_solicitante} ➝ G.{permuta.grupo_deseado}</p>
                  <p style={{ marginTop: '5px', color: 'var(--text-secondary)' }}>
                    <small>{t("available_swaps.code_label")}: {permuta.codigo_asignatura}</small>
                  </p>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button
                    className="btn btn-success btn-full"
                    onClick={() => handleAceptarPermuta(permuta.solicitud_id)}>
                    <FontAwesomeIcon icon={faCheck} /> {t("available_swaps.accept_btn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="user-card empty-state" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
            <h3>{t("available_swaps.empty_title")}</h3>
            <p>{t("available_swaps.empty_msg")}</p>
            <button className="btn btn-primary" onClick={() => navigate("/solicitarPermuta")} style={{ marginTop: '20px' }}>
              {t("available_swaps.request_btn")}
            </button>
          </div>
        )}
      </div>
      <div style={{ height: "80px" }} />
    </div>
  );
}
