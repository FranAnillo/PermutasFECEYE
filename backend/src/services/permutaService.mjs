import { crearDocumento, listarDocumentos, cambiarEstadoDocumento } from './documentoPermutaService.mjs';
import database from "../config/database.mjs";
import email from '../utils/email.mjs';
import usuarioService from './usuarioService.mjs';
// import { sendMessage } from "./telegramService.mjs"
// import autorizacionService from "./autorizacionService.mjs";
// import { mensajeFirmadaPermutaAlumno1, mensajeFirmadaPermutaAlumno2,mensajeAceptadaPermuta, mensajeValidacionPermuta,mensajeBorradorPermuta } from "../utils/mensajesTelegram.mjs";
class PermutaService {
  async crearListaPermutas(archivo, IdsPermuta) {
    const conexion = await database.connectPostgreSQL();
    try {
      await conexion.query("BEGIN");
      const queryPermutas = {
        text: ` INSERT INTO permutas (estado, archivo ) VALUES ('FIRMADA',$1) 
                RETURNING id`,
        values: [archivo],
      };
      const resultado = await conexion.query(queryPermutas);
      const permutasId = resultado.rows[0].id;
      for (const id of IdsPermuta) {
        const queryPermutas_permuta = {
          text: ` INSERT INTO permutas_permuta (permuta_id_fk, permutas_id_fk) 
                  VALUES ($1, $2)`,
          values: [id, permutasId],
        };
        await conexion.query(queryPermutas_permuta);
      }
      await conexion.query("COMMIT");
      return "Se ha creado la lista de permutas correctamente";
    } catch (error) {
      await conexion.query("ROLLBACK");
      console.error("Error al listar permutas:", error);
      throw new Error("Error al listar permutas");
    } finally {
      await conexion.end();
    }
  }

  async generarBorradorPermutas(ids, uvus) {
    const documento = await crearDocumento(ids, uvus);
    if (documento.creado) {
      try {
        const usuario = await usuarioService.obtenerDatosUsuario(uvus);
        await email.sendEmailToStudentsDocumentoPermuta(usuario, 'Borrador de Permuta Generado', 'plantillaEmailDocumentoPermuta.ejs');
      } catch (error) { console.error('No se pudo notificar el borrador:', error); }
    }
    return documento;
  }
  listarPermutas(ids, uvus) { return listarDocumentos(ids, uvus); }
  firmarPermuta(id, archivo, uvus) { return cambiarEstadoDocumento(id, uvus, 'FIRMADA', archivo); }
  aceptarPermuta(id, archivo, uvus) { return cambiarEstadoDocumento(id, uvus, 'ACEPTADA', archivo); }
  validarPermuta(id, uvus) { return cambiarEstadoDocumento(id, uvus, 'VALIDADA'); }

  async rechazarSolicitudPermuta(uvus, solicitud) {
    const conexion = await database.connectPostgreSQL();
    const update = {
      text: `update permuta set estado = 'RECHAZADA' where id = $1 and usuario_id_1_fk = (select id from usuario where nombre_usuario = $2)`,
      values: [solicitud, uvus],
    };
    await conexion.query(update);
    await conexion.end();
    return "Solicitud de permuta rechazada.";
  }

  async misPermutasPropuestas(uvus) {
    const conexion = await database.connectPostgreSQL();
    try {
      const query = {
        text: `
          SELECT 
            p.id AS permuta_id,
            a.nombre AS nombre_asignatura,
            a.codigo AS codigo_asignatura,
            g1.nombre AS grupo_solicitante,
            g2.nombre AS grupo_solicitado,
            p.estado AS estado
          FROM permuta p
          INNER JOIN asignatura a ON p.asignatura_id_fk = a.id
          INNER JOIN grupo g1 ON p.grupo_id_1_fk = g1.id
          INNER JOIN grupo g2 ON p.grupo_id_2_fk = g2.id
          WHERE p.usuario_id_1_fk = (
            SELECT id FROM usuario WHERE nombre_usuario = $1
          )
          and p.aceptada_2 = true
          AND p.aceptada_1 = false
          AND p.estado = 'ACEPTADA'
          AND p.vigente = true
        `,
        values: [uvus],
      };

      const resultado = await conexion.query(query);
      await conexion.end();
      return resultado.rows;
    } catch (error) {
      console.error("Error al obtener las permutas propuestas:", error);
      throw new Error("Error al obtener las permutas propuestas");
    } finally {
      await conexion.end();
    }
  }

  async misPermutasPropuestasPorMi(uvus) {
    const conexion = await database.connectPostgreSQL();
    try {
      const query = {
        text: `
          SELECT 
            p.id AS permuta_id,
            a.nombre AS nombre_asignatura,
            a.codigo AS codigo_asignatura,
            g1.nombre AS grupo_solicitado,
            g2.nombre AS grupo_solicitante,
            p.estado AS estado
          FROM permuta p
          INNER JOIN asignatura a ON p.asignatura_id_fk = a.id
          INNER JOIN grupo g1 ON p.grupo_id_1_fk = g1.id
          INNER JOIN grupo g2 ON p.grupo_id_2_fk = g2.id
          WHERE p.usuario_id_2_fk = (
            SELECT id FROM usuario WHERE nombre_usuario = $1
          )
          AND p.aceptada_1 = false
          AND p.aceptada_2 = true
          AND p.estado = 'ACEPTADA'
          AND p.vigente = true
        `,
        values: [uvus],
      };

      const resultado = await conexion.query(query);
      await conexion.end();
      return resultado.rows;
    } catch (error) {
      console.error("Error al obtener las permutas propuestas por mí:", error);
      throw new Error("Error al obtener las permutas propuestas por mí");
    } finally {
      await conexion.end();
    }
  }

  async obtenerPermutasValidadasPorUsuario(uvus) {
    const conexion = await database.connectPostgreSQL();
    try {
      const query = {
        text: `
          SELECT 
            p.id AS permuta_id,
            a.nombre AS nombre_asignatura,
            a.codigo AS codigo_asignatura,
            g1.nombre AS grupo_1,
            g2.nombre AS grupo_2,
            p.estado AS estado
          FROM permuta p
          INNER JOIN asignatura a ON p.asignatura_id_fk = a.id
          INNER JOIN grupo g1 ON p.grupo_id_1_fk = g1.id
          INNER JOIN grupo g2 ON p.grupo_id_2_fk = g2.id
          WHERE p.aceptada_1 = true
            AND p.aceptada_2 = true
            AND (p.estado = 'VALIDADA' OR p.estado ='FINALIZADA')
            AND (
              p.usuario_id_1_fk = (SELECT id FROM usuario WHERE nombre_usuario = $1)
              OR p.usuario_id_2_fk = (SELECT id FROM usuario WHERE nombre_usuario = $1)
            )
            AND p.vigente = true
        `,
        values: [uvus],
      };

      const resultado = await conexion.query(query);
      await conexion.end();
      return resultado.rows;
    } catch (error) {
      console.error(
        "Error al obtener las permutas validadas por usuario:",
        error
      );
      throw new Error("Error al obtener las permutas validadas por usuario");
    } finally {
      await conexion.end();
    }
  }

  async obtenerPermutasAgrupadasPorUsuario(uvus) {
    const conexion = await database.connectPostgreSQL();
    try {
      const query = {
        text: `
 SELECT 
      p.id AS permuta_id,
      a.nombre AS nombre_asignatura,
      a.codigo AS codigo_asignatura,
      CASE WHEN u1.nombre_usuario < u2.nombre_usuario THEN g1.nombre ELSE g2.nombre END AS grupo_1,
      CASE WHEN u1.nombre_usuario < u2.nombre_usuario THEN g2.nombre ELSE g1.nombre END AS grupo_2,
      p.estado AS estado,
      LEAST(u1.nombre_usuario, u2.nombre_usuario) AS usuario_primario,
      GREATEST(u1.nombre_usuario, u2.nombre_usuario) AS usuario_secundario,
      d.estado AS estado_permuta_asociada, d.id AS documento_id,
      d.estudiante_cumplimentado_1
    FROM permuta p
    LEFT JOIN (SELECT pp.permuta_id_fk, doc.id, doc.estado, doc.estudiante_cumplimentado_1
      FROM permutas_permuta pp JOIN permutas doc ON doc.id = pp.permutas_id_fk AND doc.vigente = true
    ) d ON d.permuta_id_fk = p.id
    INNER JOIN asignatura a ON p.asignatura_id_fk = a.id
    INNER JOIN grupo g1 ON p.grupo_id_1_fk = g1.id
    INNER JOIN grupo g2 ON p.grupo_id_2_fk = g2.id
    INNER JOIN usuario u1 ON p.usuario_id_1_fk = u1.id
    INNER JOIN usuario u2 ON p.usuario_id_2_fk = u2.id
    WHERE (
      p.usuario_id_1_fk = (SELECT id FROM usuario WHERE nombre_usuario = $1)
      OR p.usuario_id_2_fk = (SELECT id FROM usuario WHERE nombre_usuario = $1)
    )
    AND (p.estado = 'VALIDADA' OR p.estado = 'FINALIZADA')
    AND p.aceptada_1 = true
    AND p.aceptada_2 = true
    AND p.vigente = true
        `,
        values: [uvus],
      };

      const resultado = await conexion.query(query);

      // Agrupar las permutas por usuario_primario y usuario_secundario
      const permutasAgrupadas = resultado.rows.reduce((acc, row) => {
        const key = JSON.stringify([row.usuario_primario, row.usuario_secundario, row.documento_id]);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          permuta_id: row.permuta_id,
          nombre_asignatura: row.nombre_asignatura,
          codigo_asignatura: row.codigo_asignatura,
          grupo_1: row.grupo_1,
          grupo_2: row.grupo_2,
          estado: row.estado,
          estado_permuta_asociada: row.estado_permuta_asociada,
          documento_id: row.documento_id,
          estudiante_cumplimentado_1: row.estudiante_cumplimentado_1,
        });
        return acc;
      }, {});

      // Convertir el objeto agrupado en un array
      return Object.entries(permutasAgrupadas).map(([usuarios, permutas]) => ({
        usuarios: JSON.parse(usuarios).slice(0, 2),
        permutas,
      }));
    } catch (error) {
      console.error(
        "Error al obtener las permutas agrupadas por usuario:",
        error
      );
      throw new Error("Error al obtener las permutas agrupadas por usuario");
    } finally {
      await conexion.end();
    }
  }
async actualizarLaVigenciaPermuta() {
  const conexion = await database.connectPostgreSQL();
  try {
    const updateQuery = {
      text: `UPDATE permuta SET vigente = false WHERE vigente = true`,
    };
    const res = await conexion.query(updateQuery);
    return { updated: res.rowCount };
  } catch (error) {
    console.error("Error al actualizar la vigencia de las permutas:", error);
    throw new Error("Error al actualizar la vigencia de las permutas");
  } finally {
    await conexion.end();
  }
}

async actualizarLaVigenciaPermutas() {
  const conexion = await database.connectPostgreSQL();
  try {
    const updateQuery = {
      text: `UPDATE permutas SET vigente = false WHERE vigente = true`,
    };
    const res = await conexion.query(updateQuery);
    return { updated: res.rowCount };
  } catch (error) {
    console.error("Error al actualizar la vigencia de las permutas agrupadas:", error);
    throw new Error("Error al actualizar la vigencia de las permutas agrupadas");
  } finally {
    await conexion.end();
  }
}

}

const permutaService = new PermutaService();
export default permutaService;
