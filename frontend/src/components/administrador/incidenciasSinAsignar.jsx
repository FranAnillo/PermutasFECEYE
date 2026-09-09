import { useEffect, useState } from "react";
import "../../styles/admin-common.css";
import { useNavigate } from "react-router-dom";
import { obtenerIncidenciasSinAsignar, asignarmeIncidencia } from "../../services/incidencia.js";
import { formatearFecha } from "../../lib/formateadorFechas.js";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";

export default function IncidenciasSinAsignar() {
    const navigate = useNavigate();
    const [incidencias, setIncidencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargarIncidencias = async () => {
            try {
                const data = await obtenerIncidenciasSinAsignar();
                setIncidencias(data.result.result);
            } catch (error) {
                setError("Hubo un problema al cargar las incidencias. Por favor, inténtalo de nuevo más tarde.");
                logError(error);
            } finally {
                setCargando(false);
            }
        };
        cargarIncidencias();
    }, []);

    const handleAsignarIncidencia = async (idIncidencia) => {
        try {
            const response = await asignarmeIncidencia(idIncidencia);
            if (!response.err) {
                setIncidencias(incidencias.filter((incidencia) => incidencia.id !== idIncidencia));
                toast.success("Incidencia asignada correctamente.");
            } else {
                throw new Error(response.errmsg);
            }
        } catch (error) {
            toast.error("Hubo un problema al asignar la incidencia.");
            logError(error);
        }
    };

    return (
        <>
            <div className="admin-page-container">
                <div className="admin-content-wrap">
                    {/* Header */}
                    <div className="admin-page-header">
                        <h1 className="admin-page-title">📋 Incidencias Sin Asignar</h1>
                        <p className="admin-page-subtitle">
                            Consulta todas las incidencias sin asignar. Puedes asignarte una incidencia haciendo clic en el botón correspondiente.
                        </p>
                    </div>

                    {/* Contenido */}
                    {cargando ? (
                        <div className="admin-loading">Cargando incidencias...</div>
                    ) : error ? (
                        <div className="admin-error">
                            <p>{error}</p>
                            <button className="admin-btn admin-btn-primary admin-mt-md" onClick={() => navigate("/")}>
                                Volver al inicio
                            </button>
                        </div>
                    ) : incidencias.length === 0 ? (
                        <div className="admin-empty-state">
                            <div className="admin-empty-state-icon">✅</div>
                            <p className="admin-empty-state-text">No hay incidencias sin asignar.</p>
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
                                        <span className="admin-badge admin-badge-danger">
                                            {incidencia.estado_incidencia}
                                        </span>
                                    </div>
                                    <div className="admin-card-body">
                                        <p><strong>Fecha de creación:</strong> {formatearFecha(incidencia.fecha_creacion)}</p>
                                        <p><strong>Tipo:</strong> {incidencia.tipo_incidencia}</p>
                                        <p><strong>Descripción:</strong> {incidencia.descripcion}</p>
                                    </div>
                                    <div className="admin-card-footer">
                                        <button
                                            className="admin-btn admin-btn-primary"
                                            onClick={() => handleAsignarIncidencia(incidencia.id)}
                                        >
                                            👤 Asignarme
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div style={{ height: "80px" }} />
        </>
    );
}
