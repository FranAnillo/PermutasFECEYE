import { useState, useEffect } from "react";
import { obtenerTodosGruposMisAsignaturasUsuario, insertarMisGrupos } from "../../services/grupo.js";
import { useNavigate } from "react-router-dom";
import { logError } from "../../lib/logger.js";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faSave, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "../../styles/user-common.css";

export default function SeleccionarGrupos() {
  const [asignaturas, setAsignaturas] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const ObtenerTodosGruposMisAsignaturasUsuario = async () => {
      try {
        setCargando(true);
        const response = await obtenerTodosGruposMisAsignaturasUsuario();
        if (response && response.result && response.result.result) {
          const agrupadas = response.result.result.reduce((acc, item) => {
            const { codasignatura, nombreasignatura, numgrupo, curso } = item;
            if (!acc[codasignatura]) {
              acc[codasignatura] = {
                codasignatura,
                nombreasignatura,
                curso: curso || "Otros",
                grupos: [],
              };
            }
            if (!acc[codasignatura].grupos.includes(numgrupo)) {
              acc[codasignatura].grupos.push(numgrupo);
            }
            return acc;
          }, {});

          const asignaturasData = Object.values(agrupadas);
          setAsignaturas(asignaturasData);
        }
      } catch (error) {
        logError(error);
        setError("Error al cargar los grupos de asignaturas");
      } finally {
        setCargando(false);
      }
    };
    ObtenerTodosGruposMisAsignaturasUsuario();
  }, []);

  const handleGrupoSeleccionadoParaAsignatura = (codasignatura, numGrupo) => {
    setSeleccionados((prev) => ({
      ...prev,
      [codasignatura]: numGrupo,
    }));
  };

  const handleGrupoPorCursoChange = (curso, numGrupo) => {
    const actualizaciones = {};
    asignaturas.forEach(asignatura => {
      if (asignatura.curso === curso) {
        // Solo asignamos si el grupo existe para esa asignatura
        if (asignatura.grupos.includes(parseInt(numGrupo)) || asignatura.grupos.includes(numGrupo.toString())) {
          actualizaciones[asignatura.codasignatura] = numGrupo;
        }
      }
    });
    setSeleccionados(prev => ({ ...prev, ...actualizaciones }));
  };

  const handleSubmit = async () => {
    const asignaturasSinGrupo = asignaturas.filter(
      ({ codasignatura }) => !seleccionados[codasignatura]
    );

    if (asignaturasSinGrupo.length > 0) {
      toast.warning("Por favor selecciona un grupo para todas las asignaturas.");
      return;
    }

    try {
      for (let [codasignatura, numgrupo] of Object.entries(seleccionados)) {
        await insertarMisGrupos(numgrupo, codasignatura);
      }
      toast.success("Grupos asignados con éxito");
      navigate("/miPerfil");
    } catch (error) {
      toast.error("Ocurrió un error al guardar los grupos");
      logError(error);
    }
  };

  if (cargando) {
    return (
      <div className="page-container">
        <div className="user-loading">Cargando grupos disponibles...</div>
      </div>
    );
  }

  const todasSeleccionadas = asignaturas.length > 0 &&
    asignaturas.every(({ codasignatura }) => seleccionados[codasignatura]);

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">Selección de Grupos</h1>
          <p className="page-subtitle">
            Indica el grupo asignado para cada una de tus asignaturas matriculadas.
            Esto es necesario para gestionar tus permutas correctamente.
          </p>
        </div>

        {error && <div className="user-error">{error}</div>}

        {asignaturas.length > 0 ? (
          <>
            <div className="user-card" style={{ marginBottom: '30px', borderLeft: '4px solid var(--user-primary)' }}>
              <div style={{ fontWeight: 700, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ color: 'var(--user-primary)' }} />
                <span>Configuración Rápida por Curso</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Asigna automáticamente un grupo a todas las asignaturas de un mismo curso.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {[...new Set(asignaturas.map(a => a.curso))].sort().map(curso => (
                  <div key={curso} style={{ flex: '1 1 200px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Curso {curso}:</label>
                    <select
                      className="form-select"
                      onChange={(e) => handleGrupoPorCursoChange(curso, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Asignar grupo --</option>
                      {[...new Set(asignaturas.filter(a => a.curso === curso).flatMap(a => a.grupos))].sort((a, b) => a - b).map(grupo => (
                        <option key={grupo} value={grupo}>Grupo {grupo}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {asignaturas.map(({ codasignatura, nombreasignatura, grupos }) => (
                <div key={codasignatura} className="user-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '15px', color: 'var(--user-primary)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', gap: '10px' }}>
                    <FontAwesomeIcon icon={faLayerGroup} style={{ marginTop: '4px' }} />
                    <span>{nombreasignatura}</span>
                  </div>

                  <div className="form-group" style={{ marginTop: 'auto' }}>
                    <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Tu grupo actual:
                    </label>
                    <select
                      className="form-select"
                      value={seleccionados[codasignatura] || ""}
                      onChange={(e) =>
                        handleGrupoSeleccionadoParaAsignatura(
                          codasignatura,
                          e.target.value
                        )
                      }
                    >
                      <option value="" disabled>-- Selecciona tu grupo --</option>
                      {grupos.map((grupo) => (
                        <option key={grupo} value={grupo}>
                          Grupo {grupo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              margin: '20px auto 100px auto',
              width: '100%',
              maxWidth: '800px',
              background: 'var(--card-bg)',
              padding: '24px 32px',
              borderRadius: '16px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ color: todasSeleccionadas ? 'var(--success-color)' : 'var(--user-primary)' }} />
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {todasSeleccionadas ? "¡Todo listo para guardar!" : "Faltan grupos por seleccionar"}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={!todasSeleccionadas}
                style={{ minWidth: '180px', padding: '14px 28px' }}
              >
                <FontAwesomeIcon icon={faSave} /> Guardar Grupos
              </button>
            </div>
          </>
        ) : (
          <div className="user-card empty-state" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📚</div>
            <h3>No se encontraron asignaturas pendientes</h3>
            <p>Parece que ya tienes todos tus grupos asignados o no tienes asignaturas nuevas.</p>
            <button className="btn btn-primary" onClick={() => navigate("/miPerfil")} style={{ marginTop: '20px', maxWidth: '250px' }}>
              Ir a mi Perfil
            </button>
          </div>
        )}
      </div>
      <div style={{ height: "40px" }} />
    </div>
  );
}
