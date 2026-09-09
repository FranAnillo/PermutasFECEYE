import { Router } from 'express';
import { createAutorizacionController } from '../controllers/autorizacionController.mjs';
import { createAuthRateLimit } from '../middleware/authRateLimit.mjs';

export function createAutorizacionRouter({ service, rateLimit = createAuthRateLimit() } = {}) {
  const router = Router();
  const controller = createAutorizacionController(service);
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.post('/login', rateLimit, controller.login);
  router.post('/registro', rateLimit, controller.registro);
  router.post('/logout', controller.logout);
  router.get('/obtenerSesion', controller.obtenerSesion);
  return router;
}

export default createAutorizacionRouter();
