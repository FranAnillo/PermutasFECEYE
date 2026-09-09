import { useEffect, useState } from "react";
import "../../styles/admin-common.css";
import { obtenerIncidenciasAsignadasAdmin, solucionarIncidencia } from "../../services/incidencia.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { notificarCierreIncidencia } from "../../services/notificacion.js";

export default function IncidenciasAsignadasAdmin() {
  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mensajeCierre, setMensajeCierre] = useState("");
  const [incidenciaAResolver, setIncidenciaAResolver] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarIncidencias = async () => {
      try {
        const data = await obtenerIncidenciasAsignadasAdmin();
        setIncidencias(data.result.result);
      } catch (error) {
        logError(error);
      } finally {
        setCargando(false);
      }
    };
    cargarIncidencias();
  }, []);

  const handleAbrirModal = (idIncidencia) => {
    setIncidenciaAResolver(idIncidencia);
    setMensajeCierre("");
    setModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setMensajeCierre("");
  };

  const handleEnviarMensajeYCerrar = async () => {
    if (!mensajeCierre.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }
    try {
      await notificarCierreIncidencia(incidenciaAResolver, mensajeCierre);
      await handleResolverIncidencia(incidenciaAResolver);
      handleCerrarModal();
    } catch (error) {
      toast.error("Error al notificar el cierre de la incidencia");
      logError(error);
    }
  };

  const handleResolverIncidencia = async (idIncidencia) => {
    try {
      const response = await solucionarIncidencia(idIncidencia);
      if (!response.err) {
        setIncidencias(incidencias.filter((incidencia) => incidencia.id !== idIncidencia));
        toast.success(`Incidencia ${idIncidencia} resuelta correctamente`);
      } else {
        logError(response.errmsg);
      }
    } catch (error) {
      toast.error(`Error al resolver la incidencia ${idIncidencia}`);
      logError(error);
    }
  };

  return (
    <>
      <div className="admin-page-container">
        <div className="admin-content-wrap">
          {/* Header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">🐛 Mis Incidencias</h1>
            <p className="admin-page-subtitle">
              Consulta el estado de tus incidencias asignadas. Puedes resolverlas haciendo clic en el botón correspondiente.
              Si presionas en ver incidencia verás el archivo adjunto si el usuario adjuntó algo.
            </p>
          </div>

          {/* Contenido */}
          {cargando ? (
            <div className="admin-loading">Cargando incidencias...</div>
          ) : incidencias.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-state-icon">📭</div>
              <p className="admin-empty-state-text">No tienes incidencias asignadas.</p>
            </div>
          ) : (
            <div className="admin-grid admin-grid-2">
              {incidencias.map((incidencia) => (
                <div key={incidencia.id} className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">
                      <span className="admin-card-icon">🎫</span>
                      Incidencia #{incidencia.id}
                    </h2>
                    <span className="admin-badge admin-badge-warning">
                      {incidencia.estado_incidencia}
                    </span>
                  </div>
                  <div className="admin-card-body">
                    <p><strong>Fecha de Creación:</strong> {new Date(incidencia.fecha_creacion).toLocaleDateString()}</p>
                    <p><strong>Tipo:</strong> {incidencia.tipo_incidencia}</p>
                    <p><strong>Descripción:</strong> {incidencia.descripcion}</p>
                  </div>
                  <div className="admin-card-footer">
                    <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => navigate(`/incidencias/${incidencia.id}`)}>
                      Ver Detalle
                    </button>
                    <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => handleAbrirModal(incidencia.id)}>
                      ✓ Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={handleCerrarModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">✉️ Mensaje de Cierre</h3>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-label">Mensaje para el usuario</label>
                <textarea
                  className="admin-textarea"
                  value={mensajeCierre}
                  onChange={(e) => setMensajeCierre(e.target.value)}
                  placeholder="Escribe el mensaje que se enviará al usuario..."
                  rows={6}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={handleCerrarModal}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleEnviarMensajeYCerrar}>
                Enviar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: "80px" }} />
    </>
  );
}
