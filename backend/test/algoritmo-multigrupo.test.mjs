import test from 'node:test';
import assert from 'node:assert/strict';
import PermutaMatching from '../src/algorithm/AlgoritmoCruzadoSolicitudes.mjs';

test('encuentra una alternativa compatible entre varios grupos deseados de la misma asignatura', () => {
  const estudiantes = [
    { id: 1, grupo: '1', asignatura: 10 },
    { id: 4, grupo: '3', asignatura: 11 },
    { id: 2, grupo: '2', asignatura: 10 },
    { id: 3, grupo: '3', asignatura: 10 },
  ];
  const solicitudes = [
    { estudianteId: 1, permutaA: '2', asignatura: 10 },
    { estudianteId: 1, permutaA: '3', asignatura: 10 },
    { estudianteId: 3, permutaA: '1', asignatura: 10 },
  ];

  const matching = new PermutaMatching(estudiantes, solicitudes);
  matching.construirGrafo();

  assert.deepEqual([...matching.grafo.get(1).keys()], [2, 3]);
  assert.deepEqual(matching.emparejar(), [{
    estudiante1: 1,
    estudiante2: 3,
    asignaturas: [10],
  }]);
});
