import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, registro, obtenerSesion, logout } from '../login.js';

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe('Authentication HTTP contract', () => {
    it.each([['login', login, 'POST'], ['registro', registro, 'POST'], ['logout', logout, 'POST'], ['obtenerSesion', obtenerSesion, 'GET']])('%s uses the web endpoint and session credentials', async (path, request, method) => {
        const data = { isAuthenticated: true, user: { uvus: 'alumno1', rol: 'estudiante' } };
        fetch.mockResolvedValue({ ok: true, json: async () => data });
        expect(await request()).toEqual(data);
        expect(fetch).toHaveBeenCalledWith(`/api/v1/autorizacion/${path}`, expect.objectContaining({ method, credentials: 'include' }));
    });

    it('sends login fields as JSON', async () => {
        fetch.mockResolvedValue({ ok: true, json: async () => ({ isAuthenticated: true }) });
        await login({ nombre_usuario: 'ana', password: 'una-clave-larga' });
        expect(fetch).toHaveBeenCalledWith('/api/v1/autorizacion/login', expect.objectContaining({ body: JSON.stringify({ nombre_usuario: 'ana', password: 'una-clave-larga' }) }));
    });

    it('preserves HTTP failure status and server message', async () => {
        fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: 'El correo ya está registrado.' }) });
        await expect(registro({})).rejects.toMatchObject({ status: 409, message: 'El correo ya está registrado.' });
    });

    it('rejects non-JSON replies instead of reporting success', async () => {
        fetch.mockResolvedValue({ ok: true, json: async () => { throw new Error('HTML response'); } });
        await expect(login({})).rejects.toThrow('No se ha podido conectar');
    });
});
