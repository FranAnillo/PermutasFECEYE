import { describe, expect, it } from 'vitest';
import {
  prepararDatosDocumento,
  validarDatosSistemaDocumento,
} from '../../../lib/prepararDatosDocumento.js';

describe('datos del documento de permuta', () => {
  it('coloca primero al firmante inicial y refleja el intercambio de grupos', () => {
    const grupo = {
      usuarios: [
        { uvus: 'aaa0001', nombre_completo: 'Segundo estudiante', estudio: 'ADE', correo: 'segundo@example.test' },
        { uvus: 'zzz0001', nombre_completo: 'Primer estudiante', estudio: 'ADE', correo: 'primero@example.test' },
      ],
      permutas: [{
        permuta_id: 8,
        nombre_asignatura: 'Estadística',
        curso_asignatura: '1',
        usuario_1_uvus: 'aaa0001',
        usuario_2_uvus: 'zzz0001',
        usuario_1_grupo: 2,
        usuario_2_grupo: 7,
      }],
    };

    const result = prepararDatosDocumento(grupo, 'zzz0001');

    expect(result.usuarios.map(usuario => usuario.uvus)).toEqual(['zzz0001', 'aaa0001']);
    expect(result.permutas[0]).toMatchObject({
      grupo_actual_1: 7,
      grupo_nuevo_1: 2,
      grupo_actual_2: 2,
      grupo_nuevo_2: 7,
    });
    expect(validarDatosSistemaDocumento(result)).toEqual([]);
  });

  it('detecta respuestas antiguas del backend antes de crear un PDF incompleto', () => {
    const incompletos = validarDatosSistemaDocumento({
      usuarios: [
        { estudio: 'ECO' },
        { estudio: 'ECO' },
      ],
      permutas: [{ nombre_asignatura: 'Matemáticas II' }],
    });

    expect(incompletos).toEqual(expect.arrayContaining([
      'correo del estudiante 1',
      'correo del estudiante 2',
      'curso de la fila 1',
      'grupo actual de la fila 1',
      'grupo nuevo de la fila 1',
    ]));
  });

  it('no atribuye un grupo al estudiante si falta su identidad en la fila', () => {
    const datos = prepararDatosDocumento({ usuarios: [
      { uvus: 'a', correo: 'a@example.test', estudio: 'ECO' },
      { uvus: 'b', correo: 'b@example.test', estudio: 'ECO' },
    ], permutas: [{ nombre_asignatura: 'Finanzas', curso_asignatura: 2,
      usuario_1_grupo: 2, usuario_2_grupo: 3 }] }, 'a');
    expect(datos.permutas[0].grupo_actual_1).toBeUndefined();
    expect(validarDatosSistemaDocumento(datos)).toContain('identidad de los participantes de la fila 1');
  });

  it('rechaza un primer firmante ajeno a la pareja', () => {
    expect(() => prepararDatosDocumento({ usuarios: [{ uvus: 'a' }, { uvus: 'b' }] }, 'c')).toThrow('primer firmante');
  });
});
