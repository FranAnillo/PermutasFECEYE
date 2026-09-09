import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { databaseConfig } from './config/database.mjs';
import autorizacionRouter from './routes/autorizacionRoutes.mjs';
import usuarioRouter from './routes/usuarioRoutes.mjs';
import estudioRouter from './routes/estudiosRoutes.mjs';
import asignaturaRouter from './routes/asignaturaRoutes.mjs';
import usuarioAsignaturaRouter from './routes/usuarioAsignaturaRoutes.mjs';
import usuarioGrupoRouter from './routes/usuarioGrupoRoutes.mjs';
import grupoRouter from './routes/grupoRoutes.mjs';
import incidenciaRouter from './routes/incidenciaRoutes.mjs';
import notificacionRouter from './routes/notificacionRoutes.mjs';
import solicitudPermutaRouter from './routes/solicitudPermutaRoutes.mjs';
import uploadRouter from './routes/uploadRoutes.mjs';
import permutaRouter from './routes/permutasRoutes.mjs';
import administradorRouter from './routes/administradorRoutes.mjs';
import autorizacionService from './services/autorizacionService.mjs';
// FECEYE: el bot queda desactivado; se conserva el código de ETSII como referencia.
// import telegramRouter from './routes/telegramRoutes.mjs';
// import { setBotCommands } from './middleware/botCommands.mjs';
// await setBotCommands();

export function createApp({ env = process.env, sessionStore, authRouter = autorizacionRouter,
  authService = autorizacionService } = {}) {
  const app = express();
  const production = env.NODE_ENV === 'production';
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('Configura SESSION_SECRET con al menos 32 caracteres aleatorios.');
  }
  if (production && (!env.FRONTEND_URL || env.SESSION_STORE === 'memory')) {
    throw new Error('Producción requiere FRONTEND_URL y sesiones persistentes en PostgreSQL.');
  }
  const allowedOrigins = (env.FRONTEND_URL || 'http://localhost:5173').split(',').map(origin => {
    const url = new URL(origin.trim());
    if (!['http:', 'https:'].includes(url.protocol) || (production && url.protocol !== 'https:')) {
      throw new Error('FRONTEND_URL debe contener orígenes HTTP (HTTPS en producción).');
    }
    return url.origin;
  });
  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);
  app.use(cors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST'] }));
  // Las cookies son sameSite=lax. Rechazar además escrituras desde otros orígenes,
  // incluidas peticiones same-site desde subdominios ajenos a esta aplicación.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if ((origin && !allowedOrigins.includes(origin)) || req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ message: 'Origen de la petición no permitido.' });
    }
    // Los clientes sin navegador no envían Origin; los navegadores modernos sí
    // lo envían en POST. SameSite protege las cookies en navegadores antiguos.
    next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  const PgStore = connectPgSimple(session);
  const store = sessionStore || ((env.NODE_ENV === 'test' || env.SESSION_STORE === 'memory')
    ? new session.MemoryStore()
    : new PgStore({ conObject: databaseConfig(env), tableName: 'sesion_web', createTableIfMissing: false }));
  const cookie = { path: '/', secure: production, httpOnly: true, sameSite: 'lax', maxAge: 7200000 };
  app.locals.sessionCookieName = 'feceye.sid';
  app.locals.sessionCookieOptions = { path: '/', secure: production, httpOnly: true, sameSite: 'lax' };
  app.locals.sessionStore = store;
  app.use(session({ name: app.locals.sessionCookieName, store,
    secret: env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', application: 'Permutas FECEYE' }));
  app.use('/api/v1/autorizacion', authRouter);
  // No basta la autorización del navegador: verificar cuentas/roles también en API.
  app.use('/api/v1', async (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Inicia sesión para continuar.' });
    try {
      const user = await authService.verificarSiExisteUsuario(req.session.user.nombre_usuario);
      if (!user || user.id !== req.session.user.id) {
        req.session.destroy(() => {});
        res.clearCookie(app.locals.sessionCookieName, app.locals.sessionCookieOptions);
        return res.status(401).json({ message: 'Sesión expirada o usuario inactivo.' });
      }
      req.session.user = user;
      next();
    } catch (error) { next(error); }
  });
  app.use('/api/v1/usuario', usuarioRouter);
  app.use('/api/v1/estudio', estudioRouter);
  app.use('/api/v1/asignatura', asignaturaRouter);
  app.use('/api/v1/usuarioAsignatura', usuarioAsignaturaRouter);
  app.use('/api/v1/usuarioGrupo', usuarioGrupoRouter);
  app.use('/api/v1/incidencia', incidenciaRouter);
  app.use('/api/v1/grupo', grupoRouter);
  app.use('/api/v1/notificacion', notificacionRouter);
  app.use('/api/v1/solicitudPermuta', solicitudPermutaRouter);
  app.use('/api/v1/permutas', permutaRouter);
  app.use('/api/v1/estadisticas', administradorRouter);
  app.use('/api/v1', uploadRouter);
  // app.use('/api/v1/telegram', telegramRouter);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON no válido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Petición demasiado grande.' });
    console.error('Error interno de la API:', error.code || error.name);
    res.status(500).json({ message: 'Error interno del servidor.' });
  });
  return app;
}

export function startServer() {
  // Los directorios se crean solo al arrancar, no al importar para pruebas.
  for (const [name, folder] of Object.entries({ BUZON: 'buzon', ARCHIVADOR: 'archivador',
    PROYECTO_DOCENTE: 'proyectos-docentes', PLANTILLAS: 'plantillas' })) {
    process.env[name] = path.resolve(process.env[name] || `./storage/${folder}`);
    fs.mkdirSync(process.env[name], { recursive: true });
  }
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  let server;
  if (process.env.SSL_KEY_PATH || process.env.SSL_CERT_PATH) {
    if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) throw new Error('Configura ambos archivos SSL.');
    server = https.createServer({ key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH), passphrase: process.env.SSL_PASSPHRASE }, app);
    server.listen(port, host, () => console.log(`Permutas FECEYE: https://${host}:${port}`));
  } else {
    server = app.listen(port, host, () => console.log(`Permutas FECEYE: http://${host}:${port}`));
  }
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startServer();
