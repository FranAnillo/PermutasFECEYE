import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import {
  obtenerPlantillaPermuta,
  subidaArchivo,
  servirArchivo,
} from "../../services/subidaArchivos.js";
import {
  verListaPermutas,
  listarPermutas,
  firmarPermuta,
  aceptarPermuta,
  validarSolicitudPermuta,
} from "../../services/permuta.js";
import "../../styles/user-common.css";
import "../../styles/generacionPDF-style.css";
import { dayValue, monthValue, yearValue } from "../../lib/generadorFechas.js";
import {
  validarDNI,
  validarLetraDNI,
  validarCampoObligatorio,
  validarCodigoPostal,
  validarTelefono,
} from "../../lib/validadores.js";
import Modal from "./Modal.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { useTranslation } from "react-i18next";
import { asegurarCamposPlantillaPermuta } from "../../lib/plantillaPermutaPDF.js";
import { prepararDatosDocumento } from "../../lib/prepararDatosDocumento.js";

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
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const lista = await verListaPermutas();
        const grupo = lista?.result?.result?.[0];
        if (!grupo?.permutas?.length) throw new Error("No hay permutas para documentar");
        if (grupo?.usuarios?.length !== 2) throw new Error("La permuta debe tener dos estudiantes");
        if (grupo.permutas.length > 10) throw new Error("El documento admite un máximo de 10 cambios");

        const idsPermutas = grupo.permutas.map(
          (permuta) => permuta.permuta_id
        );
        const permuta = await listarPermutas(idsPermutas);
        const datosPermuta = permuta?.result?.result?.[0];
        const estado = datosPermuta?.estado;
        const fileId = datosPermuta?.archivo;
        const datosDocumento = prepararDatosDocumento(grupo, datosPermuta?.estudiante_cumplimentado_1);
        setUsuarios(datosDocumento.usuarios);
        setPermutas(datosDocumento.permutas);
        setPermutaId(datosPermuta?.id);

        if (estado !== "BORRADOR") {
          setEstadoPermuta(estado);
          const bytes = await servirArchivo("buzon", fileId);
          setPdfExistente(bytes);

          if (estado === "ACEPTADA" || estado === "VALIDADA") {
            const blob = new Blob([bytes], { type: "application/pdf" });
            const pdfUrl = URL.createObjectURL(blob);
            setPdfUrl(pdfUrl);
          }
        }
      } catch (error) {
        if (error?.message === "El documento admite un máximo de 10 cambios") {
          toast.error(error.message);
        }
        logError(error);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const generarPDF = async () => {
    try {
      const existingPdfBytes =
        estadoPermuta !== "BORRADOR" && pdfExistente
          ? pdfExistente
          : await obtenerPlantillaPermuta();

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = asegurarCamposPlantillaPermuta(pdfDoc);
      if (permutas.length > 10) throw new Error("El documento admite un máximo de 10 cambios");

      const setSystemField = (fieldName, value) => {
        const field = form.getTextField(fieldName);
        field.setText(String(value ?? ""));
        field.enableReadOnly();
      };

      // Datos conocidos por el sistema y fecha de firma.
      const cursos = [...new Set(permutas
        .map((permuta) => permuta.curso_asignatura)
        .filter((curso) => curso !== null && curso !== undefined))];
      usuarios.forEach((usuario, index) => {
        const numero = index + 1;
        setSystemField(`EMAIL_${numero}`, usuario.correo);
        setSystemField(`TITULACION_${numero}`, usuario.estudio);
        setSystemField(`CURSO_SOLICITANTE_${numero}`, cursos.join(", "));
      });
      setSystemField("LOCALIDAD_FECHA", "Sevilla");
      setSystemField("DIA", dayValue);
      setSystemField("MES", monthValue);
      setSystemField("ANIO", yearValue.slice(-2));

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
    if ((estadoPermuta === "ACEPTADA" || estadoPermuta === "VALIDADA") && pdfExistente) {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning(t("pdf_generation.errors.select_file"));
      return;
    }
    const formData = new FormData();
    formData.append("tipo", "buzon");
    formData.append("file", file);
    try {
      const response = await subidaArchivo(formData);
      const fileId = response?.result?.fileId;
      if (!fileId) {
        toast.error(t("pdf_generation.errors.upload_error"));
        return;
      }
      if (estadoPermuta === "BORRADOR") {
        await firmarPermuta(fileId, permutaId);
      } else {
        await aceptarPermuta(fileId, permutaId);
      }
      toast.success(t("pdf_generation.errors.send_success"));
      navigate("/permutasAceptadas");
    } catch (error) {
      logError(error);
      toast.error(t("pdf_generation.errors.send_error"));
    }
  };

  const handleValidarPermuta = async () => {
    await validarSolicitudPermuta(permutaId);
    setShowModal(false);
    toast.success(t("pdf_generation.errors.validate_success"));
    navigate("/permutasAceptadas");
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
      letraDNI: validarLetraDNI(letraDNI),
      domicilio: validarCampoObligatorio(domicilio, "domicilio"),
      poblacion: validarCampoObligatorio(poblacion, "población"),
      codigoPostal: validarCodigoPostal(codigoPostal),
      provincia: validarCampoObligatorio(provincia, "provincia"),
      telefono: validarTelefono(telefono),
    };
    setErrors(nuevoErrors);
    // Comprobar si hay algún error
    return !Object.values(nuevoErrors).some((error) => error !== "");
  };

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

            <div className="pdf-actions">
              {estadoPermuta !== "ACEPTADA" && estadoPermuta !== "VALIDADA" && (
                <button className="btn btn-primary" onClick={mostrarPDF}>
                  {t("pdf_generation.buttons.visualize")}
                </button>
              )}
              <button className="btn btn-secondary" onClick={descargarPDF} style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}>
                {t("pdf_generation.buttons.download")}
              </button>
            </div>

            {estadoPermuta !== "ACEPTADA" && estadoPermuta !== "VALIDADA" && (
              <div className="file-upload-wrapper" style={{ marginTop: '20px', padding: '20px' }}>
                <input
                  type="file"
                  id="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ marginBottom: '10px', width: '100%' }}
                />
                <button className="btn btn-success btn-full" onClick={handleUpload}>
                  {t("pdf_generation.buttons.upload")}
                </button>
              </div>
            )}

            {estadoPermuta === "ACEPTADA" && estadoPermuta !== "VALIDADA" && (
              <button
                className="btn btn-warning btn-full"
                style={{ marginTop: '20px', backgroundColor: 'var(--warning-color)', color: 'white' }}
                onClick={() => setShowModal(true)}
              >
                {t("pdf_generation.buttons.validate")}
              </button>
            )}
          </div>

          {/* Columna Derecha: PDF Preview */}
          <div className="user-card pdf-preview-card">
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
