import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import GenericValidators from "../utils/genericValidators.mjs";
import database from '../config/database.mjs';

const bundledTemplatesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/plantillas"
);

const subirArchivo = (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(401)
        .json({ err: true, message: "No hay usuario en la sesión" });
    }
    if (!req.file) {
      return res.status(400).send("No se ha subido ningún archivo");
    }
    if (!GenericValidators.isString(req.file.filename, 50)) {
      return res
        .status(400)
        .send("Nombre de archivo no válido (debe ser PDF o PNG)");
    }
    return res.status(200).json({
      message: "Archivo subido correctamente",
      fileId: req.file.filename,
    });
  } catch (error) {
    console.error("Error al subir el archivo:", error);
    return res.status(500).send("Error interno del servidor");
  }
};

const servirArchivo = async (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(401)
        .json({ err: true, message: "No hay usuario en la sesión" });
    }
    const { tipo, fileId } = req.params;
    if (tipo === 'buzon') {
      const conexion = await database.connectPostgreSQL();
      try {
        const { rows } = await conexion.query(`SELECT d.id FROM permutas d
          JOIN permutas_permuta pp ON pp.permutas_id_fk = d.id JOIN permuta p ON p.id = pp.permuta_id_fk
          JOIN usuario u ON u.id IN (p.usuario_id_1_fk, p.usuario_id_2_fk)
          WHERE d.archivo = $1 AND d.vigente = true AND u.nombre_usuario = $2 LIMIT 1`, [fileId, req.session.user.nombre_usuario]);
        if (!rows.length) return res.status(403).json({ message: 'No tienes acceso a este documento.' });
      } finally { await conexion.end(); }
    }
    if (tipo !== "archivador" && tipo !== "buzon") {
      return res
        .status(400)
        .send("Tipo de carpeta no válido (debe ser 'archivador' o 'buzon')");
    }
    let baseDir =
      tipo === "archivador" ? process.env.ARCHIVADOR : process.env.BUZON;

    if (!GenericValidators.isString(fileId, 50)) {
      return res
        .status(400)
        .send("Nombre de archivo no válido (debe ser PDF o PNG)");
    }
    const ext = path.extname(fileId).toLowerCase();
    if (ext !== ".pdf" && ext !== ".png") {
      return res.status(400).send("Solo se permiten archivos PDF o PNG");
    }

    const filePath = path.join(baseDir, fileId);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("No se ha encontrado el archivo:", err);
        res.status(404).send("Archivo no encontrado");
      }
    });
  } catch (error) {
    console.error("Error al servir el archivo:", error);
    return res.status(500).send("Error interno del servidor");
  }
};
const obtenerPlantillaPermuta = (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(401)
        .json({ err: true, message: "No hay usuario en la sesión" });
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    let startYear, endYear;
    if (month >= 8) { // September or later
      startYear = year;
      endYear = year + 1;
    } else {
      startYear = year - 1;
      endYear = year;
    }

    const startYY = startYear.toString().slice(-2);
    const endYY = endYear.toString().slice(-2);

    const filename = `plantillaPermuta${startYY}${endYY}.pdf`;
    const uploadedPath = process.env.PLANTILLAS
      ? path.resolve(process.env.PLANTILLAS, filename)
      : "";
    const bundledPath = path.join(bundledTemplatesDir, filename);
    const pdfPath = uploadedPath && fs.existsSync(uploadedPath)
      ? uploadedPath
      : bundledPath;
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error("No se ha encontrado el archivo:", err);
        res.status(404).send("Archivo no encontrado");
      }
    });
  } catch (error) {
    console.error("Error al servir el archivo:", error);
    return res.status(500).send("Error interno del servidor");
  }
};

export default {
  subirArchivo,
  servirArchivo,
  obtenerPlantillaPermuta,
};
