import { useState, useEffect } from "react";
import "../../styles/user-common.css";
import { obtenerPermutasAgrupadasPorUsuario, generarBorradorPermuta } from "../../services/permuta.js";
import { useNavigate } from "react-router-dom";
import { obtenerSesion } from "../../services/login.js";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { useTranslation } from "react-i18next";

export default function PermutasAceptadas() {
  const { t } = useTranslation();
  const [permutas, setPermutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    obtenerPermutasAgrupadas();
    obtenerDatosUsuario();
  }, []);

  const obtenerPermutasAgrupadas = async () => {
    try {
      const response = await obtenerPermutasAgrupadasPorUsuario();
      if (
        response &&
        response.result &&
        Array.isArray(response.result.result)
      ) {
        setPermutas(response.result.result);
      } else {
        setError(t("accepted_swaps.error_loading"));
        logError(response);
      }
      setCargando(false);
    } catch (error) {
      setError(t("accepted_swaps.error_loading"));
      setCargando(false);
      logError(error);
    }
  };

  const obtenerDatosUsuario = async () => {
    try {
      const response = await obtenerSesion();
      if (response) {
        setUsuario(response.user.uvus);
      } else {
        setError(t("accepted_swaps.error_loading"));
      }
    } catch (error) {
      setError(t("accepted_swaps.error_loading"), error);
    }
  };


  const handleGenerarPermuta = async (IdsPermuta) => {
    try {
      await generarBorradorPermuta(IdsPermuta);
      toast.success(t("accepted_swaps.success_generated"));
      navigate("/generarPermuta");
    } catch (error) {
      toast.error(t("accepted_swaps.error_generated"));
      setError(t("accepted_swaps.error_generated"));
      logError(error);
    }
  };

  if (cargando) {
    return <div className="user-loading">{t("accepted_swaps.loading")}</div>;
  }

  if (error) {
    return <div className="user-error">{error}</div>;
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <header className="page-header">
          <h2 className="page-title">{t("accepted_swaps.title")}</h2>
          <p className="page-subtitle">
            {t("accepted_swaps.subtitle")}
          </p>
        </header>

        {permutas.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {permutas.map((grupoPermuta, index) => {
              const usuarios = grupoPermuta.usuarios ?? [];
              const permutasDetalles = grupoPermuta.permutas ?? [];
              const todasNull = permutasDetalles.every((permuta) => permuta.estado_permuta_asociada === null);
              const todasBorrador = permutasDetalles.every((permuta) => permuta.estado_permuta_asociada === "BORRADOR");
              const puedeGenerarPermuta = usuario === usuarios[0] && todasNull
              const puedeContinuarPermuta = usuario === usuarios[0] && todasBorrador;
              const todasFirmadas = permutasDetalles.length > 0 && permutasDetalles.every((permuta) => permuta.estado_permuta_asociada === "FIRMADA");
              const puedeCompletarPermuta = usuario === usuarios[1] && todasFirmadas;
              const todasFinalizadas = permutasDetalles.every((permuta) => (permuta.estado_permuta_asociada === "ACEPTADA" || permuta.estado_permuta_asociada === "VALIDADA"));
              const IdsPermuta = permutasDetalles.map((permuta) => permuta.permuta_id);

              // Saltar si los datos son incompletos
              if (usuarios.length < 2 || permutasDetalles.length === 0) {
                return null;
              }

              return (
                <div key={index} className="user-card">
                  <div className="permuta-info" style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '8px 0' }}>
                      <strong>{t("accepted_swaps.student_1")}:</strong> {usuarios[0]}
                    </p>
                    <p style={{ margin: '8px 0' }}>
                      <strong>{t("accepted_swaps.student_2")}:</strong> {usuarios[1]}
                    </p>

                    {permutasDetalles.map((permuta) => (
                      <div key={permuta.permuta_id} className="permuta-detalle" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--user-accent)', borderRadius: 'var(--border-radius-sm)' }}>
                        <p style={{ margin: '4px 0', fontSize: '0.95em' }}>
                          <strong>{t("accepted_swaps.subject")}:</strong> {permuta.nombre_asignatura}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '0.95em' }}>
                          <strong>{t("accepted_swaps.code")}:</strong> {permuta.codigo_asignatura}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '0.95em' }}>
                          <strong>{t("accepted_swaps.group")} {usuarios[0]}:</strong> {permuta.grupo_1}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '0.95em' }}>
                          <strong>{t("accepted_swaps.group")} {usuarios[1]}:</strong> {permuta.grupo_2}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {puedeGenerarPermuta && (
                      <button className="btn btn-success btn-full" onClick={() => handleGenerarPermuta(IdsPermuta)}>{t("accepted_swaps.generate_swap")}</button>
                    )}
                    {puedeContinuarPermuta && (
                      <button className="btn btn-success btn-full" onClick={() => navigate("/generarPermuta")}>{t("accepted_swaps.continue_swap")}</button>
                    )}
                    {puedeCompletarPermuta && (
                      <button className="btn btn-primary btn-full" onClick={() => navigate("/generarPermuta")}>{t("accepted_swaps.complete_swap")}</button>
                    )}
                    {todasFinalizadas && (
                      <button className="btn btn-primary btn-full" onClick={() => navigate("/generarPermuta")}>{t("accepted_swaps.view_swap")}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="user-error">{t("accepted_swaps.no_swaps")}</div>
        )}
      </div>
    </div>
  );
}
