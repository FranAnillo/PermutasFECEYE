import { useState, useEffect } from "react";
import { obtenerTodosGruposMisAsignaturasSinGrupoUsuario } from "../../services/grupo.js";
import { solicitarPermuta } from "../../services/permuta.js";
import { useNavigate } from "react-router-dom";
import "../../styles/user-common.css";
import "../../styles/solicitarPermuta-style.css";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardTeacher, faSave, faCheckCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

export default function SeleccionarGruposSinGrupo() {
  const [asignaturas, setAsignaturas] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ObtenerTodosGruposMisAsignaturasSinGrupoUsuario = async () => {
      try {
        setCargando(true);
        const response = await obtenerTodosGruposMisAsignaturasSinGrupoUsuario();

        if (response && Array.isArray(response.result.result)) {
          const agrupadas = response.result.result.reduce((acc, item) => {
            const { codasignatura, nombreasignatura, numgrupo } = item;
            const key = codasignatura.toString();
            if (!acc[key]) {
              acc[key] = {
                codasignatura: key,
                nombreasignatura,
                grupos: [],
              };
            }
            acc[key].grupos.push(numgrupo);
            return acc;
          }, {});

          setAsignaturas(Object.values(agrupadas));
        } else {
          logError("No se encontraron asignaturas disponibles.");
        }
      } catch (error) {
        logError(error);
        setError("Ocurrió un error al cargar las asignaturas.");
      } finally {
        setCargando(false);
      }
    };

    ObtenerTodosGruposMisAsignaturasSinGrupoUsuario();
  }, []);

  const handleGrupoSeleccionadoParaAsignatura = (codasignatura, numgrupo) => {
    const key = codasignatura.toString();
    setSeleccionados((prev) => {
      const gruposActuales = prev[key] || [];
      const estaSeleccionado = gruposActuales.includes(numgrupo);
      const grupos = estaSeleccionado
        ? gruposActuales.filter((grupo) => grupo !== numgrupo)
        : [...gruposActuales, numgrupo];

      if (grupos.length === 0) {
        const resto = { ...prev };
        delete resto[key];
        return resto;
      }
      return { ...prev, [key]: grupos };
    });
  };

  const handleSubmit = async () => {
    try {
      const keys = Object.keys(seleccionados);
      if (keys.length === 0) {
        toast.info("Por favor, selecciona al menos un grupo.");
        return;
      }

      for (const rawCod of keys) {
        const gruposSeleccionados = seleccionados[rawCod] || [];
        if (gruposSeleccionados.length > 0) {
          // Limpiar y convertir a entero por seguridad (el backend espera enteros)
          const codasignatura = parseInt(rawCod.toString().replace(/\D/g, ''), 10);
          const gruposDeseados = [...new Set(gruposSeleccionados
            .map((grupo) => parseInt(grupo.toString().replace(/\D/g, ''), 10))
            .filter(Number.isInteger))];

          if (!isNaN(codasignatura) && gruposDeseados.length > 0) {
            await solicitarPermuta(codasignatura, gruposDeseados);
          }
        }
      }
      toast.success("Permutas solicitadas con éxito.");
      navigate("/misSolicitudesPermuta");
    } catch (error) {
      toast.error("Ocurrió un error al solicitar las permutas. Intenta nuevamente.");
      logError(error);
    }
  };


  const haySeleccion = asignaturas.some(
    ({ codasignatura }) => (seleccionados[codasignatura.toString()] || []).length > 0
  );

  if (cargando) {
    return (
      <div className="page-container">
        <div className="user-loading">Cargando asignaturas disponibles...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">Solicitar Permuta</h1>
          <p className="page-subtitle">
            Selecciona uno o varios grupos a los que aceptarías cambiarte para cada asignatura.
            Crearemos una solicitud de permuta para que otros estudiantes puedan aceptarla.
          </p>
        </div>

        {error && <div className="user-error">{error}</div>}

        {asignaturas.length > 0 ? (
          <>
            <div className="responsive-card-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '100px' // Margen extra para no tapar con el footer fixed
            }}>
              {asignaturas.map(({ codasignatura, nombreasignatura, grupos }) => (
                <div key={codasignatura.toString()} className="user-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '15px', color: 'var(--user-primary)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ marginTop: '4px' }} />
                    <span>{nombreasignatura}</span>
                  </div>

                  <div className="form-group" style={{ marginTop: 'auto' }}>
                    <span className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Grupos deseados (puedes elegir varios):
                    </span>
                    <div className="swap-group-options" role="group" aria-label={`Grupos deseados para ${nombreasignatura}`}>
                      {grupos.map((grupo) => {
                        const seleccionado = (seleccionados[codasignatura.toString()] || []).includes(grupo);
                        return (
                          <button
                            key={grupo}
                            type="button"
                            role="checkbox"
                            aria-checked={seleccionado}
                            className={`swap-group-option${seleccionado ? " is-selected" : ""}`}
                            onClick={() => handleGrupoSeleccionadoParaAsignatura(codasignatura, grupo)}
                          >
                            Grupo {grupo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {(seleccionados[codasignatura.toString()] || []).length > 0 && (
                    <div style={{ marginTop: '10px', color: 'var(--success-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FontAwesomeIcon icon={faCheckCircle} /> Solicitud lista para G.{seleccionados[codasignatura.toString()].join(", G.")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="responsive-stack mobile-submit-bar" style={{
              margin: '40px auto',
              width: '100%',
              maxWidth: '800px',
              background: 'var(--card-bg)',
              padding: '20px 30px',
              borderRadius: '16px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(43, 87, 154, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ color: 'var(--user-primary)' }} />
                <span className="info-text-responsive" style={{ fontWeight: 500 }}>
                  {haySeleccion ? "¡Todo listo para solicitar!" : "Selecciona al menos un grupo para continuar"}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={!haySeleccion}
                style={{
                  minWidth: 0,
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '1rem'
                }}
              >
                <FontAwesomeIcon icon={faSave} /> Solicitar Ahora
              </button>
            </div>
            {/* Espaciador para no solapar con el footer fixed */}
            <div style={{ height: '120px' }} />

          </>
        ) : (
          <div className="user-card empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
            <h3>No hay asignaturas disponibles</h3>
            <p>Parece que ya tienes grupo asignado en todas tus asignaturas o no estás matriculado.</p>
          </div>
        )}
      </div>
    </div>


  );
}
