import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../../styles/user-common.css";
import "../../styles/mispermutas-style.css"; // Mantenemos estilos específicos secundarios si son necesarios
import {
  misPermutasPropuestas,
  denegarPermuta,
  validarPermuta,
  misPermutasPropuestasPorMi,
} from "../../services/permuta.js";
import { toast } from "react-toastify";
import { logError } from "../../lib/logger.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchangeAlt, faBan, faCheck, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

export default function MisPermutas() {
  const [permutasPropuestas, setPermutasPropuestas] = useState([]);
  const [permutasPropuestasPorMi, setPermutasPropuestasPorMi] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPermutasPropuestasPorMi();
    cargarPermutasPropuestas();
  }, []);

  const cargarPermutasPropuestasPorMi = async () => {
    try {
      const response = await misPermutasPropuestasPorMi();
      if (response && response.result && Array.isArray(response.result.result)) {
        setPermutasPropuestasPorMi(response.result.result);
      } else {
        setError("Error al cargar los datos");
        logError(response);
      }
      setCargando(false);
    } catch (error) {
      setError("Error al cargar las permutas propuestas por mí");
      setCargando(false);
      logError(error);
    }
  };

  const cargarPermutasPropuestas = async () => {
    try {
      const response = await misPermutasPropuestas();
      if (response && response.result && Array.isArray(response.result.result)) {
        setPermutasPropuestas(response.result.result);
      } else {
        setError("Error al cargar los datos");
        logError(response);
      }
      setCargando(false);
    } catch (error) {
      setError("Error al cargar las permutas propuestas");
      setCargando(false);
      logError(error);
    }
  };

  const handleDenegarPermuta = async (solicitudId) => {
    try {
      await denegarPermuta(solicitudId);
      setPermutasPropuestas((prev) =>
        prev.filter((permuta) => permuta.permuta_id !== solicitudId)
      );
      toast.success("Permuta denegada con éxito");
    } catch (error) {
      toast.error("Error al denegar la permuta");
      logError(error);
    }
  };

  const handleAceptarPermuta = async (solicitudId) => {
    try {
      await validarPermuta(solicitudId);
      setPermutasPropuestas((prev) =>
        prev.filter((permuta) => permuta.permuta_id !== solicitudId)
      );
      toast.success("Permuta aceptada con éxito");
    } catch (error) {
      toast.error("Error al aceptar la permuta");
      logError(error);
    }
  };

  if (cargando) {
    return <div className="user-loading">Cargando permutas...</div>;
  }

  if (error) {
    return <div className="user-error">{error}</div>;
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <div className="page-header">
          <h1 className="page-title">Mis Permutas</h1>
          <p className="page-subtitle">
            Aquí puedes ver las permutas que has propuesto y las que te han propuesto.
            Gestiona tus intercambios de manera sencilla.
          </p>
        </div>

        <div className="mispermutas-columns" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

          {/* Columna: Propuestas por mí */}
          <div className="mispermutascol" style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ color: 'var(--user-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FontAwesomeIcon icon={faExchangeAlt} /> Propuestas por mí
            </h2>
            {permutasPropuestasPorMi.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                spaceBetween={20}
                slidesPerView={1}
                className="user-swiper"
              >
                {permutasPropuestasPorMi.map((permuta) => (
                  <SwiperSlide key={permuta.permuta_id} style={{ padding: '10px 5px 30px 5px' }}>
                    <div className="user-card" style={{ height: '100%', borderRadius: '12px' }}>
                      <div className="mispermuta-info">
                        <p><strong><FontAwesomeIcon icon={faInfoCircle} /> Estado:</strong> {permuta.estado}</p>
                        <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                        <p><strong>Asignatura:</strong> {permuta.nombre_asignatura} ({permuta.codigo_asignatura})</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                          <span><strong>De Grupo:</strong> {permuta.grupo_solicitante}</span>
                          <span><strong>A Grupo:</strong> {permuta.grupo_solicitado}</span>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="empty-state">
                <p>No has propuesto ninguna permuta aún</p>
              </div>
            )}
          </div>

          {/* Columna: Permutas recibidas */}
          <div className="mispermutascol" style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ color: 'var(--user-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FontAwesomeIcon icon={faExchangeAlt} /> Permutas recibidas
            </h2>
            {permutasPropuestas.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                spaceBetween={20}
                slidesPerView={1}
                className="user-swiper"
              >
                {permutasPropuestas.map((permuta) => (
                  <SwiperSlide key={permuta.permuta_id} style={{ padding: '10px 5px 30px 5px' }}>
                    <div className="user-card" style={{ height: '100%', borderRadius: '12px' }}>
                      <div className="mispermuta-info">
                        <p><strong><FontAwesomeIcon icon={faInfoCircle} /> Estado:</strong> {permuta.estado}</p>
                        <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                        <p><strong>Asignatura:</strong> {permuta.nombre_asignatura} ({permuta.codigo_asignatura})</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                          <span><strong>Solicitante:</strong> G. {permuta.grupo_solicitante}</span>
                          <span><strong>Tu Grupo:</strong> G. {permuta.grupo_solicitado}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn btn-danger btn-full"
                          onClick={() => handleDenegarPermuta(permuta.permuta_id)}
                        >
                          <FontAwesomeIcon icon={faBan} /> Denegar
                        </button>
                        <button
                          className="btn btn-success btn-full"
                          onClick={() => handleAceptarPermuta(permuta.permuta_id)}
                        >
                          <FontAwesomeIcon icon={faCheck} /> Aceptar
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="empty-state">
                <p>No has recibido propuestas de permuta</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </div>
  );
}

