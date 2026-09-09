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

export default function GeneracionPDF() {
  const { t } = useTranslation();
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
        setUsuarios(lista.result.result[0].usuarios);
        setPermutas(lista.result.result[0].permutas);

        const idsPermutas = lista.result.result[0].permutas.map(
          (permuta) => permuta.permuta_id
        );
        const permuta = await listarPermutas(idsPermutas);
        const estado = permuta?.result?.result[0]?.estado;
        const fileId = permuta?.result?.result[0]?.archivo;
        setPermutaId(permuta?.result?.result[0]?.id);

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
        logError(error);
      }
    };
    cargarDatos();
  }, []);

  const generarPDF = async () => {
    try {
      const existingPdfBytes =
        estadoPermuta !== "BORRADOR" && pdfExistente
          ? pdfExistente
          : await obtenerPlantillaPermuta();

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Grado (bloqueado siempre)
      const grado1 = form.getCheckBox("GII-IS");
      const grado2 = form.getCheckBox("GII-IC");
      const grado3 = form.getCheckBox("GII-TI");
      const grado4 = form.getCheckBox("GISA");
      [grado1, grado2, grado3, grado4].forEach((g) => g.enableReadOnly());

      const estudio = usuarios[0]?.estudio;
      switch (estudio) {
        case "GII-IS":
          grado1.check();
          break;
        case "GII-IC":
          grado2.check();
          break;
        case "GII-TI":
          grado3.check();
          break;
        case "GISA":
          grado4.check();
          break;
      }

      // Fechas (bloqueadas siempre)
      const day = form.getTextField("DAY");
      const month = form.getTextField("MONTH");
      const year = form.getTextField("YEAR");
      day.setText(dayValue);
      month.setText(monthValue);
      year.setText(yearValue);
      [day, month, year].forEach((f) => f.enableReadOnly());

      // Asignaturas (bloqueadas siempre)
      for (let index = 0; index < 16; index++) {
        const asignatura = permutas[index];
        const asignaturaField1 = form.getTextField(`ASIGNATURA1-${index + 1}`);
        const asignaturaField2 = form.getTextField(`ASIGNATURA2-${index + 1}`);
        const codigoField1 = form.getTextField(`COD1-${index + 1}`);
        const codigoField2 = form.getTextField(`COD2-${index + 1}`);

        if (asignatura) {
          asignaturaField1.setText(String(asignatura.nombre_asignatura));
          asignaturaField2.setText(String(asignatura.nombre_asignatura));
          codigoField1.setText(String(asignatura.codigo_asignatura));
          codigoField2.setText(String(asignatura.codigo_asignatura));
        }
        [
          asignaturaField1,
          asignaturaField2,
          codigoField1,
          codigoField2,
        ].forEach((f) => f.enableReadOnly());
      }

      // Datos personales
      const camposEst1 = [
        form.getTextField("DNI1"),
        form.getTextField("LETRA1"),
        form.getTextField("NOMBRE1"),
        form.getTextField("DOMICILIO1"),
        form.getTextField("POBLACION1"),
        form.getTextField("COD-POSTAL1"),
        form.getTextField("PROVINCIA1"),
        form.getTextField("TELEFONO1"),
      ];
      const camposEst2 = [
        form.getTextField("DNI2"),
        form.getTextField("LETRA2"),
        form.getTextField("NOMBRE2"),
        form.getTextField("DOMICILIO2"),
        form.getTextField("POBLACION2"),
        form.getTextField("COD-POSTAL2"),
        form.getTextField("PROVINCIA2"),
        form.getTextField("TELEFONO2"),
      ];

      [...camposEst1, ...camposEst2].forEach((f) => f.enableReadOnly());

      if (estadoPermuta === "BORRADOR") {
        const usuario = usuarios[0];
        const datos = [
          dni,
          letraDNI,
          usuario.nombre_completo,
          domicilio,
          poblacion,
          codigoPostal,
          provincia,
          telefono,
        ];
        datos.forEach((valor, i) => camposEst1[i].setText(valor));
      } else if (estadoPermuta === "FIRMADA") {
        const usuario = usuarios[1];
        const datos = [
          dni,
          letraDNI,
          usuario.nombre_completo,
          domicilio,
          poblacion,
          codigoPostal,
          provincia,
          telefono,
        ];
        datos.forEach((valor, i) => camposEst2[i].setText(valor));
      }

      return await pdfDoc.save();
    } catch (error) {
      toast.error(t("pdf_generation.errors.generation_error"));
      logError(error)
    }
  };

  const mostrarPDF = async () => {
    if (!validarFormulario()) {
      toast.warning(t("pdf_generation.errors.fix_errors"));
      return;
    }
    const pdfBytes = await generarPDF();
    const pdfUrl = URL.createObjectURL(
      new Blob([pdfBytes], { type: "application/pdf" })
    );
    setPdfUrl(pdfUrl);
  };

  const descargarPDF = async () => {
    if (!validarFormulario()) {
      toast.warning(t("pdf_generation.errors.fix_errors"));
      return;
    }
    const pdfBytes = await generarPDF();
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>

          {/* Columna Izquierda: Formulario */}
          <div className="user-card">
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
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

            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
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
          <div className="user-card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '600px', padding: '0', overflow: 'hidden' }}>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                style={{ width: '100%', height: '700px', border: 'none' }}
                title="PDF Preview"
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', backgroundColor: '#f8f9fa', color: '#6c757d' }}>
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
