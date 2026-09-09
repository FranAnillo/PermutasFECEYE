import { useState, useEffect } from "react";
import { crearAsignatura } from "../../services/asignaturas.js";
import { obtenerEstudios } from "../../services/estudio.js";

const CrearAsignatura = () => {
  const [form, setForm] = useState({
    nombre: "",
    siglas: "",
    curso: "",
    codigo: "",
    estudios_id: ""
  });
  const [mensaje, setMensaje] = useState("");
  const [estudios, setEstudios] = useState([]);

  useEffect(() => {
    const fetchEstudios = async () => {
      const response = await obtenerEstudios();
      if (!response.err) {
        setEstudios(response.result?.result || []);
      } else {
        setEstudios([]);
      }
    };
    fetchEstudios();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(Number(form.codigo))) {
      setMensaje("El código debe ser un número");
      return;
    }
    try {
      await crearAsignatura({
        nombre: form.nombre,
        siglas: form.siglas,
        curso: form.curso,
        codigo: parseInt(form.codigo),
        estudios_id: parseInt(form.estudios_id)
      });
      setMensaje("Asignatura creada correctamente");
      setForm({
        nombre: "",
        siglas: "",
        curso: "",
        codigo: "",
        estudios_id: ""
      });
    } catch (error) {
      setMensaje("Error al crear la asignatura",error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 8,
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      <input
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={handleChange}
        required
        style={{ padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
      />
      <input
        name="siglas"
        placeholder="Siglas"
        value={form.siglas}
        onChange={handleChange}
        required
        style={{ padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
      />
      <select
        name="curso"
        value={form.curso}
        onChange={handleChange}
        required
        style={{ padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
      >
        <option value="">Selecciona curso</option>
        <option value="PRIMERO">Primero</option>
        <option value="SEGUNDO">Segundo</option>
        <option value="TERCERO">Tercero</option>
        <option value="CUARTO">Cuarto</option>
      </select>
      <input
        name="codigo"
        placeholder="Código"
        type="number"
        value={form.codigo}
        onChange={handleChange}
        required
        style={{ padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
      />
      <select
        name="estudios_id"
        value={form.estudios_id}
        onChange={handleChange}
        required
        style={{ padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
      >
        <option value="">Selecciona estudio</option>
        {estudios.map((estudio) => (
          <option key={estudio.id} value={estudio.id}>
            {estudio.nombre}
          </option>
        ))}
      </select>
      <button
        type="submit"
        style={{
          padding: 10,
          borderRadius: 4,
          border: "none",
          background: "#1976d2",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Crear Asignatura
      </button>
      {mensaje && <p style={{ color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
    </form>
  );
};

export default CrearAsignatura;