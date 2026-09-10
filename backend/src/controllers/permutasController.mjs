import { obtenerDocumento, listarDocumentos, cambiarEstadoDocumento } from '../services/documentoPermutaService.mjs';
import permutaService from "../services/permutaService.mjs";
import GenericValidators from "../utils/genericValidators.mjs";

const responder = operacion => async (req, res) => {
  try {
    const result = await operacion(req);
    res.json({ err: false, result });
  } catch (error) {
    if (!error.status) console.error(error);
    res.status(error.status || 500).json({ err: true, message: error.status ? error.message : 'No se pudo completar la operación.' });
  }
};
const generarBorradorPermutas = responder(req => permutaService.generarBorradorPermutas(req.body.IdsPermuta, req.session.user.nombre_usuario));
const listarPermutas = responder(req => listarDocumentos(req.body.IdsPermuta, req.session.user.nombre_usuario));
const obtenerDocumentoPermuta = responder(req => obtenerDocumento(req.body.permutaId, req.session.user.nombre_usuario));
const transicion = estado => responder(async req => {
  const { permutaId, archivo } = req.body;
  if (estado !== 'VALIDADA' && req.session.documentosSubidos?.[archivo] !== permutaId) {
    throw Object.assign(new Error('Sube el PDF desde este documento antes de enviarlo.'), { status: 400 });
  }
  const result = await cambiarEstadoDocumento(permutaId, req.session.user.nombre_usuario, estado, archivo);
  if (archivo) delete req.session.documentosSubidos[archivo];
  return result;
});
const firmarPermuta = transicion('FIRMADA');
const aceptarPermuta = transicion('ACEPTADA');
const validarPermuta = transicion('VALIDADA');

const rechazarSolicitudPermuta = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
        }
        const uvus = req.session.user.nombre_usuario;
        const validId = GenericValidators.isInteger(req.body.solicitud, "SolicitudId");
        if (!validId.valido) {
            return res.status(400).json({ err: true, message: validId.mensaje });
        }
        const solicitud = validId.valor;
        res.send({ err: false, result: await permutaService.rechazarSolicitudPermuta(uvus, solicitud) });
    } catch (err) {
        console.error('api rechazarSolicitudPermuta ha tenido una excepción:', err);
        res.status(500).json({ err: true, message: 'Error interno en rechazarSolicitudPermuta', details: err.message });
    }
};


const misPermutasPropuestas = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
        }
        const uvus = req.session.user.nombre_usuario;
        res.status(200).json({ err: false, result: await permutaService.misPermutasPropuestas(uvus) });
    } catch (err) {
        console.error('api misPermutasPropuestas ha tenido una excepción:', err);
        res.status(500).json({ err: true, message: 'Error interno en misPermutasPropuestas', details: err.message });
    }
};

const misPermutasPropuestasPorMi = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
        }
        const uvus = req.session.user.nombre_usuario;
        res.status(200).json({ err: false, result: await permutaService.misPermutasPropuestasPorMi(uvus) });
    } catch (err) {
        console.error('api misPermutasPropuestasPorMi ha tenido una excepción:', err);
        res.status(500).json({ err: true, message: 'Error interno en misPermutasPropuestasPorMi', details: err.message });
    }
};

const obtenerPermutasValidadasPorUsuario = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
    }
    const uvus = req.session.user.nombre_usuario;
    res.status(200).json({ err: false, result: await permutaService.obtenerPermutasValidadasPorUsuario(uvus)});
  } catch (err) {
    console.error("api obtenerPermutasValidadasPorUsuario ha tenido una excepción:", err);
    res.status(500).json({ err: true, message: "Error interno en obtenerPermutasValidadasPorUsuario", details: err.message});
  }
};

const obtenerPermutasAgrupadasPorUsuario = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
    }
    const uvus = req.session.user.nombre_usuario;
    res.status(200).json({ err: false, result: await permutaService.obtenerPermutasAgrupadasPorUsuario(uvus)});
  } catch (err) {
    console.error("api obtenerPermutasAgrupadasPorUsuario ha tenido una excepción:", err);
    res.status(500).json({ err: true, message: "Error interno en obtenerPermutasAgrupadasPorUsuario", details: err.message });
  }
};

const actualizarVigenciaPermutas = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ err: true, message: "No hay usuario en la sesión" });
        }
        const uvus = req.session.user.nombre_usuario;
        res.status(200).json({ err: false, result: await permutaService.actualizarLaVigenciaPermuta() });
        res.status(200).json({ err: false, result: await permutaService.actualizarLaVigenciaPermutas() });
    } catch (err) {
    console.error("api actualizarVigenciaPermutasYSolicitudes ha tenido una excepción:", err);
    res.status(500).json({ err: true, message: "Error interno en actualizarVigenciaPermutasYSolicitudes", details: err.message });
  }
};

export default {
    obtenerDocumentoPermuta,
    listarPermutas,
    aceptarPermuta,
    rechazarSolicitudPermuta,
    misPermutasPropuestas,
    misPermutasPropuestasPorMi,
    obtenerPermutasValidadasPorUsuario,
    obtenerPermutasAgrupadasPorUsuario,
    generarBorradorPermutas,
    firmarPermuta,
    validarPermuta,
    actualizarVigenciaPermutas
}
