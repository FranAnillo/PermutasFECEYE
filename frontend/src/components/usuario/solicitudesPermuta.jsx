import { useState, useEffect } from "react";
import "../../styles/solicitudesPermuta-style.css";
import { obtenerSolicitudesPermuta } from "../../services/permuta";
import { toast } from "react-toastify";
import { cancelarSolicitudPermuta } from "../../services/permuta";
import { useNavigate } from "react-router-dom";
export default function SolicitudesPermuta() {
    const navigate = useNavigate();

    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("todas");

    // Modal para ver detalles (sin botón cancelar dentro del modal)
    const [modalOpen, setModalOpen] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const res = await obtenerSolicitudesPermuta();
                if (!res.err) {
                    // adapta según la estructura real de la respuesta
                    setSolicitudes(res.result?.result || []);
                } else {
                    throw new Error(res.errmsg || "Error al obtener solicitudes");
                }
            } catch (err) {
                setError(err.message || "Error al cargar solicitudes");
            } finally {
                setLoading(false);
            }
        };
        fetchSolicitudes();
    }, []);

    const handleCancelar = async (solicitud_id) => {
        try {
            console.log("Cancelando solicitud con ID:", solicitud_id);
            const res = await cancelarSolicitudPermuta(solicitud_id);
            if (!res.err) {
                // eliminar la solicitud cancelada de la lista local
                setSolicitudes(prev => prev.filter(s => s.solicitud_id !== solicitud_id));
                toast.success("Solicitud cancelada correctamente");
                // si el modal muestra esa solicitud, ciérralo
                if (solicitudSeleccionada?.solicitud_id === solicitud_id) {
                    setModalOpen(false);
                    setSolicitudSeleccionada(null);
                }
            } else {
                toast.error(res.errmsg || "No se pudo cancelar la solicitud");
            }
        } catch (err) {
            toast.error("Error al cancelar la solicitud");
        }
    };

    const abrirModal = (solicitud) => {
        setSolicitudSeleccionada(solicitud);
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setSolicitudSeleccionada(null);
    };

    if (loading) return <div className="loading-text">Cargando solicitudes...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const solicitudesFiltradas =
        filtroEstado === "todas"
            ? solicitudes
            : solicitudes.filter((solicitud) => solicitud.estado === filtroEstado);

    return (
        <div className="page-container">
            <div className="content-wrap">
                <div className="solicitudes-container">
                    <h1 className="solicitudes-title">Mis Solicitudes de Permuta</h1>
                    <p className="solicitudes-description">
                        Aquí puedes ver todas tus solicitudes de permuta. Filtra por estado o abre una solicitud para ver detalles.
                    </p>

                    <div className="filtro-container">
                        <label htmlFor="filtroEstado">Filtrar por estado:</label>
                        <select
                            id="filtroEstado"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="SOLICITADA">Solicitadas</option>
                            <option value="EMPAREJADA">Emparejadas</option>
                            <option value="ACEPTADA">Aceptadas</option>
                            <option value="RECHAZADA">Rechazadas</option>
                            <option value="CANCELADA">Canceladas</option>
                        </select>
                    </div>

                    <div className="solicitudes-content">
                        {solicitudesFiltradas.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '20px'
                            }}>
                                {solicitudesFiltradas.map((solicitud) => {
                                    const sId = solicitud.solicitud_id || solicitud.id;
                                    return (
                                        <div key={sId} className="user-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ color: 'var(--user-primary)', marginBottom: '12px' }}>
                                                    {solicitud.nombre_asignatura}
                                                </h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    <strong>Código:</strong> {solicitud.codigo_asignatura}
                                                </p>
                                                <p><strong>Grupo Actual:</strong> {solicitud.grupo_solicitante}</p>
                                                <p>
                                                    <strong>Grupos Deseados:</strong> {Array.isArray(solicitud.grupos_deseados) ? solicitud.grupos_deseados.join(", ") : solicitud.grupos_deseados}
                                                </p>
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    display: 'inline-block',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: solicitud.estado === 'SOLICITADA' ? 'var(--user-accent)' :
                                                        solicitud.estado === 'ACEPTADA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                                    color: solicitud.estado === 'SOLICITADA' ? 'var(--user-primary)' :
                                                        solicitud.estado === 'ACEPTADA' ? 'var(--success-color)' : 'var(--text-secondary)'
                                                }}>
                                                    {solicitud.estado}
                                                </div>
                                            </div>

                                            <div className="solicitud-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                                <button className="btn btn-primary btn-full" onClick={() => abrirModal(solicitud)}>
                                                    Detalles
                                                </button>

                                                {solicitud.estado === "SOLICITADA" && (
                                                    <button
                                                        className="btn btn-danger btn-full"
                                                        onClick={() => handleCancelar(sId)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="user-card empty-state" style={{
                                textAlign: 'center',
                                padding: '60px 40px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                marginTop: '20px'
                            }}>
                                <div style={{
                                    fontSize: '5rem',
                                    background: 'var(--user-accent)',
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '10px'
                                }}>
                                    📨
                                </div>
                                <h3 style={{ fontSize: '1.8rem', color: 'var(--user-primary)' }}>No tienes solicitudes de permutas registradas</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>
                                    Parece que aún no has solicitado ningún intercambio de grupo. ¡Empieza hoy mismo y encuentra el horario que mejor te venga!
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate("/solicitarPermuta")}
                                    style={{ padding: '12px 30px', fontSize: '1.1rem', marginTop: '10px' }}
                                >
                                    ¡Solicitar Permuta Ahora!
                                </button>
                            </div>
                        )}

                    </div>

                </div>
            </div>

            {/* Modal de detalles - sin botón de cancelar dentro del modal */}
            {modalOpen && solicitudSeleccionada && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Detalles de la Solicitud</h2>
                        <p><strong>Asignatura:</strong> {solicitudSeleccionada.nombre_asignatura} ({solicitudSeleccionada.codigo_asignatura})</p>
                        <p><strong>Grupo Actual:</strong> {solicitudSeleccionada.grupo_solicitante}</p>
                        <p><strong>Grupos Deseados:</strong> {Array.isArray(solicitudSeleccionada.grupos_deseados) ? solicitudSeleccionada.grupos_deseados.join(", ") : solicitudSeleccionada.grupos_deseados}</p>
                        <p><strong>Estado:</strong> {solicitudSeleccionada.estado}</p>
                        <p><strong>Descripción:</strong> {solicitudSeleccionada.descripcion || "—"}</p>

                        <div className="modal-actions">
                            <button onClick={cerrarModal}>Cerrar</button>
                            {/* Nota: no se incluye botón cancelar aquí por requerimiento */}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: "80px" }} /> {/* espacio para el footer */}
        </div>
    );
}