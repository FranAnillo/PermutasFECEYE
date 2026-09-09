import { Router } from 'express';
import service, { ConfiguracionError } from '../services/configuracionInicialService.mjs';
import { verificarRol } from '../middleware/rolMiddleware.mjs';
export function createConfiguracionRouter(config = service) {
  const router = Router();
  router.use(verificarRol('estudiante'));
  const handler = fn => async (req,res,next) => {
    try { res.json(await fn(req)); }
    catch (error) {
      if (error instanceof ConfiguracionError) return res.status(error.status).json({ message: error.message });
      next(error);
    }
  };
  router.get('/', handler(req => config.obtener(req.session.user.id)));
  router.post('/', handler(req => config.guardar(req.session.user.id, req.body)));
  return router;
}
export function exigirPerfilCompleto(config = service) {
  return async (req,res,next) => {
    if (req.session.user.rol !== 'estudiante') return next();
    try {
      const estado = await config.obtener(req.session.user.id);
      if (!estado.completo) return res.status(409).json({ code: 'PERFIL_INCOMPLETO', paso: estado.paso,
        message: 'Completa tu grado, asignaturas y grupos en Mi perfil antes de gestionar permutas.' });
      next();
    } catch (error) { next(error); }
  };
}
export default createConfiguracionRouter();
