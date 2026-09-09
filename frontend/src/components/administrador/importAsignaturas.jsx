import React, { useState } from "react";
import { importAsignaturas } from "../../services/estadisticas";

const ImportarAsignaturas = () => {
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleArchivoChange = (e) => {
    setArchivo(e.target.files[0]);
    setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje("Selecciona un archivo CSV.");
      return;
    }
    setCargando(true);
    const formData = new FormData();
    formData.append("file", archivo);

    try {
      // Usar la función importAsignaturas del servicio
      const data = await importAsignaturas(formData);
      if (data?.mensaje) {
        setMensaje(data.mensaje);
      } else if (data?.error) {
        setMensaje(data.error);
      } else {
        setMensaje("Importación completada correctamente.");
      }
    } catch (error) {
      setMensaje("Error de red al importar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="importar-asignaturas-container" style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8, background: "#fafafa" }}>
      <h2 style={{ marginBottom: 16 }}>Importar Asignaturas desde CSV</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input type="file" accept=".csv" onChange={handleArchivoChange} />
        <button type="submit" disabled={cargando} style={{ padding: 10, borderRadius: 4, border: "none", background: "#1976d2", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
          {cargando ? "Importando..." : "Importar"}
        </button>
      </form>
      {mensaje && <p style={{ marginTop: 16, color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
    </div>
  );
};

export default ImportarAsignaturas;