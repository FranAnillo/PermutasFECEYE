import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthProvider.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { RoleRoute } from '../../../routes/RoleRoute.jsx';
import { login, registro, logout, obtenerSesion } from '../../../services/login.js';
import Login from '../login.jsx';
import Registro from '../registro.jsx';
import NoRegistrado from '../noRegistrado.jsx';
import NavbarEstudiante from '../../usuario/NavbarEstudiante.jsx';
import NavbarAdmin from '../../administrador/NavbarAdmin.jsx';
import i18n from '../../../i18n.js';

vi.mock('../../../services/login.js', () => ({ login: vi.fn(), registro: vi.fn(), logout: vi.fn(), obtenerSesion: vi.fn() }));
vi.mock('../../../services/notificacion.js', () => ({ obtenerNotificaciones: vi.fn().mockResolvedValue({ result: { result: [] } }) }));
vi.mock('../ThemeToggle.jsx', () => ({ default: () => null }));

const session = (rol = 'estudiante') => ({ isAuthenticated: true, user: { uvus: 'alumno1', rol } });

function SessionProbe() {
    const auth = useAuth();
    return <>
        <output data-testid="session">{auth.loading ? 'loading' : auth.isAuthenticated ? auth.user.rol : 'anonymous'}</output>
        <button onClick={() => auth.setSession(session())}>Set session</button>
        <button onClick={() => auth.refreshSession()}>Refresh session</button>
    </>;
}

function renderAuth(path = '/login', extra = null) {
    return render(<AuthProvider><MemoryRouter initialEntries={[path]}>
        {extra}
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/noRegistrado" element={<NoRegistrado />} />
            <Route path="/estudiante" element={<RoleRoute allowedRoles={['estudiante']}><p>Student home</p></RoleRoute>} />
            <Route path="/miPerfil" element={<p>Student profile</p>} />
            <Route path="/admin" element={<RoleRoute allowedRoles={['administrador']}><p>Admin home</p></RoleRoute>} />
            <Route path="/unauthorized" element={<p>Access denied</p>} />
        </Routes>
    </MemoryRouter></AuthProvider>);
}

async function fillLogin() {
    fireEvent.change(await screen.findByLabelText('Usuario (UVUS)'), { target: { value: ' Alumno1 ' } });
    fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), { target: { value: 'clave-segura-123' } });
}

async function fillRegistro() {
    await fillLogin();
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: ' Ana Estudiante ' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ANA@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'clave-segura-123' } });
}

beforeEach(async () => {
    vi.clearAllMocks();
    obtenerSesion.mockReset().mockResolvedValue({ isAuthenticated: false, user: null });
    login.mockReset();
    registro.mockReset();
    logout.mockReset().mockResolvedValue({ isAuthenticated: false, user: null });
    await i18n.changeLanguage('es');
});
afterEach(cleanup);

describe('Web authentication', () => {
    it.each(['estudiante', 'administrador'])('logs in and navigates by the %s role', async rol => {
        login.mockResolvedValue(session(rol));
        renderAuth();
        await fillLogin();
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        expect(await screen.findByText(rol === 'estudiante' ? 'Student home' : 'Admin home')).toBeInTheDocument();
        expect(login).toHaveBeenCalledWith({ nombre_usuario: 'alumno1', password: 'clave-segura-123' });
    });

    it('creates an account without sending password confirmation and starts the session', async () => {
        registro.mockResolvedValue(session());
        renderAuth('/registro');
        await fillRegistro();
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
        expect(await screen.findByText('Student profile')).toBeInTheDocument();
        expect(registro).toHaveBeenCalledWith({ nombre_usuario: 'alumno1', nombre_completo: 'Ana Estudiante', correo: 'ana@example.com', password: 'clave-segura-123' });
    });

    it('rejects mismatched passwords before registration', async () => {
        renderAuth('/registro');
        await fillRegistro();
        fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'otra-clave-123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');
        expect(registro).not.toHaveBeenCalled();
    });

    it.each(['corta', 'a'.repeat(129)])('rejects a password outside the supported limits (%s)', async password => {
        renderAuth('/registro');
        await fillRegistro();
        fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), { target: { value: password } });
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Utiliza entre 12 y 128 caracteres.');
        expect(registro).not.toHaveBeenCalled();
    });

    it('shows a duplicate account error and permits retry', async () => {
        registro.mockRejectedValueOnce(new Error('El usuario o correo ya está registrado.')).mockResolvedValueOnce(session());
        renderAuth('/registro');
        await fillRegistro();
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('El usuario o correo ya está registrado.');
        expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
        expect(await screen.findByText('Student profile')).toBeInTheDocument();
    });

    it('shows server credential errors without navigating', async () => {
        login.mockRejectedValue(new Error('Usuario o contraseña incorrectos.'));
        renderAuth();
        await fillLogin();
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.');
        expect(screen.queryByText('Student home')).not.toBeInTheDocument();
    });

    it('shows network errors and re-enables login', async () => {
        login.mockRejectedValue(new TypeError('Failed to fetch'));
        renderAuth();
        await fillLogin();
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('No se puede conectar con el servidor.');
        expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled();
    });

    it('keeps malformed successful login responses anonymous', async () => {
        login.mockResolvedValue({ isAuthenticated: true });
        renderAuth();
        await fillLogin();
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido iniciar la sesión.');
    });

    it('prevents duplicate submissions while login is pending', async () => {
        let resolve;
        login.mockReturnValue(new Promise(done => { resolve = done; }));
        renderAuth();
        await fillLogin();
        const button = screen.getByRole('button', { name: 'Iniciar sesión' });
        fireEvent.click(button);
        fireEvent.submit(button.closest('form'));
        expect(button).toBeDisabled();
        expect(login).toHaveBeenCalledTimes(1);
        await act(async () => resolve(session()));
        expect(await screen.findByText('Student home')).toBeInTheDocument();
    });

    it('links between login and registration and preserves the legacy registration path', async () => {
        renderAuth('/noRegistrado');
        expect(await screen.findByRole('heading', { name: 'Crear una cuenta' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
        expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('link', { name: 'Crear una cuenta' }));
        expect(await screen.findByRole('heading', { name: 'Crear una cuenta' })).toBeInTheDocument();
    });

    it('denies access to the admin page for students', async () => {
        obtenerSesion.mockResolvedValue(session());
        renderAuth('/admin');
        expect(await screen.findByText('Access denied')).toBeInTheDocument();
        expect(screen.queryByText('Admin home')).not.toBeInTheDocument();
    });

    it('redirects anonymous access to protected pages to login', async () => {
        renderAuth('/admin');
        expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
});

describe('Session lifecycle', () => {
    it.each([new Error('Network'), Object.assign(new Error('Unauthorized'), { status: 401 }), new Error('Server 500')])('ends loading after session request failures', async error => {
        obtenerSesion.mockRejectedValue(error);
        render(<AuthProvider><SessionProbe /></AuthProvider>);
        await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('anonymous'));
    });

    it('ends loading on malformed session responses', async () => {
        obtenerSesion.mockResolvedValue({ err: true });
        render(<AuthProvider><SessionProbe /></AuthProvider>);
        await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('anonymous'));
    });

    it('does not overwrite a new session with an earlier check', async () => {
        let resolve;
        obtenerSesion.mockReturnValue(new Promise(done => { resolve = done; }));
        render(<AuthProvider><SessionProbe /></AuthProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'Set session' }));
        expect(screen.getByTestId('session')).toHaveTextContent('estudiante');
        await act(async () => resolve({ isAuthenticated: false }));
        expect(screen.getByTestId('session')).toHaveTextContent('estudiante');
    });

    it('refreshes session changes', async () => {
        render(<AuthProvider><SessionProbe /></AuthProvider>);
        await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('anonymous'));
        obtenerSesion.mockResolvedValue(session('administrador'));
        fireEvent.click(screen.getByRole('button', { name: 'Refresh session' }));
        await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('administrador'));
    });

    it.each([['estudiante', NavbarEstudiante], ['administrador', NavbarAdmin]])('logs out from the %s navigation and clears context', async (rol, Navbar) => {
        obtenerSesion.mockResolvedValue(session(rol));
        renderAuth(rol === 'estudiante' ? '/estudiante' : '/admin', <><Navbar /><SessionProbe /></>);
        const buttons = await screen.findAllByRole('button', { name: /Cerrar sesión/ });
        fireEvent.click(buttons[buttons.length - 1]);
        expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
        expect(logout).toHaveBeenCalledOnce();
        expect(screen.getByTestId('session')).toHaveTextContent('anonymous');
    });
});
