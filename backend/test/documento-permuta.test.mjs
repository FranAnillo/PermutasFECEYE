import test from 'node:test';
import assert from 'node:assert/strict';
import database from '../src/config/database.mjs';
import solicitudPermutaService from '../src/services/solicitudPermutaService.mjs';

test('verListaPermutas entrega todos los datos necesarios para rellenar el documento', async t => {
  const originalConnect = database.connectPostgreSQL;
  let query;
  let closed = false;
  database.connectPostgreSQL = async () => ({
    async query(statement) {
      query = statement;
      return {
        rows: [{
          permuta_id: 41,
          usuario_1_uvus: 'aaa0001',
          usuario_2_uvus: 'bbb0002',
          usuario_1_nombre: 'Ana Alumna',
          usuario_2_nombre: 'Bruno Alumno',
          usuario_1_estudio: 'Grado en Economía',
          usuario_2_estudio: 'Grado en Economía',
          usuario_1_correo: 'ana@example.test',
          usuario_2_correo: 'bruno@example.test',
          nombre_asignatura: 'Estadística',
          curso_asignatura: '2',
          usuario_1_grupo: '1',
          usuario_2_grupo: '3',
        }],
      };
    },
    async end() { closed = true; },
  });
  t.after(() => { database.connectPostgreSQL = originalConnect; });

  const result = await solicitudPermutaService.verListaPermutas('aaa0001');

  assert.deepEqual(result, [{
    usuarios: [
      { nombre_completo: 'Ana Alumna', uvus: 'aaa0001', estudio: 'Grado en Economía', correo: 'ana@example.test' },
      { nombre_completo: 'Bruno Alumno', uvus: 'bbb0002', estudio: 'Grado en Economía', correo: 'bruno@example.test' },
    ],
    permutas: [{
      nombre_asignatura: 'Estadística',
      curso_asignatura: '2',
      usuario_1_uvus: 'aaa0001',
      usuario_2_uvus: 'bbb0002',
      usuario_1_grupo: '1',
      usuario_2_grupo: '3',
      permuta_id: 41,
    }],
  }]);
  assert.equal(query.values[0], 'aaa0001');
  assert.match(query.text, /u1\.correo/);
  assert.match(query.text, /a\.curso/);
  assert.match(query.text, /grupo_id_1_fk/);
  assert.match(query.text, /grupo_id_2_fk/);
  assert.equal(closed, true);
});
