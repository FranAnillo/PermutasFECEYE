import { describe, expect, it } from 'vitest';
import { prepararDatosDocumento } from '../generacionPDF';

describe('datos del documento de permuta', () => {
  it('coloca primero al firmante inicial y refleja el intercambio de grupos', () => {
    const grupo = {
      usuarios: [
        { uvus: 'aaa0001', nombre_completo: 'Segundo estudiante', estudio: 'ADE' },
        { uvus: 'zzz0001', nombre_completo: 'Primer estudiante', estudio: 'ADE' },
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
  });
});
