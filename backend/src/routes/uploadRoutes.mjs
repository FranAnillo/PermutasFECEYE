import { subirDocumento, descargarDocumento } from '../middleware/documentoPermutaUpload.mjs';
import { Router } from 'express';
import upload from '../middleware/almacenamiento.mjs';
import uploadController from '../controllers/uploadController.mjs';

const router = Router()
router
.post('/documentoPermuta/:id/archivo', subirDocumento)
.get('/documentoPermuta/:id/archivo', descargarDocumento)
.post('/upload',upload.single('file'),uploadController.subirArchivo)
.get('/uploads/:tipo/:fileId',uploadController.servirArchivo)
.get('/plantillaPermuta',uploadController.obtenerPlantillaPermuta)

export default router
