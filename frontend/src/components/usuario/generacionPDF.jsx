import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import {
  obtenerPlantillaPermuta,
  subirPDFDocumento,
  descargarPDFDocumento,
} from "../../services/subidaArchivos.js";
import {
  obtenerDocumentoPermuta,
  firmarPermuta,
  aceptarPermuta,
  validarSolicitudPermuta,
} from "../../services/permuta.js";
import "../../styles/user-common.css";
import "../../styles/generacionPDF-style.css";

import {
  validarDNI,
  validarLetraDNI,
  validarCampoObligatorio,
  validarCodigoPostal,
  validarTelefono,
} from "../../lib/validadores.js";
import Modal from "./Modal.jsx";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { useTranslation } from "react-i18next";
import { asegurarCamposPlantillaPermuta } from "../../lib/plantillaPermutaPDF.js";
import {
  prepararDatosDocumento,
  validarDatosSistemaDocumento,
} from "../../lib/prepararDatosDocumento.js";

export default function GeneracionPDF() {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [letraDNI, setLetraDNI] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [poblacion, setPoblacion] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [provincia, setProvincia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cursoSolicitante, setCursoSolicitante] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [permutas, setPermutas] = useState([]);
  const [permutaId, setPermutaId] = useState(null);
  const [estadoPermuta, setEstadoPermuta] = useState("BORRADOR");
  const [pdfExistente, setPdfExistente] = useState(null);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({
    nombre: "",
    apellidos: "",
    dni: "",
    letraDNI: "",
    domicilio: "",
    poblacion: "",
    codigoPostal: "",
    provincia: "",
    telefono: "",
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentoId = Number(searchParams.get('documento'));
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [puedeValidar, setPuedeValidar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    const cargarDatos = async () => {
      setCargandoDatos(true);
      setErrorCarga('');
      setPdfExistente(null);
      setPdfUrl(null);
      setFile(null);
      setErrors({});
      setPuedeEditar(false);
      setPuedeValidar(false);
      setNombre(''); setApellidos(''); setDni(''); setLetraDNI('');
      setDomicilio(''); setPoblacion(''); setCodigoPostal(''); setProvincia(''); setTelefono('');
      setCursoSolicitante('');
      try {
        if (!Number.isSafeInteger(documentoId) || documentoId < 1) return;
        const response = await obtenerDocumentoPermuta(documentoId);
        const doc = response?.result?.result;
        if (doc?.id !== documentoId || !['BORRADOR', 'FIRMADA', 'ACEPTADA', 'VALIDADA'].includes(doc.estado)) {
          throw new Error('El servidor no ha devuelto un documento válido.');
        }
        if (!activo) return;
        setPermutaId(doc.id);
        setEstadoPermuta(doc.estado);
        setPuedeEditar(doc.puedeEditar === true);
        setPuedeValidar(doc.puedeValidar === true);
        if (doc.estado === 'BORRADOR') {
          const datos = prepararDatosDocumento(doc.grupo, doc.estudiante_cumplimentado_1);
          const faltantes = validarDatosSistemaDocumento(datos);
          if (faltantes.length) throw new Error('No se puede generar el documento. Revisa los datos de los perfiles y asignaturas: ' + faltantes.join(', ') + '.');
          setUsuarios(datos.usuarios);
          setPermutas(datos.permutas);
        } else {
          const bytes = await descargarPDFDocumento(doc.id);
          if (!activo) return;
          setPdfExistente(bytes);
          setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
        }
      } catch (error) {
        if (activo) { setErrorCarga(error.message || 'No se pudo cargar el documento.'); logError(error); }
      } finally { if (activo) setCargandoDatos(false); }
    };
    cargarDatos();
    return () => { activo = false; };
  }, [documentoId]);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const generarPDF = async () => {
    try {
      if (!puedeEditar || estadoPermuta !== 'BORRADOR') throw new Error('No puedes editar este documento.');
      const existingPdfBytes = await obtenerPlantillaPermuta();

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.setSubject(`Permutas FCEYE: documento ${permutaId}`);
      const form = asegurarCamposPlantillaPermuta(pdfDoc);
      if (permutas.length > 10) throw new Error("El documento admite un máximo de 10 cambios");

      const setSystemField = (fieldName, value) => {
        const field = form.getTextField(fieldName);
        field.setText(String(value ?? ""));
        field.enableReadOnly();
      };

      // Datos conocidos por el sistema y fecha de firma.
      usuarios.forEach((usuario, index) => {
        const numero = index + 1;
        setSystemField(`EMAIL_${numero}`, usuario.correo);
        setSystemField(`TITULACION_${numero}`, usuario.estudio);
      });
      setSystemField('CURSO_SOLICITANTE_1', cursoSolicitante);
      setSystemField("LOCALIDAD_FECHA", "Sevilla");
      const fecha = new Date();
      setSystemField('DIA', String(fecha.getDate()).padStart(2, '0'));
      setSystemField('MES', fecha.toLocaleString('es-ES', { month: 'long' }).toUpperCase());
      setSystemField('ANIO', String(fecha.getFullYear()).slice(-2));

      // Las dos tablas reflejan los mismos cambios desde la perspectiva de cada estudiante.
      for (let index = 0; index < 10; index++) {
        const asignatura = permutas[index];
        for (let estudiante = 1; estudiante <= 2; estudiante++) {
          const numeroFila = index + 1;
          const nombreAsignatura = String(asignatura?.nombre_asignatura ?? "");
          setSystemField(`ASIGNATURA_${estudiante}_${numeroFila}`, nombreAsignatura);
          setSystemField(`CURSO_${estudiante}_${numeroFila}`, asignatura?.curso_asignatura);
          setSystemField(`GRUPO_ACTUAL_${estudiante}_${numeroFila}`, asignatura?.[`grupo_actual_${estudiante}`]);
          setSystemField(`GRUPO_NUEVO_${estudiante}_${numeroFila}`, asignatura?.[`grupo_nuevo_${estudiante}`]);
        }
      }

      const estudianteActual = estadoPermuta === "BORRADOR" ? 1 : 2;
      if (estadoPermuta === "BORRADOR" || estadoPermuta === "FIRMADA") {
        const datosPersonales = {
          APELLIDOS: apellidos,
          NOMBRE: nombre,
          DNI: `${dni}${letraDNI}`,
          DOMICILIO: domicilio,
          COD_POSTAL: codigoPostal,
          LOCALIDAD: poblacion,
          PROVINCIA: provincia,
          TELEFONO: telefono,
        };
        Object.entries(datosPersonales).forEach(([campo, valor]) => {
          setSystemField(`${campo}_${estudianteActual}`, valor);
        });
      }

      return await pdfDoc.save();
    } catch (error) {
      toast.error(error?.message || t("pdf_generation.errors.generation_error"));
      logError(error);
      return null;
    }
  };

  const mostrarPDF = async () => {
    if (!validarFormulario()) {
      toast.warning(t("pdf_generation.errors.fix_errors"));
      return;
    }
    const pdfBytes = await generarPDF();
    if (!pdfBytes) return;
    const pdfUrl = URL.createObjectURL(
      new Blob([pdfBytes], { type: "application/pdf" })
    );
    setPdfUrl(pdfUrl);
  };

  const descargarPDF = async () => {
    if (estadoPermuta !== "BORRADOR" && pdfExistente) {
      saveAs(new Blob([pdfExistente], { type: "application/pdf" }), "solicitud-permutas.pdf");
      return;
    }
    if (!validarFormulario()) {
      toast.warning(t("pdf_generation.errors.fix_errors"));
      return;
    }
    const pdfBytes = await generarPDF();
    if (!pdfBytes) return;
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(pdfBlob, "solicitud-permutas.pdf");
  };

  const handleFileChange = e => {
    const selected = e.target.files[0];
    setFile(null);
    if (!selected) return;
    if (!/\.pdf$/i.test(selected.name) || (selected.type && selected.type !== 'application/pdf') || selected.size > 10 * 1024 * 1024) {
      toast.error('Selecciona un PDF de hasta 10 MB.');
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (enviando || !puedeEditar) return;
    if (!file) { toast.warning(t('pdf_generation.errors.select_file')); return; }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await subirPDFDocumento(permutaId, formData);
      const fileId = response?.result?.fileId;
      if (!fileId) throw new Error('No se ha recibido el archivo subido.');
      if (estadoPermuta === 'BORRADOR') await firmarPermuta(fileId, permutaId);
      else if (estadoPermuta === 'FIRMADA') await aceptarPermuta(fileId, permutaId);
      else throw new Error('El documento ya no admite cambios.');
      toast.success(t('pdf_generation.errors.send_success'));
      navigate('/permutasAceptadas');
    } catch (error) { logError(error); toast.error(error.message || t('pdf_generation.errors.send_error')); }
    finally { setEnviando(false); }
  };

  const handleValidarPermuta = async () => {
    if (enviando || !puedeValidar) return;
    setEnviando(true);
    try {
      await validarSolicitudPermuta(permutaId);
      setShowModal(false);
      toast.success(t('pdf_generation.errors.validate_success'));
      navigate('/permutasAceptadas');
    } catch (error) { logError(error); toast.error(error.message || 'No se pudo validar el documento.'); }
    finally { setEnviando(false); }
  };

  const handleDNIChange = (e) => {
    const value = e.target.value;
    setDni(value);
    setErrors((prev) => ({ ...prev, dni: validarDNI(value) }));
  };

  const handleLetraDNIChange = (e) => {
    const value = e.target.value.toUpperCase();
    setLetraDNI(value);
    setErrors((prev) => ({ ...prev, letraDNI: validarLetraDNI(value) }));
  };

  const handleCodigoPostalChange = (e) => {
    const value = e.target.value;
    setCodigoPostal(value);
    setErrors((prev) => ({
      ...prev,
      codigoPostal: validarCodigoPostal(value),
    }));
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value;
    setTelefono(value);
    setErrors((prev) => ({ ...prev, telefono: validarTelefono(value) }));
  };

  const validarFormulario = () => {
    const nuevoErrors = {
      nombre: validarCampoObligatorio(nombre, "nombre"),
      apellidos: validarCampoObligatorio(apellidos, "apellidos"),
      dni: validarDNI(dni),
      letraDNI: validarLetraDNI(letraDNI, dni),
      domicilio: validarCampoObligatorio(domicilio, "domicilio"),
      poblacion: validarCampoObligatorio(poblacion, "población"),
      codigoPostal: validarCodigoPostal(codigoPostal),
      provincia: validarCampoObligatorio(provincia, "provincia"),
      telefono: validarTelefono(telefono),
      cursoSolicitante: validarCampoObligatorio(cursoSolicitante, "curso del estudiante"),
    };
    setErrors(nuevoErrors);
    // Comprobar si hay algún error
    return !Object.values(nuevoErrors).some((error) => error !== "");
  };

  if (!Number.isSafeInteger(documentoId) || documentoId < 1) {
    return <Navigate to="/permutasAceptadas" replace />;
  }

  if (cargandoDatos) {
    return (
      <div className="page-container">
        <div className="user-loading" role="status">Preparando los datos del documento...</div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="page-container">
        <div className="content-wrap">
          <div className="user-card user-error" role="alert">
            <h2>No se puede preparar el documento</h2>
            <p>{errorCarga}</p>
            <button className="btn btn-secondary" onClick={() => navigate("/permutasAceptadas")}>Volver a Permutas aceptadas</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">{t("pdf_generation.title")}</h1>
          <p className="page-subtitle">
            {t("pdf_generation.description")}
          </p>
          <p style={{ maxWidth: '800px', margin: '15px auto', color: 'var(--text-secondary)' }}>
            {t("pdf_generation.instructions_1")}
          </p>
          <p style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            {t("pdf_generation.instructions_2")}
          </p>
        </div>

        <div className="pdf-generation-layout">

          {/* Columna Izquierda: Formulario */}
          <div className="user-card">
            {estadoPermuta === "BORRADOR" && puedeEditar && <>
            <div className="form-group">
              <label className="form-label" htmlFor="curso-solicitante">Curso del estudiante</label>
              <input id="curso-solicitante" className="form-input" value={cursoSolicitante} maxLength={30}
                placeholder="Por ejemplo, 2º" onChange={event => setCursoSolicitante(event.target.value)} />
              {errors.cursoSolicitante && <span role="alert">{errors.cursoSolicitante}</span>}
            </div>
            <div className="pdf-form-row">
              <div style={{ flex: 1 }} className="form-group">
                <label className="form-label">{t("pdf_generation.labels.name")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrors((prev) => ({ ...prev, nombre: validarCampoObligatorio(e.target.value, "nombre") }));
                  }}
                  className={`form-input ${errors.nombre ? "input-error" : ""}`}
                />
                {errors.nombre && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.nombre}</span>}
              </div>
              <div style={{ flex: 2 }} className="form-group">
                <label className="form-label">{t("pdf_generation.labels.surnames")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={apellidos}
                  onChange={(e) => {
                    setApellidos(e.target.value);
                    setErrors((prev) => ({ ...prev, apellidos: validarCampoObligatorio(e.target.value, "apellidos") }));
                  }}
                  className={`form-input ${errors.apellidos ? "input-error" : ""}`}
                />
                {errors.apellidos && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.apellidos}</span>}
              </div>
            </div>
            <div className="pdf-form-row">
              <div style={{ flex: 2 }} className="form-group">
                <label className="form-label">{t("pdf_generation.labels.dni")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={dni}
                  onChange={handleDNIChange}
                  className={`form-input ${errors.dni ? "input-error" : ""}`}
                  style={{ borderColor: errors.dni ? 'var(--danger-color)' : '' }}
                />
                {errors.dni && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.dni}</span>}
              </div>
              <div style={{ flex: 1 }} className="form-group">
                <label className="form-label">{t("pdf_generation.labels.dni_letter")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={letraDNI}
                  onChange={handleLetraDNIChange}
                  maxLength="1"
                  className={`form-input ${errors.letraDNI ? "input-error" : ""}`}
                  style={{ borderColor: errors.letraDNI ? 'var(--danger-color)' : '' }}
                />
                {errors.letraDNI && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.letraDNI}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("pdf_generation.labels.address")}</label>
              <input
                type="text"
                disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                value={domicilio}
                onChange={(e) => {
                  setDomicilio(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    domicilio: validarCampoObligatorio(e.target.value, "domicilio"),
                  }));
                }}
                className={`form-input ${errors.domicilio ? "input-error" : ""}`}
                style={{ borderColor: errors.domicilio ? 'var(--danger-color)' : '' }}
              />
              {errors.domicilio && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.domicilio}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t("pdf_generation.labels.city")}</label>
              <input
                type="text"
                disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                value={poblacion}
                onChange={(e) => {
                  setPoblacion(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    poblacion: validarCampoObligatorio(e.target.value, "población"),
                  }));
                }}
                className={`form-input ${errors.poblacion ? "input-error" : ""}`}
                style={{ borderColor: errors.poblacion ? 'var(--danger-color)' : '' }}
              />
              {errors.poblacion && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.poblacion}</span>}
            </div>

            <div className="pdf-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("pdf_generation.labels.zip_code")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={codigoPostal}
                  onChange={handleCodigoPostalChange}
                  className={`form-input ${errors.codigoPostal ? "input-error" : ""}`}
                  style={{ borderColor: errors.codigoPostal ? 'var(--danger-color)' : '' }}
                />
                {errors.codigoPostal && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.codigoPostal}</span>}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t("pdf_generation.labels.province")}</label>
                <input
                  type="text"
                  disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                  value={provincia}
                  onChange={(e) => {
                    setProvincia(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      provincia: validarCampoObligatorio(e.target.value, "provincia"),
                    }));
                  }}
                  className={`form-input ${errors.provincia ? "input-error" : ""}`}
                  style={{ borderColor: errors.provincia ? 'var(--danger-color)' : '' }}
                />
                {errors.provincia && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.provincia}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("pdf_generation.labels.phone")}</label>
              <input
                type="text"
                disabled={estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA"}
                value={telefono}
                onChange={handleTelefonoChange}
                className={`form-input ${errors.telefono ? "input-error" : ""}`}
                style={{ borderColor: errors.telefono ? 'var(--danger-color)' : '' }}
              />
              {errors.telefono && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errors.telefono}</span>}
            </div>

            </>}
            {estadoPermuta === 'FIRMADA' && <p>Descarga el PDF original, completa los campos del segundo estudiante en un editor de PDF y añade tu firma. Sube después el documento completo. La aplicación conserva el archivo original sin reescribirlo.</p>}
            {!puedeEditar && estadoPermuta === 'BORRADOR' && <p>El primer estudiante está preparando el documento.</p>}
            <div className="pdf-actions">
              {estadoPermuta === "BORRADOR" && puedeEditar && (
                <button className="btn btn-primary" onClick={mostrarPDF}>
                  {t("pdf_generation.buttons.visualize")}
                </button>
              )}
              <button disabled={estadoPermuta === "BORRADOR" && !puedeEditar} className="btn btn-secondary" onClick={descargarPDF} style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}>
                {t("pdf_generation.buttons.download")}
              </button>
            </div>

            {puedeEditar && (
              <div className="file-upload-wrapper" style={{ marginTop: '20px', padding: '20px' }}>
                <input
                  type="file"
                  id="signed-permutation-file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="pdf-upload-input"
                />
                <label className="pdf-upload-label" htmlFor="signed-permutation-file">
                  <span className="pdf-upload-label__icon" aria-hidden="true">📎</span>
                  <span>{file ? file.name : "Seleccionar PDF firmado"}</span>
                </label>
                <p className="pdf-upload-hint">Adjunta únicamente el documento PDF cumplimentado y firmado.</p>
                <button className="btn btn-success btn-full" disabled={enviando} onClick={handleUpload}>
                  {t("pdf_generation.buttons.upload")}
                </button>
              </div>
            )}

            {puedeValidar && (
              <button
                className="btn btn-warning btn-full"
                style={{ marginTop: '20px', backgroundColor: 'var(--warning-color)', color: 'white' }}
                disabled={enviando}
                onClick={() => setShowModal(true)}
              >
                {t("pdf_generation.buttons.validate")}
              </button>
            )}
          </div>

          {/* Columna Derecha: PDF Preview */}
          <div className={`user-card pdf-preview-card ${pdfUrl ? "has-document" : "is-empty"}`}>
            {pdfUrl ? (
              <>
                <iframe className="pdf-preview-frame" src={pdfUrl} title="Vista previa del PDF" />
                <div className="pdf-mobile-preview">
                  <span aria-hidden="true">📄</span>
                  <p>El documento está preparado.</p>
                  <a className="btn btn-primary" href={pdfUrl} target="_blank" rel="noreferrer">
                    Abrir PDF
                  </a>
                </div>
              </>
            ) : (
              <div className="pdf-preview-empty">
                <p>{t("pdf_generation.buttons.visualize")}...</p>
              </div>
            )}
          </div>

        </div>

        {showModal && (
          <Modal
            title={t("pdf_generation.modal.title")}
            message={t("pdf_generation.modal.message")}
            onConfirm={handleValidarPermuta}
            onCancel={() => setShowModal(false)}
          />
        )}
      </div>
      <div style={{ height: "80px" }} />
    </div>
  );
}
