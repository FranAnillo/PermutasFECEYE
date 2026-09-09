import { useState } from "react";
import { crearEstudio } from "../../services/estudio";
import "../../styles/CrearGradoAdmin.css"; 

export default function CrearGradoAdmin() {
  const [estudio, setEstudio] = useState("");
  const [siglas, setSiglas] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    if (!estudio.trim() || !siglas.trim()) {
      setError("Por favor, rellena ambos campos.");
      return;
    }
    try {
      await crearEstudio(estudio, siglas);
      setMensaje("Grado creado correctamente.");
      setEstudio("");
      setSiglas("");
    } catch (err) {
      setError("Error al crear el grado.", err);
    }
  };

  return (
    <div className="crear-grado-admin-container">
      <form onSubmit={handleSubmit} className="crear-grado-form">
        <div className="form-group">
          <label htmlFor="estudio">Estudio del grado:</label>
          <input
            id="estudio"
            type="text"
            value={estudio}
            onChange={(e) => setEstudio(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="siglas">Siglas:</label>
          <input
            id="siglas"
            type="text"
            value={siglas}
            onChange={(e) => setSiglas(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="crear-btn">Crear grado</button>
      </form>
      {mensaje && <p className="success-message">{mensaje}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}