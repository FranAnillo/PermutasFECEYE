import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider.jsx";
import { RoleRoute } from "./routes/RoleRoute.jsx";
import CookieConsent from "react-cookie-consent";
import Cookies from "./components/comun/cookies.jsx";
import Login from "./components/comun/login.jsx";
import Registro from "./components/comun/registro.jsx";
import PoliticaPrivacidad from "./components/comun/politicaPrivacidad.jsx";
import Unauthorized from "./components/comun/Unauthorized.jsx";
import NotFound from "./components/comun/notFound.jsx";
import RedirectHome from "./components/comun/RedirectHome.jsx";
import LayoutEstudiante from "./layouts/LayoutEstudiante.jsx";
import LayoutAdmin from "./layouts/LayoutAdmin.jsx";
import Home from "./components/comun/home.jsx";
import MiPerfil from "./components/usuario/miPerfil.jsx";
import ReportarIncidencia from "./components/usuario/reportarIncidencia.jsx";
import MisIncidencias from "./components/usuario/misIncidencias.jsx";
import SeleccionarEstudio from "./components/usuario/seleccionarEstudio.jsx";
import SeleccionarAsignatura from "./components/usuario/selectorAsignatura.jsx";
import GeneracionPDF from "./components/usuario/generacionPDF.jsx";
import SolicitarGrupos from "./components/usuario/seleccionarGrupos.jsx";
import SolicitarPermuta from "./components/usuario/solicitarPermuta.jsx";
import MisSolicitudesPermuta from "./components/usuario/solicitudesPermuta.jsx";
import Permutas from "./components/usuario/permutas.jsx";
import CrearNotificacion from "./components/administrador/crearNotificacion.jsx";
import Estadisticas from "./components/administrador/Estadisticas.jsx";
import MisPermutas from "./components/usuario/misPermutas.jsx";
import PermutasAceptadas from "./components/usuario/permutasAceptadas.jsx";
import IncidenciasSinAsignar from "./components/administrador/incidenciasSinAsignar.jsx";
import IncidenciasAsignadasAdmin from "./components/administrador/incidenciasAsignadasAdmin.jsx";
import MiPerfilAdmin from "./components/administrador/miPerfilAdmin.jsx";
import CrearGradoAdmin from "./components/administrador/CrearGradoAdmin.jsx";
import DetalleIncidencia from "./components/administrador/detalleIncidencia.jsx";
import CrearAsignatura from "./components/administrador/CrearAsignatura.jsx";
import NoRegistrado from "./components/comun/noRegistrado.jsx";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import PanelGestionUsuarios from "./components/administrador/panelGestionUsuarios.jsx";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useTranslation } from "react-i18next";


export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { t } = useTranslation();


  return (
    <>
      <main>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/politicaPrivacidad" element={<PoliticaPrivacidad />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/noRegistrado" element={<NoRegistrado />} />

          {/* Redirigir al home adecuado dependiendo del rol */}
          <Route path="/" element={<RoleRoute allowedRoles={["administrador", "estudiante"]}><RedirectHome /></RoleRoute>} />
          {/* Layout para estudiantes */}
          <Route element={<RoleRoute allowedRoles={["estudiante"]}><LayoutEstudiante /></RoleRoute>}>
            <Route path="/estudiante" element={<Home />} />
            <Route path="/miPerfil" element={<MiPerfil />} />
            <Route path="/seleccionarEstudios" element={<SeleccionarEstudio />} />
            <Route path="/seleccionarAsignaturas" element={<SeleccionarAsignatura />} />
            <Route path="/seleccionarGrupos" element={<SolicitarGrupos />} />
            <Route path="/misIncidencias" element={<MisIncidencias />} />
            <Route path="/reportarIncidencia" element={<ReportarIncidencia />} />
            <Route path="/generarPermuta" element={<GeneracionPDF />} />
            <Route path="/permutasAceptadas" element={<PermutasAceptadas />} />
            <Route path="/misPermutas" element={<MisPermutas />} />
            <Route path="/solicitarPermuta" element={<SolicitarPermuta />} />
            <Route path="/misSolicitudesPermuta" element={<MisSolicitudesPermuta />} />
            <Route path="/permutas" element={<Permutas />} />
          </Route>

          {/* Layout para administradores */}
          <Route element={<RoleRoute allowedRoles={["administrador"]}><LayoutAdmin /></RoleRoute>}>
            <Route path="/admin" element={<Home />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/incidenciasSinAsignar" element={<IncidenciasSinAsignar />} />
            <Route path="/incidencias" element={<IncidenciasAsignadasAdmin />} />
            <Route path="/incidencias/:id" element={<DetalleIncidencia />} />
            <Route path="/crearNotificacion" element={<CrearNotificacion />} />
            <Route path="/miPerfilAdmin" element={<MiPerfilAdmin />} />
            <Route path="/crearGrado" element={<CrearGradoAdmin />} />
            <Route path="/crearAsignatura" element={<CrearAsignatura />} />
            <Route path="/gestionUsuarios" element={<PanelGestionUsuarios />} />
          </Route>
        </Routes>
      </main>

      <CookieConsent
        location="bottom"
        buttonText={t("common.accept")}
        cookieName="permutasCookies"

        style={{
          background: theme === 'dark' ? "#1e293b" : "#6099c4",
          padding: "1rem",
          color: theme === 'dark' ? "#f1f5f9" : "#fff",
          borderTop: theme === 'dark' ? "1px solid #334155" : "none"
        }}
        buttonStyle={{
          color: "#fff",
          background: "#E0AD0F",
          padding: "8px 16px",
          margin: "auto",
          border: "none",
          borderRadius: "4px"
        }}
        expires={150}
      >
        {t("common.cookie_consent")}
        <a href="/cookies" style={{ color: "#E0AD0F", textDecoration: "underline", marginLeft: "5px" }}>{t("common.read_more")}</a>
      </CookieConsent>


      <ToastContainer position="top-center" theme={theme} />
    </>
  );
}

export default App;