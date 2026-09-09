import test from 'node:test';
import assert from 'node:assert/strict';
import database from '../src/config/database.mjs';
import notificacionService from '../src/services/notificacionService.mjs';
import incidenciaService from '../src/services/incidenciaService.mjs';
import solicitudPermutaService from '../src/services/solicitudPermutaService.mjs';
import { handleIncomingMessage, handleCallbackQuery, sendMessage } from '../src/services/telegramService.mjs';
import { setBotCommands } from '../src/middleware/botCommands.mjs';

function fakeConnection(t, query) {
  const connection = {
    query: t.mock.fn(query),
    end: t.mock.fn(async () => undefined),
  };
  t.mock.method(database, 'connectPostgreSQL', async () => connection);
  return connection;
}

test('un aviso se guarda y se consulta en la web sin identificadores de Telegram', async (t) => {
  const avisos = [];
  const connection = fakeConnection(t, async ({ text, values }) => {
    assert.doesNotMatch(text, /chat_?id|user_?id\b/i);
    if (/^insert into notificacion/i.test(text)) {
      avisos.push({ id: 1, contenido: values[1], fecha_creacion: '2026-09-09' });
      assert.deepEqual(values, ['administrador', 'Plazo abierto', 'estudiante']);
      return { rows: [] };
    }
    assert.match(text, /from notificacion/i);
    assert.deepEqual(values, ['alumno']);
    return { rows: avisos };
  });

  const result = await notificacionService.crearNotificacionesUsuario('administrador', 'Plazo abierto', 'estudiante');
  assert.match(result, /disponible en la aplicación/);
  assert.deepEqual(await notificacionService.getNotificacionesUsuario('alumno'), avisos);
  assert.equal(avisos.length, 1);
  assert.equal(connection.query.mock.callCount(), 2);
  assert.equal(connection.end.mock.callCount(), 2);
});

test('el error al guardar un aviso se informa y cierra la conexión', async (t) => {
  const connection = fakeConnection(t, async () => { throw new Error('insert failed'); });
  t.mock.method(console, 'error', () => undefined);
  await assert.rejects(
    notificacionService.crearNotificacionesUsuario('administrador', 'Aviso', 'all'),
    /Error al crear la notificación/,
  );
  assert.equal(connection.end.mock.callCount(), 1);
});

test('una incidencia conserva su transacción y asociación al usuario sin Telegram', async (t) => {
  const queries = [];
  const connection = fakeConnection(t, async (query) => {
    queries.push(query);
    if (typeof query === 'string') return { rows: [] };
    assert.doesNotMatch(query.text, /chat_?id/i);
    if (/INSERT INTO incidencia \(/i.test(query.text)) {
      return { rows: [{ id: 42, fecha_creacion: '2026-09-09' }] };
    }
    assert.match(query.text, /INSERT INTO incidencia_usuario/i);
    assert.deepEqual(query.values, [42, 'alumno']);
    return { rows: [] };
  });

  assert.equal(
    await incidenciaService.crearIncidencia('No aparece mi grupo', 'grupo', null, 'alumno'),
    'Se ha creado la incidencia correctamente',
  );
  assert.equal(queries[0], 'BEGIN');
  assert.equal(queries.at(-1), 'COMMIT');
  assert.equal(queries.length, 4);
  assert.equal(connection.end.mock.callCount(), 1);
});

test('una solicitud guarda sus grupos sin consultar datos del antiguo mensaje', async (t) => {
  const queries = [];
  const connection = fakeConnection(t, async (query) => {
    queries.push(query);
    assert.doesNotMatch(query.text, /chat_?id/i);
    if (/SELECT 1\s+FROM solicitud_permuta/i.test(query.text)) return { rows: [] };
    if (/insert into solicitud_permuta/i.test(query.text)) return { rows: [{ id: 17 }] };
    assert.match(query.text, /insert into grupo_deseado/i);
    return { rows: [] };
  });

  assert.equal(await solicitudPermutaService.solicitarPermuta('alumno', '12345', ['2', '3']), 'Permuta de la asignatura solicitada.');
  assert.deepEqual(queries.slice(2).map(({ values }) => values), [['12345', '2', 17], ['12345', '3', 17]]);
  assert.equal(queries.length, 4);
  assert.equal(connection.end.mock.callCount(), 1);
});

test('los antiguos puntos de entrada de Telegram no acceden a red ni base de datos', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Network is disabled'); });
  const connect = t.mock.method(database, 'connectPostgreSQL', async () => { throw new Error('Database is disabled'); });

  await sendMessage(123, 'Aviso');
  await setBotCommands();
  await handleIncomingMessage({ chat: { id: 123 }, from: { id: 123 }, text: '/start' });
  await handleCallbackQuery({ message: { chat: { id: 123 } }, data: 'aceptar_alumno' });
  await notificacionService.notificarCierreIncidencia(42, 'Resuelta');

  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(connect.mock.callCount(), 0);
});
