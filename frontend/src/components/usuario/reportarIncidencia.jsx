import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/user-common.css";
// import "../../styles/reportarIncidencia-style.css"; // Podríamos mantenerlo para reglas muy específicas, pero intentar usar user-common
import { subidaArchivo } from "../../services/subidaArchivos.js";
import { crearIncidencia } from "../../services/incidencia.js";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faPaperclip, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export default function ReportarIncidencia() {
    const navigate = useNavigate();
    const [descripcion, setDescripcion] = useState("");
    const [tipoIncidencia, setTipoIncidencia] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const tiposPermitidos = ['application/pdf', 'image/png'];

    const handleFileChange = (e) => {
        const archivo = e.target.files[0];
        if (archivo) {
            if (tiposPermitidos.includes(archivo.type)) {
                setFile(archivo);
                setFileError("");
            } else {
                setFile(null);
                setFileError("Solo se permiten archivos PDF o PNG");
                e.target.value = null;
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let fileId = null;
        if (file) {
            const formData = new FormData();
            formData.append("tipo", "archivador")
            formData.append("file", file);
            try {
                const response = await subidaArchivo(formData);
                fileId = response?.result?.fileId;
            } catch (error) {
                toast.error("Hubo un problema al subir el archivo.");
                logError(error);
                return;
            }
        }
        try {
            await crearIncidencia(descripcion, tipoIncidencia, fileId);
            toast.success("Incidencia enviada correctamente");
            navigate("/misIncidencias")
        } catch (error) {
            toast.error("Error al enviar la incidencia");
            logError(error);
        }
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
                <div className="page-header">
                    <h1 className="page-title">Reportar Incidencia</h1>
                    <p className="page-subtitle">
                        Si tienes algún problema con la plataforma, indícalo aquí. Trataremos de resolverlo lo antes posible.
                    </p>
                </div>

                <div className="user-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ marginBottom: '10px', color: 'var(--user-primary)', fontWeight: 'bold' }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} /> Instrucciones:
                        </p>
                        <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                            <li>Se descriptivo con el problema.</li>
                            <li>Indica los pasos para reproducir el error si es posible.</li>
                            <li>Puedes adjuntar capturas (PNG) o documentos (PDF) de hasta 10MB.</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="tipoIncidencia" className="form-label">Tipo de Incidencia</label>
                            <select
                                id="tipoIncidencia"
                                value={tipoIncidencia}
                                onChange={(e) => setTipoIncidencia(e.target.value)}
                                required
                                className="form-select"
                            >
                                <option value="">Selecciona el tipo de incidencia</option>
                                <option value="error">Error en la plataforma</option>
                                <option value="permuta">Problema con permutas</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion" className="form-label">Detalles de la incidencia</label>
                            <textarea
                                id="descripcion"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Describe el problema detalladamente..."
                                required
                                className="form-textarea"
                                rows="6"
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="file" className="form-label">
                                Adjuntar Archivo (Opcional)
                            </label>
                            <div className="file-upload-wrapper">
                                <input
                                    type="file"
                                    id="file"
                                    accept=".pdf,.png"
                                    onChange={handleFileChange}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 1 }}
                                />
                                <div className="file-upload-content" style={{ pointerEvents: 'none' }}>
                                    <FontAwesomeIcon icon={faPaperclip} className="file-upload-icon" />
                                    <p className="file-upload-text">
                                        {file ? file.name : "Haz clic o arrastra un archivo aquí"}
                                    </p>
                                    <p className="file-upload-hint">PDF o PNG, Máx 10MB</p>
                                </div>
                            </div>
                            {fileError && <p className="user-error" style={{ textAlign: 'left', padding: '5px 0', fontSize: '0.9rem' }}>{fileError}</p>}
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <button type="submit" className="btn btn-primary btn-full">
                                <FontAwesomeIcon icon={faPaperPlane} /> Enviar Incidencia
                            </button>
                        </div>
                    </form>
                </div>

            </div>
            <div style={{ height: "80px" }} />
        </div>
    );
}
