import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import { AutorizacionService } from '../src/services/autorizacionService.mjs';
import { createAutorizacionRouter } from '../src/routes/autorizacionRoutes.mjs';
import { createAuthRateLimit } from '../src/middleware/authRateLimit.mjs';
import { verificarRol } from '../src/middleware/rolMiddleware.mjs';
import { FakeAuthDatabase } from './helpers/fakeAuthDatabase.mjs';

const account = { nombre_usuario: 'alumna', nombre_completo: 'Alumna de Prueba', correo: 'alumna@example.test', password: 'una contraseña segura' };

async function fixture(t, { rateLimit } = {}) {
  const db = new FakeAuthDatabase();
  const service = new AutorizacionService(db);
  const store = new session.MemoryStore();
  const app = express();
  app.locals.sessionCookieName = 'FCEYE.sid';
  app.locals.sessionCookieOptions = { path: '/', httpOnly: true, sameSite: 'lax', secure: false };
  app.use(express.json());
  app.use(session({ name: 'FCEYE.sid', secret: 'test-secret-only-01234567890123456789', store, resave: false, saveUninitialized: false, cookie: app.locals.sessionCookieOptions }));
  app.get('/preauth', (req, res) => { req.session.beforeLogin = true; res.json({ ok: true }); });
  app.use('/api/v1/autorizacion', createAutorizacionRouter({ service, rateLimit }));
  app.get('/admin', verificarRol('administrador'), (_req, res) => res.json({ ok: true }));
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close(error => error ? reject(error) : resolve());
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (method, path, body, cookie) => {
    const response = await fetch(`${base}${path.startsWith('/api') || path === '/admin' || path === '/preauth' ? path : '/api/v1/autorizacion' + path}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    const contentType = response.headers.get('content-type') || '';
    return { status: response.status, body: contentType.includes('application/json') ? await response.json() : await response.text(), headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  return { db, service, store, request };
}

test('registro, sesión regenerada, login y logout funcionan por HTTP sin Telegram ni SAML', async t => {
  const { db, store, request } = await fixture(t);
  assert.equal((await request('GET', '/obtenerSesion')).status, 401);
  const anonymous = await request('GET', '/preauth');
  const registered = await request('POST', '/registro', { ...account, nombre_usuario: ' ALUMNA ', correo: ' ALUMNA@EXAMPLE.TEST ', rol: 'administrador', activo: false, chatid: 'injected' }, anonymous.cookie);
  assert.equal(registered.status, 201);
  assert.deepEqual(registered.body, { isAuthenticated: true, user: { uvus: 'alumna', rol: 'estudiante' } });
  assert.notEqual(registered.cookie, anonymous.cookie);
  assert.equal(db.users.length, 1);
  assert.equal(db.users[0].correo, 'alumna@example.test');
  assert.equal(db.users[0].activo, true);
  assert.equal(db.users[0].chatid, null);
  assert.equal(db.users[0].userid, null);
  assert.ok(db.users[0].password_hash.startsWith('scrypt$'));
  assert.equal(db.roles[0].rol, 'estudiante');
  const storedSessions = await new Promise((resolve, reject) => store.all((error, sessions) => error ? reject(error) : resolve(sessions)));
  assert.equal(Object.keys(storedSessions).length, 1);
  const storedUser = Object.values(storedSessions)[0].user;
  assert.deepEqual(Object.keys(storedUser).sort(), ['id', 'nombre_completo', 'nombre_usuario', 'rol']);
  assert.equal((await request('GET', '/obtenerSesion', undefined, anonymous.cookie)).status, 401);
  assert.equal((await request('GET', '/admin', undefined, registered.cookie)).status, 403);
  assert.deepEqual((await request('GET', '/obtenerSesion', undefined, registered.cookie)).body, registered.body);
  const loggedIn = await request('POST', '/login', { nombre_usuario: 'ALUMNA', password: account.password }, registered.cookie);
  assert.equal(loggedIn.status, 200);
  assert.notEqual(loggedIn.cookie, registered.cookie);
  assert.equal((await request('GET', '/obtenerSesion', undefined, registered.cookie)).status, 401);
  const loggedOut = await request('POST', '/logout', undefined, loggedIn.cookie);
  assert.equal(loggedOut.status, 200);
  assert.deepEqual(loggedOut.body, { isAuthenticated: false });
  assert.match(loggedOut.headers.get('set-cookie'), /^FCEYE\.sid=;/);
  assert.equal((await request('GET', '/obtenerSesion', undefined, loggedIn.cookie)).status, 401);
  assert.equal((await request('GET', '/logout')).status, 404);
  assert.equal((await request('GET', '/saml/login')).status, 404);
  assert.ok(db.connections.every(connection => connection.closed));
});

test('validación HTTP rechaza tipos y límites antes de consultar la BD', async t => {
  const { db, request } = await fixture(t, { rateLimit: (_req, _res, next) => next() });
  const invalid = [
    {}, [], { nombre_usuario: {} }, { nombre_usuario: 'ab' }, { nombre_usuario: 'a'.repeat(51) },
    { nombre_usuario: 'usuario con espacios' }, { password: 123456789012 }, { password: 'corta' },
    { password: 'x'.repeat(129) }, { nombre_completo: '' }, { nombre_completo: 'x'.repeat(151) },
    { nombre_completo: 'Nombre\nInyectado' }, { correo: 'sin-arroba' }, { correo: [] }, { correo: 'x'.repeat(250) + '@ejemplo.test' },
  ];
  for (const change of invalid) {
    const body = Array.isArray(change) || Object.keys(change).length === 0 ? change : { ...account, ...change };
    const result = await request('POST', '/registro', body);
    assert.equal(result.status, 400, JSON.stringify(change));
  }
  assert.equal(db.connections.length, 0);
});

test('usuario/correo duplicados, incluso registros simultáneos, devuelven 409 sin filas parciales', async t => {
  const { db, request } = await fixture(t);
  const results = await Promise.all([
    request('POST', '/registro', account),
    request('POST', '/registro', { ...account, nombre_usuario: ' ALUMNA ', correo: 'otro@example.test' }),
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal(db.users.length, 1);
  assert.equal(db.roles.length, 1);
  const duplicateEmail = await request('POST', '/registro', { ...account, nombre_usuario: 'otra-alumna', correo: db.users[0].correo.toUpperCase() });
  assert.equal(duplicateEmail.status, 409);
  assert.equal(db.users.length, 1);
  assert.equal(db.roles.length, 1);
  assert.ok(db.connections.some(connection => connection.commands.includes('ROLLBACK')));
  assert.ok(db.connections.every(connection => connection.closed));
});

test('fallo al insertar rol revierte usuario y no expone detalles internos', async t => {
  const { db, request } = await fixture(t);
  db.failRoleInsert = true;
  const result = await request('POST', '/registro', account);
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result.body).includes('secret database'), false);
  assert.equal(result.cookie, undefined);
  assert.equal(db.users.length, 0);
  assert.equal(db.roles.length, 0);
  assert.ok(db.connections[0].commands.includes('ROLLBACK'));
  assert.equal(db.connections[0].closed, true);
});

test('contraseña incorrecta, usuario inexistente, inactivo y legado producen el mismo 401', async t => {
  const { db, request } = await fixture(t);
  await request('POST', '/registro', account);
  const denied = [];
  denied.push(await request('POST', '/login', { nombre_usuario: account.nombre_usuario, password: 'contraseña incorrecta' }));
  denied.push(await request('POST', '/login', { nombre_usuario: 'inexistente', password: account.password }));
  db.users[0].activo = false;
  denied.push(await request('POST', '/login', { nombre_usuario: account.nombre_usuario, password: account.password }));
  db.users[0].activo = true;
  db.users[0].password_hash = null;
  denied.push(await request('POST', '/login', { nombre_usuario: account.nombre_usuario, password: account.password }));
  for (const result of denied) {
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { message: 'Usuario o contraseña incorrectos.' });
    assert.equal(result.cookie, undefined);
  }
  assert.equal((await request('POST', '/registro', account)).status, 409);
});

test('sesión refleja cambios de rol y una desactivación destruye la sesión anterior', async t => {
  const { db, request } = await fixture(t);
  const registered = await request('POST', '/registro', account);
  db.roles[0].rol = 'administrador';
  const refreshed = await request('GET', '/obtenerSesion', undefined, registered.cookie);
  assert.equal(refreshed.body.user.rol, 'administrador');
  assert.equal((await request('GET', '/admin', undefined, registered.cookie)).status, 200);
  db.users[0].activo = false;
  assert.equal((await request('GET', '/obtenerSesion', undefined, registered.cookie)).status, 401);
  db.users[0].activo = true;
  assert.equal((await request('GET', '/obtenerSesion', undefined, registered.cookie)).status, 401);
});

test('roles ausentes o ambiguos no crean una sesión con permisos arbitrarios', async t => {
  const { db, request } = await fixture(t);
  await request('POST', '/registro', account);
  db.roles.push({ usuario_id_fk: db.users[0].id, rol: 'administrador' });
  assert.equal((await request('POST', '/login', account)).status, 401);
  db.roles = [];
  assert.equal((await request('POST', '/login', account)).status, 401);
});

test('una sesión no se transfiere a otra cuenta que reutilice el mismo nombre', async t => {
  const { db, request } = await fixture(t);
  const registered = await request('POST', '/registro', account);
  db.users[0].id += 1;
  db.roles[0].usuario_id_fk = db.users[0].id;
  assert.equal((await request('GET', '/obtenerSesion', undefined, registered.cookie)).status, 401);
});

test('login y registro comparten límite de intentos y se permite reintentar al expirar', async t => {
  let clock = 1000;
  const rateLimit = createAuthRateLimit({ max: 2, windowMs: 1000, now: () => clock });
  const { request } = await fixture(t, { rateLimit });
  assert.equal((await request('POST', '/login', {})).status, 400);
  assert.equal((await request('POST', '/registro', {})).status, 400);
  const limited = await request('POST', '/login', {});
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '1');
  assert.equal((await request('POST', '/logout')).status, 200);
  clock += 1000;
  assert.equal((await request('POST', '/login', {})).status, 400);
});

test('varios alumnos tras un NAT pueden registrarse y acceder sin agotar el cupo de fallos', async t => {
  const { request } = await fixture(t, { rateLimit: createAuthRateLimit({ max: 2 }) });
  for (let index = 0; index < 4; index++) {
    const student = { ...account, nombre_usuario: `alumna${index}`, correo: `alumna${index}@example.test` };
    assert.equal((await request('POST', '/registro', student)).status, 201);
    assert.equal((await request('POST', '/login', student)).status, 200);
  }
  assert.equal((await request('POST', '/login', {})).status, 400);
  assert.equal((await request('POST', '/login', { nombre_usuario: 'alumna0', password: account.password })).status, 200);
  assert.equal((await request('POST', '/registro', {})).status, 400);
  assert.equal((await request('POST', '/login', account)).status, 429);
});

test('las peticiones simultáneas ocupan plaza hasta finalizar y un 429 no consume plazas nuevas', async t => {
  const { request, service } = await fixture(t, { rateLimit: createAuthRateLimit({ max: 2 }) });
  const user = { id: 1, nombre_usuario: account.nombre_usuario, nombre_completo: account.nombre_completo, rol: 'estudiante' };
  const pending = [];
  let signalStarted;
  const started = new Promise(resolve => { signalStarted = resolve; });
  service.login = () => new Promise(resolve => {
    pending.push(resolve);
    if (pending.length === 2) signalStarted();
  });
  const concurrent = [request('POST', '/login', account), request('POST', '/login', account)];
  await started;
  try {
    assert.equal((await request('POST', '/login', account)).status, 429);
    assert.equal((await request('POST', '/registro', account)).status, 429);
  } finally {
    pending.forEach(resolve => resolve(user));
  }
  assert.deepEqual((await Promise.all(concurrent)).map(result => result.status), [200, 200]);
  service.login = async () => user;
  assert.equal((await request('POST', '/login', account)).status, 200);
});
