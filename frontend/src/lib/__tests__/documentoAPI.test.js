import { it, expect, vi, afterEach } from 'vitest';
import { postDocumento } from '../methodAPIs.js';
import { validarLetraDNI } from '../validadores.js';
import { resolverDocumentoPermuta, obtenerDocumentoPermuta } from '../../services/permuta.js';

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

it('resuelve los IDs seleccionados con el formato anterior de listarPermutas', async () => {
  const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ error: false, result: [{ id: 12, estado: 'BORRADOR' }] }) }));
  vi.stubGlobal('fetch', fetch);
  await expect(resolverDocumentoPermuta([6,5])).resolves.toBe(12);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ IdsPermuta: [6,5] });
});

it.each([[], [{id: 1}, {id: 2}], [{id: null}], [{id: 12, grupo: {permutas: [{permuta_id: 2}]}}]])(
  'rechaza documentos ausentes, ambiguos o distintos: %j', async result => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ err: false, result }) })));
    await expect(resolverDocumentoPermuta([6,5])).rejects.toThrow();
  },
);

it('distingue una ruta no desplegada de un documento inexistente', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ message: 'Ruta no encontrada.' }) })));
  await expect(obtenerDocumentoPermuta(12)).rejects.toThrow('backend');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ message: 'No se encuentra el documento.' }) })));
  await expect(obtenerDocumentoPermuta(12)).rejects.toThrow('No se encuentra el documento.');
});
