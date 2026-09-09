import autorizacionService, { AuthError } from '../services/autorizacionService.mjs';

const authenticationPayload = user => ({ isAuthenticated: true, user: { uvus: user.nombre_usuario, rol: user.rol } });
const sessionCall = (session, method) => new Promise((resolve, reject) => {
  session[method](error => error ? reject(error) : resolve());
});

function clearSessionCookie(req, res) {
  res.clearCookie(req.app.locals.sessionCookieName || 'connect.sid', {
    path: '/',
    ...req.app.locals.sessionCookieOptions,
  });
}

function authFailure(res, error) {
  if (error instanceof AuthError) return res.status(error.status).json({ message: error.message });
  return res.status(500).json({ message: 'No se ha podido completar la operación. Inténtalo de nuevo más tarde.' });
}

async function createSession(req, user) {
  await sessionCall(req.session, 'regenerate');
  req.session.user = user;
  try {
    await sessionCall(req.session, 'save');
  } catch (error) {
    delete req.session.user;
    await sessionCall(req.session, 'destroy').catch(() => {});
    throw error;
  }
}

export function createAutorizacionController(service = autorizacionService) {
  return {
    login: async (req, res) => {
      try {
        const user = await service.login(req.body);
        await createSession(req, user);
        return res.status(200).json(authenticationPayload(user));
      } catch (error) {
        return authFailure(res, error);
      }
    },

    registro: async (req, res) => {
      try {
        const user = await service.registro(req.body);
        await createSession(req, user);
        return res.status(201).json(authenticationPayload(user));
      } catch (error) {
        return authFailure(res, error);
      }
    },

    logout: async (req, res) => {
      try {
        if (req.session) await sessionCall(req.session, 'destroy');
        clearSessionCookie(req, res);
        return res.status(200).json({ isAuthenticated: false });
      } catch (error) {
        return authFailure(res, error);
      }
    },

    obtenerSesion: async (req, res) => {
      try {
        res.set('Cache-Control', 'no-store');
        let user = null;
        if (req.session?.user) user = await service.verificarSiExisteUsuario(req.session.user.nombre_usuario);
        if (!user || user.id !== req.session.user.id) {
          if (req.session?.user) await sessionCall(req.session, 'destroy');
          clearSessionCookie(req, res);
          return res.status(401).json({ isAuthenticated: false, message: 'Sesión expirada o no iniciada.' });
        }
        req.session.user = user;
        return res.status(200).json(authenticationPayload(user));
      } catch (error) {
        return authFailure(res, error);
      }
    },
  };
}

export const { login, registro, logout, obtenerSesion } = createAutorizacionController();
