import { useState, useEffect } from "react";
import { obtenerEstudios } from "../../services/estudio";
import "../../styles/user-common.css";
import { actualizarEstudiosUsuario } from "../../services/usuario";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { logError } from "../../lib/logger";

export default function SeleccionarEstudio() {
    const [estudios, setEstudio] = useState([]);
    const [selectedEstudio, setSelectedEstudio] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerEstudio = async () => {
            const response = await obtenerEstudios();
            if (!response.err) {
                setEstudio(response.result.result);
            } else {
                logError(response.errmsg);
            }
        };
        obtenerEstudio();
    }, []);


    const handleSelectChange = (event) => {
        setSelectedEstudio(event.target.value);
    };

    const handleSubmit = async () => {
        try {
            const response = await actualizarEstudiosUsuario(selectedEstudio);
            if (response.result.result === 'Estudios seleccionados') {
                toast.success("Estudio seleccionado correctamente");
                navigate("/miPerfil");
            }
        } catch (error) {
            toast.error("Error en la solicitud.");
            logError(error);
        }
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
                <div className="page-header">
                    <h1 className="page-title">Selecciona tus estudios</h1>
                    <p className="page-subtitle">Elige el grado o máster en el que estás matriculado para mostrarte sus asignaturas.</p>
                </div>
                <section className="user-card study-selection-card">
                    <div className="form-group">
                        <label className="form-label" htmlFor="estudio">Grado o máster</label>
                        <select id="estudio" className="form-select" value={selectedEstudio} onChange={handleSelectChange}>
                            <option value="" disabled>Selecciona un estudio</option>
                            {estudios.map((estudio) => (
                                <option key={estudio.id ?? estudio.nombre} value={estudio.nombre}>{estudio.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="study-selection-help">
                        <p>Solo puedes seleccionar un estudio.</p>
                        <p>Después elegirás las asignaturas y los grupos en los que estás matriculado.</p>
                        <p>Si necesitas corregirlo más adelante, podrás comunicarlo mediante una incidencia.</p>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={!selectedEstudio}>
                        Guardar y continuar
                    </button>
                </section>
            </div>
        </div>
    );
};
