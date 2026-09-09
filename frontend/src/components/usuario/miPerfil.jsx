import { useState, useEffect } from "react";
import "../../styles/miPerfil-style.css";
import { obtenerDatosUsuario } from "../../services/usuario";
import { obtenerMiGrupoAsignatura } from "../../services/grupo";
import { superarAsignaturasUsuario } from "../../services/asignaturas";
import SeleccionarEstudio from "../usuario/seleccionarEstudio";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faBookOpen, faUserGraduate, faEnvelope, faUniversity } from "@fortawesome/free-solid-svg-icons";

export default function MiPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        // Obtener datos del usuario
        const responseUsuario = await obtenerDatosUsuario();
        if (!responseUsuario.err) {
          setUsuario(responseUsuario.result.result);
        } else {
          throw new Error(responseUsuario.errmsg);
        }
        // Obtener asignaturas y grupos
        const responseAsignaturas = await obtenerMiGrupoAsignatura();
        if (!responseAsignaturas.err) {
          setAsignaturas(responseAsignaturas.result.result);
        } else {
          throw new Error(responseAsignaturas.errmsg);
        }
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    obtenerDatos();
  }, []);

  const manejarSuperarAsignatura = async (idAsignatura, codigo) => {
    try {
      const response = await superarAsignaturasUsuario(codigo);
      if (!response.err) {
        const asignaturaAprobada = asignaturas.find(asignatura => asignatura.id === idAsignatura);
        setAsignaturas(asignaturas.filter(asignatura => asignatura.id !== idAsignatura));
        setMensajeExito(`¡Enhorabuena! Has aprobado ${asignaturaAprobada.asignatura}.`);

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setMensajeExito(""), 5000);
      } else {
        throw new Error(response.errmsg);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const manejarSuperarTodasAsignaturas = async () => {
    if (asignaturas.length === 0) return;

    setLoading(true);
    try {
      for (const asignatura of asignaturas) {
        const response = await superarAsignaturasUsuario(asignatura.codigo);
        if (response.err) {
          throw new Error(`Error al superar ${asignatura.asignatura}: ${response.errmsg}`);
        }
      }
      setAsignaturas([]);
      setMensajeExito("¡Enhorabuena! Has aprobado todas tus asignaturas.");
      setTimeout(() => setMensajeExito(""), 5000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          Cargando tu perfil...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>⚠️ Ocurrió un error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {!usuario?.titulacion && <SeleccionarEstudio />}

      <div className="content-wrap">
        <div className="perfil-container">

          {/* Header de Página */}
          <div className="perfil-header-section">
            <h1 className="perfil-title">Mi Perfil</h1>
            <div className="perfil-subtitle">
              <p>Gestiona tus asignaturas matriculadas y celebra tus aprobados. Mantén tu progreso al día.</p>
            </div>
          </div>

          {/* Mensaje de Éxito */}
          {mensajeExito && (
            <div className="success-banner">
              <FontAwesomeIcon icon={faCheckCircle} size="lg" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {/* User Header Card */}
          <div className="user-header-card">
            <div className="user-avatar-container">
              <FontAwesomeIcon icon={faUserGraduate} className="user-avatar-icon" />
            </div>
            <div className="user-info">
              <h2 className="user-name">{usuario.nombre_completo}</h2>
              <div className="user-email">
                <FontAwesomeIcon icon={faEnvelope} /> {usuario.correo}
              </div>
              <div className="user-badges">
                {usuario.titulacion && (
                  <span className="badge badge-degree">
                    <FontAwesomeIcon icon={faUniversity} style={{ marginRight: '6px' }} />
                    {usuario.titulacion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Asignaturas */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                <FontAwesomeIcon icon={faBookOpen} />
                <span>Mis Asignaturas en Curso</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {asignaturas.length > 0 && (
                  <button
                    className="btn btn-success"
                    style={{ width: 'auto' }}
                    onClick={manejarSuperarTodasAsignaturas}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} /> Aprobar Todas
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  style={{ width: 'auto' }}
                  onClick={() => navigate("/seleccionarAsignaturas")}
                >
                  + Matricular Nuevas
                </button>
              </div>
            </div>

            {asignaturas.length > 0 ? (
              <div className="asignaturas-grid">
                {asignaturas.map((asignatura) => (
                  <div key={asignatura.id} className="asignatura-card">
                    <div className="asignatura-header">
                      <span className="grupo-badge">Grupo {asignatura.numgrupo}</span>
                    </div>
                    <div className="asignatura-name">{asignatura.asignatura}</div>

                    <div className="asignatura-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => manejarSuperarAsignatura(asignatura.id, asignatura.codigo)}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Marcar como Aprobada
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                <h3>No tienes asignaturas en curso</h3>
                <p>¡Es un buen momento para matricularte en nuevas asignaturas!</p>
                <button
                  className="btn btn-primary"
                  style={{ maxWidth: '200px', margin: '20px auto' }}
                  onClick={() => navigate("/seleccionarAsignaturas")}
                >
                  Seleccionar Asignaturas
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      <div style={{ height: "80px" }} />
    </div>
  );
}