import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { obtenerDocumento } from '../services/documentoPermutaService.mjs';
import { PDFDocument } from 'pdf-lib';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => {
    const valido = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(valido ? null : Object.assign(new Error('Adjunta únicamente un PDF de hasta 10 MB.'), { status: 400 }), valido);
  },
}).single('file');

export async function subirDocumento(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await obtenerDocumento(id, req.session.user.nombre_usuario);
    if (!doc.puedeEditar) return res.status(403).json({ message: 'No es tu turno para completar el documento.' });
    await new Promise((resolve, reject) => upload(req, res, error => error ? reject(error) : resolve()));
    if (!req.file) return res.status(400).json({ message: 'Adjunta un PDF.' });
    const header = req.file.buffer.subarray(0, 5);
    if (header.toString('ascii') !== '%PDF-') throw Object.assign(new Error('El archivo no es un PDF válido.'), { status: 400 });
    let pdf;
    try {
      pdf = await PDFDocument.load(req.file.buffer, { updateMetadata: false, throwOnInvalidObject: true });
      if (!pdf.getPageCount()) throw new Error('PDF sin páginas');
    } catch {
      throw Object.assign(new Error('El PDF está dañado o protegido. Adjunta un PDF legible sin contraseña.'), { status: 400 });
    }
    const referencia = pdf.getSubject()?.match(/^Permutas FCEYE: documento (\d+)$/);
    if (referencia && Number(referencia[1]) !== id) throw Object.assign(new Error('Este PDF pertenece a otro documento de permuta.'), { status: 400 });
    req.file.filename = `${randomUUID()}.pdf`;
    req.file.path = path.resolve(process.env.BUZON, req.file.filename);
    await fs.writeFile(req.file.path, req.file.buffer, { flag: 'wx' });
    req.session.documentosSubidos ||= {};
    req.session.documentosSubidos[req.file.filename] = id;
    res.json({ fileId: req.file.filename });
  } catch (error) {
    req.resume();
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    res.status(error.status || (error instanceof multer.MulterError ? 400 : 500)).json({
      message: error.status ? error.message : error instanceof multer.MulterError ? 'Adjunta un único PDF de hasta 10 MB.' : 'No se pudo subir el PDF.',
    });
  }
}

export async function descargarDocumento(req, res) {
  try {
    const doc = await obtenerDocumento(Number(req.params.id), req.session.user.nombre_usuario);
    if (!/^[0-9a-f-]{36}\.pdf$/i.test(doc.archivo || '')) return res.status(404).json({ message: 'El documento todavía no tiene un PDF.' });
    res.sendFile(path.resolve(process.env.BUZON, doc.archivo), error => {
      if (error && !res.headersSent) res.status(404).json({ message: 'No se encuentra el PDF del documento.' });
    });
  } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'No se pudo obtener el PDF.' }); }
}
