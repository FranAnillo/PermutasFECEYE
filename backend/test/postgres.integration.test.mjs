import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

// Opt-in: únicamente una BD de pruebas vacía, local y llamada FCEYE_test.
// No apunta a la configuración .env de la aplicación.
await test('PostgreSQL: migraciones, registro HTTP, sesión persistente y permisos', {
  skip: !process.env.FCEYE_TEST_DB_PORT,
}, async t => {
  const config = { host: '127.0.0.1', port: Number(process.env.FCEYE_TEST_DB_PORT),
    user: 'postgres', password: 'FCEYE-test-only', database: 'FCEYE_test' };
  const client = new pg.Client(config);
  await client.connect();
  let server;
  let store;
  let ownsTables = false;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (store) await store.close();
    if (ownsTables) await client.query('DROP TABLE IF EXISTS sesion_web, notificacion, roles, usuario, estudios CASCADE');
    await client.end();
  });
  const existing = await client.query("SELECT to_regclass('public.usuario') AS tabla");
  assert.equal(existing.rows[0].tabla, null, 'La BD temporal debe estar vacía; no se borrarán datos existentes.');
  await client.query(`
    CREATE TABLE estudios (id serial PRIMARY KEY, nombre text, siglas text);
    CREATE TABLE usuario (id serial PRIMARY KEY, nombre_completo varchar(50) NOT NULL,
      correo varchar(100) UNIQUE NOT NULL, nombre_usuario varchar(50) NOT NULL,
      activo boolean NOT NULL, estudios_id_fk integer REFERENCES estudios(id),
      userid bigint NOT NULL, chatid bigint NOT NULL, UNIQUE(userid, chatid));
    CREATE TABLE roles (usuario_id_fk integer NOT NULL REFERENCES usuario(id), rol text NOT NULL);
    CREATE TABLE notificacion (id serial PRIMARY KEY, usuario_id_fk integer REFERENCES usuario(id),
      contenido text, receptor text, fecha_creacion timestamp DEFAULT now(), fecha_expiracion timestamp);
    INSERT INTO usuario(nombre_completo,correo,nombre_usuario,activo,userid,chatid)
      VALUES ('Usuario previo','previo@example.test','previo',true,1,1);
    INSERT INTO roles VALUES (1,'estudiante');
  `);
  // Si algo falla, solo se limpian las tablas que acabamos de crear en esta BD vacía.
  ownsTables = true;
  for (let iteration = 0; iteration < 2; iteration++) {
    for (const migration of ['001_autenticacion_local.sql', '002_sesiones_web.sql']) {
      await client.query(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
    }
  }
  const legacy = await client.query("SELECT password_hash,userid FROM usuario WHERE nombre_usuario='previo'");
  assert.equal(legacy.rows[0].password_hash, null);
  assert.equal(legacy.rows[0].userid, '1');
  Object.assign(process.env, { DB_HOST: config.host, DB_PORT: String(config.port), DB_USER: config.user,
    DB_PASS: config.password, DB_DATABASE: config.database });
  const { createApp } = await import('../src/app.mjs');
  const { createAutorizacionRouter } = await import('../src/routes/autorizacionRoutes.mjs');
  const { createAuthRateLimit } = await import('../src/middleware/authRateLimit.mjs');
  const app = createApp({ env: { ...process.env, NODE_ENV: 'development', SESSION_STORE: 'postgres',
    SESSION_SECRET: 'FCEYE-integration-test-session-secret-only', FRONTEND_URL: 'http://localhost:5173' },
    authRouter: createAutorizacionRouter({ rateLimit: createAuthRateLimit({ max: 100 }) }) });
  store = app.locals.sessionStore;
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(route, { method = 'POST', body, cookie, origin } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    return fetch(base + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  const auth = '/api/v1/autorizacion';
  const data = { nombre_usuario: ' Alumna.Test ', nombre_completo: 'Estudiante FCEYE '.repeat(7).trim(),
    correo: 'ALUMNA@example.test', password: 'Una clave local 2026', rol: 'administrador' };
  assert.equal((await request('/api/health', { method: 'GET' })).status, 200);
  assert.equal((await request('/api/v1/usuario/obtenerDatosUsuario')).status, 401);
  assert.equal((await request(auth + '/registro', { body: data, origin: 'https://untrusted.example' })).status, 403);
  const created = await request(auth + '/registro', { body: data, origin: 'http://localhost:5173' });
  assert.equal(created.status, 201, await created.clone().text());
  assert.deepEqual(await created.json(), { isAuthenticated: true, user: { uvus: 'alumna.test', rol: 'estudiante' } });
  const cookie = created.headers.get('set-cookie').split(';')[0];
  assert.match(created.headers.get('set-cookie'), /HttpOnly/);
  assert.match(created.headers.get('set-cookie'), /SameSite=Lax/);
  const stored = await client.query("SELECT * FROM usuario WHERE nombre_usuario='alumna.test'");
  assert.equal(stored.rows[0].chatid, null);
  assert.equal(stored.rows[0].userid, null);
  assert.equal(stored.rows[0].correo, 'alumna@example.test');
  assert.match(stored.rows[0].password_hash, /^scrypt\$/);
  assert.notEqual(stored.rows[0].password_hash, data.password);
  assert.equal((await client.query('SELECT count(*) FROM sesion_web')).rows[0].count, '1');
  assert.equal((await request(auth + '/obtenerSesion', { method: 'GET', cookie })).status, 200);
  const profile = await request('/api/v1/usuario/obtenerDatosUsuario', { cookie });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).result.titulacion, null);
  assert.equal((await request('/api/v1/usuario/obtenerTodosUsuarios', { cookie })).status, 403);
  assert.equal((await request(auth + '/registro', { body: { ...data, correo: 'different@example.test' } })).status, 409);
  assert.equal((await request(auth + '/registro', { body: { ...data, nombre_usuario: 'different' } })).status, 409);
  const concurrent = await Promise.all([1, 2].map(() => request(auth + '/registro', {
    body: { ...data, nombre_usuario: 'concurrent', correo: 'concurrent@example.test' },
  })));
  assert.deepEqual(concurrent.map(response => response.status).sort(), [201, 409]);
  assert.equal((await request(auth + '/login', { body: { ...data, password: 'Una clave erronea' } })).status, 401);
  assert.equal((await request(auth + '/login', { body: { ...data, nombre_usuario: 'previo' } })).status, 401);
  const loggedIn = await request(auth + '/login', { body: data, cookie });
  assert.equal(loggedIn.status, 200);
  const newCookie = loggedIn.headers.get('set-cookie').split(';')[0];
  assert.notEqual(cookie, newCookie);
  assert.equal((await request(auth + '/obtenerSesion', { method: 'GET', cookie })).status, 401);
  await client.query("UPDATE roles SET rol='administrador' WHERE usuario_id_fk=$1", [stored.rows[0].id]);
  assert.equal((await (await request(auth + '/obtenerSesion', { method: 'GET', cookie: newCookie })).json()).user.rol, 'administrador');
  assert.equal((await request('/api/v1/usuario/obtenerDatosUsuarioAdmin', { cookie: newCookie })).status, 200);
  await client.query("UPDATE usuario SET activo=false WHERE nombre_usuario='alumna.test'");
  assert.equal((await request('/api/v1/usuario/obtenerDatosUsuarioAdmin', { cookie: newCookie })).status, 401);
  assert.equal((await request(auth + '/login', { body: data })).status, 401);
  await client.query("UPDATE usuario SET activo=true WHERE nombre_usuario='alumna.test'");
  const reactivated = await request(auth + '/login', { body: data });
  const finalCookie = reactivated.headers.get('set-cookie').split(';')[0];
  assert.equal((await request(auth + '/logout', { cookie: finalCookie })).status, 200);
  assert.equal((await request(auth + '/obtenerSesion', { method: 'GET', cookie: finalCookie })).status, 401);
  // Un error al insertar el rol no deja una cuenta parcial.
  await client.query("ALTER TABLE roles ADD CONSTRAINT test_reject_new_roles CHECK (rol <> 'estudiante') NOT VALID");
  assert.equal((await request(auth + '/registro', { body: { ...data, nombre_usuario: 'rollback', correo: 'rollback@example.test' } })).status, 500);
  assert.equal((await client.query("SELECT count(*) FROM usuario WHERE nombre_usuario='rollback'")).rows[0].count, '0');
});
