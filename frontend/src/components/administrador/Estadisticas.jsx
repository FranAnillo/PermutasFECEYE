import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { obtenerEstadisticasPermutas, obtenerEstadisticasSolicitudes, obtenerEstadisticasIncidencias, obtenerEstadisticasUsuarios } from '../../services/estadisticas';
import "../../styles/admin-common.css";
import "../../styles/estadisticas-style.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Estadisticas() {
  const [estadisticasPermutas, setEstadisticasPermutas] = useState(null);
  const [estadisticasSolicitudes, setEstadisticasSolicitudes] = useState(null);
  const [estadisticasIncidencias, setEstadisticasIncidencias] = useState(null);
  const [estadisticasUsuarios, setEstadisticasUsuarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const [permutasData, solicitudesData, incidenciasData, usuariosData] = await Promise.all([
          obtenerEstadisticasPermutas(),
          obtenerEstadisticasSolicitudes(),
          obtenerEstadisticasIncidencias(),
          obtenerEstadisticasUsuarios(),
        ]);
        setEstadisticasPermutas(permutasData.result.data);
        setEstadisticasSolicitudes(solicitudesData.result.data);
        setEstadisticasIncidencias(incidenciasData.result.result);
        setEstadisticasUsuarios(usuariosData.result.result);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar las estadísticas', err);
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, []);

  if (loading) return <div className="admin-loading">Cargando estadísticas...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const permutasPorEstadoData = {
    labels: estadisticasPermutas.permutasPorEstado.map(item => item.estado),
    datasets: [{
      label: 'Permutas por Estado',
      data: estadisticasPermutas.permutasPorEstado.map(item => item.cantidad),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
      ],
    }]
  };

  const permutasPorAsignaturaData = {
    labels: estadisticasPermutas.permutasPorAsignatura.map(item => item.siglas),
    datasets: [{
      label: 'Permutas por Asignatura',
      data: estadisticasPermutas.permutasPorAsignatura.map(item => item.cantidad),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    }]
  };

  const solicitudesPorEstadoData = {
    labels: estadisticasSolicitudes.solicitudesPorEstado.map(item => item.estado),
    datasets: [{
      data: estadisticasSolicitudes.solicitudesPorEstado.map(item => item.cantidad),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
    }]
  };
  const incidenciasPorEstadoData = {
    labels: estadisticasIncidencias.incidenciasPorEstado.map(item => item.estado_incidencia),
    datasets: [{
      data: estadisticasIncidencias.incidenciasPorEstado.map(item => item.cantidad),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
    }]
  };
  const incidenciasPorTipoData = {
    labels: estadisticasIncidencias.incidenciasPorTipo.map(item => item.tipo_incidencia),
    datasets: [{
      data: estadisticasIncidencias.incidenciasPorTipo.map(item => item.cantidad),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
    }]
  };

  const incidenciasPorMesData = {
    labels: estadisticasIncidencias.incidenciasPorMes.map(item => `${item.mes}/${item.anio}`),
    datasets: [{
      label: 'Incidencias por Mes',
      data: estadisticasIncidencias.incidenciasPorMes.map(item => parseInt(item.cantidad, 10)),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    }]
  };

  // Función para generar colores aleatorios
  function generarColoresAleatorios(n) {
    return Array.from({ length: n }, () =>
      `rgba(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},0.5)`
    );
  }

  const usuariosPorRolData = estadisticasUsuarios && estadisticasUsuarios.usuariosPorRol
    ? {
      labels: estadisticasUsuarios.usuariosPorRol.map(item => item.rol),
      datasets: [{
        label: 'Usuarios por Rol',
        data: estadisticasUsuarios.usuariosPorRol.map(item => item.cantidad),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
      }]
    }
    : null;

  const usuariosPorEstudioData = estadisticasUsuarios && estadisticasUsuarios.usuariosPorEstudio
    ? {
      labels: estadisticasUsuarios.usuariosPorEstudio.map(item => item.siglas),
      datasets: [{
        label: 'Usuarios por Estudio',
        data: estadisticasUsuarios.usuariosPorEstudio.map(item => item.cantidad),
        backgroundColor: generarColoresAleatorios(estadisticasUsuarios.usuariosPorEstudio.length),
      }]
    }
    : null;

  const solicitudesPorGradoData = estadisticasSolicitudes.solicitudesPorGrado
    ? {
      labels: estadisticasSolicitudes.solicitudesPorGrado.map(item => item.siglas),
      datasets: [{
        label: 'Solicitudes por Grado',
        data: estadisticasSolicitudes.solicitudesPorGrado.map(item => item.cantidad),
        backgroundColor: generarColoresAleatorios(estadisticasSolicitudes.solicitudesPorGrado.length),
      }]
    }
    : null;

  return (
    <>
      <div className="admin-page-container">
        <div className="admin-content-wrap">
          {/* Header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">📊 Dashboard de Estadísticas</h1>
            <p className="admin-page-subtitle">
              Consulta las estadísticas de permutas, solicitudes, incidencias y usuarios.
              Analiza los datos a través de gráficos interactivos de barras y circulares.
            </p>
          </div>

          {/* Grid de Estadísticas */}
          <div className="admin-grid admin-grid-2">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">🔄</span>
                  Permutas por Estado
                </h2>
              </div>
              <div className="admin-card-body">
                <Pie key="permutasPorEstadoData" data={permutasPorEstadoData} />
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">📚</span>
                  Permutas por Asignatura
                </h2>
              </div>
              <div className="admin-card-body">
                <Bar key="permutasPorAsignaturaData" data={permutasPorAsignaturaData} />
              </div>
            </div>

            {/* Permutas agrupadas por grado */}
            {estadisticasPermutas && estadisticasPermutas.permutasPorGrado && (() => {
              const permutasPorGradoGrouped = estadisticasPermutas.permutasPorGrado.reduce((acc, curr) => {
                if (!acc[curr.grado_nombre]) {
                  acc[curr.grado_nombre] = {
                    labels: [],
                    data: [],
                    grado_siglas: curr.grado_siglas
                  };
                }
                acc[curr.grado_nombre].labels.push(curr.asignatura_siglas + ' (' + curr.asignatura_codigo + ')');
                acc[curr.grado_nombre].data.push(curr.cantidad);
                return acc;
              }, {});

              return Object.entries(permutasPorGradoGrouped).map(([gradoNombre, datos]) => {
                const data = {
                  labels: datos.labels,
                  datasets: [{
                    label: `Permutas en ${datos.grado_siglas}`,
                    data: datos.data,
                    backgroundColor: generarColoresAleatorios(datos.data.length),
                  }]
                };
                return (
                  <div className="admin-card" key={gradoNombre}>
                    <div className="admin-card-header">
                      <h2 className="admin-card-title">
                        <span className="admin-card-icon">🎓</span>
                        Permutas en {gradoNombre}
                      </h2>
                    </div>
                    <div className="admin-card-body">
                      <Bar data={data} options={{
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: `Permutas en ${datos.grado_siglas}`
                          }
                        }
                      }} />
                    </div>
                  </div>
                );
              });
            })()}

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">📝</span>
                  Solicitudes por Estado
                </h2>
              </div>
              <div className="admin-card-body">
                <Pie key="solicitudesPorEstadoData" data={solicitudesPorEstadoData} />
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">🐛</span>
                  Incidencias por Estado
                </h2>
              </div>
              <div className="admin-card-body">
                <Pie key="incidenciasPorEstadoData" data={incidenciasPorEstadoData} />
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">📋</span>
                  Incidencias por Tipo
                </h2>
              </div>
              <div className="admin-card-body">
                <Pie key="incidenciasPorTipoData" data={incidenciasPorTipoData} />
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">📅</span>
                  Incidencias por Mes
                </h2>
              </div>
              <div className="admin-card-body">
                <Bar key="incidenciasPorMesData" data={incidenciasPorMesData} />
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">👥</span>
                  Usuarios por Rol
                </h2>
              </div>
              <div className="admin-card-body">
                {usuariosPorRolData && <Bar key="usuariosPorRolData" data={usuariosPorRolData} />}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">🎓</span>
                  Usuarios por Estudio
                </h2>
              </div>
              <div className="admin-card-body">
                {usuariosPorEstudioData && <Bar key="usuariosPorEstudioData" data={usuariosPorEstudioData} />}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <span className="admin-card-icon">📊</span>
                  Solicitudes por Grado
                </h2>
              </div>
              <div className="admin-card-body">
                {solicitudesPorGradoData && <Bar key="solicitudesPorGradoData" data={solicitudesPorGradoData} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </>
  );
}