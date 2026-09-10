import { useState, useEffect } from "react";
import "../../styles/admin-common.css";
import { getTodasSolicitudesPermuta, actualizarVigenciaPermutas, actualizarVigenciaSolicitudes } from "../../services/permuta";
import { obtenerDatosUsuarioAdmin } from "../../services/usuario";
import { toast } from "react-toastify";
import CrearGradoAdmin from "./CrearGradoAdmin";
import CrearAsignatura from "./CrearAsignatura";
import ImportAsignaturas from "./importAsignaturas";
import { subidaArchivo } from "../../services/subidaArchivos";

export default function MiPerfilAdmin() {
  const [usuario, setUsuario] = useState(null);
  const [permutas, setPermutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filePlantilla, setFilePlantilla] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [modalRetirarOpen, setModalRetirarOpen] = useState(false);
  const [accionRetirarLoading, setAccionRetirarLoading] = useState(false);

  const toggleSection = (sectionName) => {
    setActiveSection(activeSection === sectionName ? null : sectionName);
  };


  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const responseUsuario = await obtenerDatosUsuarioAdmin();
        if (!responseUsuario.err) {
          setUsuario(responseUsuario.result.result);
        } else {
          throw new Error(responseUsuario.errmsg);
        }

        // Obtener lista de permutas
        const responsePermutas = await getTodasSolicitudesPermuta();
        if (!responsePermutas.err) {
          setPermutas(responsePermutas.result.result);
        } else {
          throw new Error(responsePermutas.errmsg);
        }

        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const abrirModalRetirar = () => setModalRetirarOpen(true);
  const cerrarModalRetirar = () => setModalRetirarOpen(false);

  const confirmarRetirarVigencia = async () => {
    setAccionRetirarLoading(true);
    try {
      const [resPermutas, resSolicitudes] = await Promise.all([
        actualizarVigenciaPermutas(),
        actualizarVigenciaSolicitudes()
      ]);

      const errores = [];
      if (resPermutas?.err) errores.push(resPermutas.errmsg || "Error en permutas");
      if (resSolicitudes?.err) errores.push(resSolicitudes.errmsg || "Error en solicitudes");

      if (errores.length === 0) {
        toast.success("Se ha retirado la vigencia de permutas y solicitudes correctamente.");
        // refrescar lista de permutas local
        const ref = await getTodasSolicitudesPermuta();
        if (!ref.err) setPermutas(ref.result.result);
      } else {
        toast.error(errores.join(" — "));
      }
    } catch {
      toast.error("Error al retirar la vigencia.");
    } finally {
      setAccionRetirarLoading(false);
      setModalRetirarOpen(false);
    }
  };

  const exportarCSV = () => {
    if (permutas.length === 0) {
      toast.warning("No hay datos para exportar.");
      return;
    }

    const datosAplanados = permutas.map((permuta) => ({
      solicitud_id: permuta.solicitud_id,
      nombre_completo: permuta.usuario.nombre_completo,
      uvus: permuta.usuario.uvus,
      estudio: permuta.usuario.estudio,
      asignatura_nombre: permuta.asignatura.nombre,
      asignatura_codigo: permuta.asignatura.codigo,
      grupo_solicitante: permuta.grupo_solicitante,
      grupos_deseados: permuta.grupos_deseados.join(" | "),
    }));

    const encabezados = Object.keys(datosAplanados[0]).join(",");
    const filas = datosAplanados.map((fila) =>
      Object.values(fila).map((valor) => `"${valor}"`).join(",")
    );
    const contenidoCSV = [encabezados, ...filas].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "permutas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadPlantilla = async () => {
    if (!filePlantilla) {
      toast.warning("Por favor, selecciona un archivo.");
      return;
    }

    if (filePlantilla.type !== "application/pdf") {
      toast.error("El archivo debe ser un PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("tipo", "plantilla");
    formData.append("file", filePlantilla);

    const promise = subidaArchivo(formData);

    toast.promise(promise, {
      pending: "Subiendo plantilla...",
      success: "Plantilla actualizada correctamente",
      error: "Error al subir la plantilla"
    });

    try {
      await promise;
      setFilePlantilla(null);
      // Reset input value if possible, or just rely on state
      document.getElementById("file-upload-plantilla").value = "";
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="admin-loading">Cargando datos...</div>;
  }

  if (error) {
    return <div className="admin-error">Error: {error}</div>;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-content-wrap">
        <div className="perfil-container">
          <div className="admin-page-header">
            <h1 className="admin-page-title">Perfil de Administrador</h1>
            <p className="admin-page-subtitle">
              Gestione permutas, grados, asignaturas y configuraciones del sistema desde este panel centralizado.
            </p>
          </div>

          {/* Header con Información Personal */}
          <div className="admin-header-card">
            <div className="admin-info">
              <div className="admin-avatar">
                <span className="admin-avatar-icon">👤</span>
              </div>
              <div className="admin-details">
                <h2 className="admin-name">{usuario?.nombre_completo}</h2>
                <p className="admin-email">{usuario?.correo}</p>
              </div>
            </div>
          </div>

          {/* Grid de Secciones Desplegables */}
          <div className="admin-grid">

            {/* Gestión de Permutas */}
            <div className="admin-accordion-section">
              <button
                className={`admin-accordion-header ${activeSection === 'permutas' ? 'active' : ''}`}
                onClick={() => toggleSection('permutas')}
              >
                <span className="admin-section-icon">🔄</span>
                <span className="admin-section-title">Gestión de Permutas</span>
                <span className={`admin-accordion-icon ${activeSection === 'permutas' ? 'rotate' : ''}`}>▼</span>
              </button>
              <div className={`admin-accordion-content ${activeSection === 'permutas' ? 'open' : ''}`}>
                <div className="admin-sub-section">
                  <h3>📥 Exportar Datos</h3>
                  <p className="sub-section-description">Descarga todas las permutas en formato CSV</p>
                  <button className="admin-btn admin-btn-primary" onClick={exportarCSV}>
                    Exportar Permutas en CSV
                  </button>
                </div>

                <div className="admin-sub-section">
                  <h3>📄 Actualizar Plantilla de Solicitud</h3>
                  <p className="sub-section-description">Sube una nueva plantilla PDF para las solicitudes</p>
                  <div className="admin-file-input-wrapper">
                    <input
                      type="file"
                      id="file-upload-plantilla"
                      accept=".pdf"
                      onChange={(e) => setFilePlantilla(e.target.files[0])}
                      className="admin-file-input"
                    />
                    <label htmlFor="file-upload-plantilla" className="admin-file-label">
                      {filePlantilla ? filePlantilla.name : "Seleccionar archivo PDF"}
                    </label>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={handleUploadPlantilla}
                      disabled={!filePlantilla}
                    >
                      Subir Plantilla
                    </button>
                  </div>
                </div>

                <div className="admin-sub-section danger-section">
                  <h3>⚠️ Retirar Vigencia</h3>
                  <p className="sub-section-description warning-text" style={{ color: '#991b1b' }}>
                    Al realizar esta acción todas las permutas y solicitudes dejarán de estar vigentes. Esta acción no puede deshacerse.
                  </p>
                  <button className="admin-btn admin-btn-danger" onClick={abrirModalRetirar}>
                    Retirar la vigencia de las permutas
                  </button>
                </div>
              </div>
            </div>

            {/* Gestión de Asignaturas */}
            <div className="admin-accordion-section">
              <button
                className={`admin-accordion-header ${activeSection === 'asignaturas' ? 'active' : ''}`}
                onClick={() => toggleSection('asignaturas')}
              >
                <span className="admin-section-icon">📚</span>
                <span className="admin-section-title">Gestión de Asignaturas</span>
                <span className={`admin-accordion-icon ${activeSection === 'asignaturas' ? 'rotate' : ''}`}>▼</span>
              </button>
              <div className={`admin-accordion-content ${activeSection === 'asignaturas' ? 'open' : ''}`}>
                <div className="admin-sub-section">
                  <h3>📤 Importar Masivamente</h3>
                  <p className="sub-section-description">Carga múltiples asignaturas desde un archivo</p>
                  <ImportAsignaturas />
                </div>
                <div className="admin-sub-section">
                  <h3>➕ Crear Individualmente</h3>
                  <p className="sub-section-description">Añade una nueva asignatura al sistema</p>
                  <CrearAsignatura />
                </div>
              </div>
            </div>

            {/* Gestión de Grados */}
            <div className="admin-accordion-section">
              <button
                className={`admin-accordion-header ${activeSection === 'grados' ? 'active' : ''}`}
                onClick={() => toggleSection('grados')}
              >
                <span className="admin-section-icon">🎓</span>
                <span className="admin-section-title">Gestión de Grados</span>
                <span className={`admin-accordion-icon ${activeSection === 'grados' ? 'rotate' : ''}`}>▼</span>
              </button>
              <div className={`admin-accordion-content ${activeSection === 'grados' ? 'open' : ''}`}>
                <div className="admin-sub-section">
                  <h3>➕ Crear Nuevo Grado</h3>
                  <p className="sub-section-description">Añade un nuevo grado académico al sistema</p>
                  <CrearGradoAdmin />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de confirmación para retirar vigencia */}
      {modalRetirarOpen && (
        <div className="admin-modal-overlay" onClick={cerrarModalRetirar}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">⚠️ Confirmar acción</h3>
            </div>
            <div className="admin-modal-body">
              <p>Al realizar esta acción todas las permutas y solicitudes no estarán vigentes. Esta acción no puede deshacerse.</p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={cerrarModalRetirar}
                disabled={accionRetirarLoading}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={confirmarRetirarVigencia}
                disabled={accionRetirarLoading}
              >
                {accionRetirarLoading ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ height: "80px" }} />
    </div>
  );
}
