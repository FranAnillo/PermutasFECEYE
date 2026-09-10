import { it, expect, vi, afterEach } from 'vitest';
import { postDocumento } from '../methodAPIs.js';
import { validarLetraDNI } from '../validadores.js';

afterEach(() => vi.unstubAllGlobals());
it.each([
  [false, { message: 'No es tu turno' }],
  [true, { err: true, message: 'No es tu turno' }],
  [true, { error: true, message: 'No es tu turno' }],
])('propaga el error HTTP o de negocio (%s)', async (ok, data) => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => data })));
  await expect(postDocumento('/test', {})).rejects.toThrow('No es tu turno');
});
it('comprueba la correspondencia entre número y letra del DNI', () => {
  expect(validarLetraDNI('Z', '12345678')).toBe('');
  expect(validarLetraDNI('A', '12345678')).not.toBe('');
});
