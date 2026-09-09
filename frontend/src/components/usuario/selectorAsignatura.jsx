import "../../styles/user-common.css";
// import "../../styles/selectorAsignatura-style.css"; // Estilo antiguo
import { useState, useEffect } from "react";
import { obtenerAsignaturasEstudio, actualizarAsignaturasUsuario } from "../../services/asignaturas";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faFilter, faSave } from "@fortawesome/free-solid-svg-icons";

export default function SelectorAsignatura() {
  const [asignaturas, setAsignatura] = useState([]);
  const [filteredAsignaturas, setFilteredAsignaturas] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const response = await obtenerAsignaturasEstudio();
        if (!response.err) {
          const asignaturasData = response.result.result;
          setAsignatura(asignaturasData);
          const cursosUnicos = [...new Set(asignaturasData.map((a) => a.curso))];
          setCursos(cursosUnicos);
          setCursoSeleccionado(cursosUnicos[0] || "");
        } else {
          logError(response.errmsg);
        }
      } catch (error) {
        logError(error);
      }
    };
    fetchAsignaturas();
  }, []);

  useEffect(() => {
    if (cursoSeleccionado) {
      const asignaturasFiltradas = asignaturas.filter(
        (a) => a.curso === cursoSeleccionado
      );
      setFilteredAsignaturas(asignaturasFiltradas);
    }
  }, [cursoSeleccionado, asignaturas]);

  const handleCheckboxChange = (codigo) => {
    setSelectedItems((prev) =>
      prev.includes(codigo)
        ? prev.filter((item) => item !== codigo)
        : [...prev, codigo]
    );
  };

  const enviarSeleccion = async () => {
    if (selectedItems.length === 0) return;
    setLoading(true);
    // Nota: Idealmente esto debería ser una llamada batch, si la API lo permite en el futuro
    for (const codigo of selectedItems) {
      try {
        await actualizarAsignaturasUsuario(codigo);
      } catch (error) {
        logError(`Error al enviar la asignatura ${codigo}: ${error}`);
      }
    }
    setLoading(false);
    toast.success("Todas las asignaturas seleccionadas han sido enviadas.");
    navigate("/seleccionarGrupos");
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="user-loading">Guardando selección...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">Seleccionar Asignaturas</h1>
          <p className="page-subtitle">Elige las asignaturas en las que quieres matricularte este curso.</p>
        </div>

        <div className="user-card" style={{ maxWidth: '800px', margin: '0 auto' }}>

          <div className="form-group" style={{ maxWidth: '300px', margin: '0 auto 30px auto' }}>
            <label htmlFor="curso" className="form-label" style={{ textAlign: 'center' }}>
              <FontAwesomeIcon icon={faFilter} /> Filtrar por curso:
            </label>
            <select
              id="curso"
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              className="form-select"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-primary)' }}
            >
              {cursos.map((curso) => (
                <option key={curso} value={curso}>
                  {curso}º Curso
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', padding: '10px' }}>
            {filteredAsignaturas.length > 0 ? filteredAsignaturas.map((asignatura) => {
              const isSelected = selectedItems.includes(asignatura.codigo);
              return (
                <div
                  key={asignatura.codigo}
                  onClick={() => handleCheckboxChange(asignatura.codigo)}
                  style={{
                    padding: '15px',
                    border: `2px solid ${isSelected ? 'var(--user-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    background: isSelected ? 'var(--user-accent)' : 'var(--card-bg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }} // Manejado por el div parent
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--user-primary)' }}
                    readOnly
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)' }}>{asignatura.nombre}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Código: {asignatura.codigo}</span>
                  </div>
                </div>
              );
            }) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay asignaturas disponibles para este curso.</p>
            )}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={enviarSeleccion}
              disabled={selectedItems.length === 0}
              style={{ minWidth: '200px' }}
            >
              <FontAwesomeIcon icon={faSave} /> Guardar ({selectedItems.length})
            </button>
          </div>

        </div>
      </div>
      <div style={{ height: "80px" }} />
    </div>
  );
}
