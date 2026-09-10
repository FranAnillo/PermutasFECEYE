import Footer from '../components/comun/footer';
import NavbarEstudiante from '../components/usuario/NavbarEstudiante';
import ConfiguracionInicialModal from '../components/usuario/ConfiguracionInicialModal';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerConfiguracionInicial, guardarConfiguracionInicial } from '../services/configuracionInicial';
import { useAuth } from '../hooks/useAuth';
import '../styles/user-common.css';
import '../styles/feceye-student.css';
import MobileBottomNavigation from '../components/comun/MobileBottomNavigation';

export default function LayoutEstudiante() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifiedPath, setVerifiedPath] = useState(null);
  const version = useRef(0);
  const submitting = useRef(false);
  const refrescarPerfil = useCallback(async () => {
    const current = ++version.current;
    setVerifiedPath(null);
    setError('');
    try {
      const data = await obtenerConfiguracionInicial();
      if (current !== version.current) return;
      setEstado(data);
      if (!data.completo && pathname !== '/miPerfil') {
        navigate('/miPerfil', { replace: true });
        return;
      }
      setVerifiedPath(pathname);
    } catch {
      if (current !== version.current) return;
      setEstado(null);
      setError('No hemos podido comprobar tu perfil. Reintenta la consulta; tus datos guardados se conservan.');
    }
  }, [pathname, navigate]);
  useEffect(() => {
    refrescarPerfil();
    return () => { version.current += 1; };
  }, [refrescarPerfil]);
  async function guardar(data) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const updated = await guardarConfiguracionInicial(data);
      setEstado(updated);
      setVerifiedPath(pathname);
    } catch (cause) { setError(cause.message || 'No se ha podido guardar. Inténtalo de nuevo.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function salir() {
    try { await logout(); navigate('/login', { replace: true }); }
    catch { setError('No se ha podido cerrar la sesión. Inténtalo de nuevo.'); }
  }
  const ready = verifiedPath === pathname && estado?.completo;
  const visibleState = verifiedPath === pathname ? estado : null;
  if (!ready && !visibleState && !error) {
    return <div className="FCEYE-student">
      <main className="profile-loading" aria-busy="true">
        <p role="status">Cargando…</p>
      </main>
    </div>;
  }
  return <div className="FCEYE-student">
    <NavbarEstudiante />
    <main className="app-layout-main app-layout-main--student">
      {ready ? <Outlet context={{ refrescarPerfil }} /> : <div className="page-container onboarding-profile-background" aria-hidden="true">
        <div className="content-wrap"><h1>Mi perfil</h1><div className="user-header-card">
          <div><h2>{estado?.usuario?.nombre_completo || 'Tu perfil académico'}</h2>
            <p>{estado?.usuario?.titulacion || 'Completa tu grado, asignaturas y grupos para empezar.'}</p></div>
        </div></div>
      </div>}
    </main>
    {ready && <MobileBottomNavigation variant="student" />}
    <Footer />
    {!ready && <ConfiguracionInicialModal key={visibleState?.paso || 'cargando'} estado={visibleState}
      error={error} busy={busy} onSave={guardar} onRetry={refrescarPerfil} onLogout={salir} />}
  </div>;
}
