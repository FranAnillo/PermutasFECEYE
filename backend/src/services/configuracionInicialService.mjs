import database from '../config/database.mjs';

export class ConfiguracionError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const validId = value => Number.isSafeInteger(value) && value > 0;
export function pasoConfiguracion(usuario, asignaturas) {
  if (!usuario.estudios_id_fk) return 'grado';
  if (!asignaturas.length) return 'asignaturas';
  if (asignaturas.some(a => !a.grupo_id)) return 'grupos';
  return 'completo';
}

export class ConfiguracionInicialService {
  constructor(db = database) { this.db = db; }
  async estadoEnConexion(client, usuarioId, opciones = false) {
    const result = await client.query(`SELECT u.id, u.nombre_completo, u.estudios_id_fk, e.nombre AS titulacion
      FROM usuario u LEFT JOIN estudios e ON e.id=u.estudios_id_fk WHERE u.id=$1`, [usuarioId]);
    const usuario = result.rows[0];
    if (!usuario) throw new ConfiguracionError('Usuario no encontrado.', 401);
    const enrolled = await client.query(`SELECT DISTINCT a.id, a.nombre, a.curso,
      (SELECT min(g.id) FROM usuario_grupo ug JOIN grupo g ON g.id=ug.grupo_id_fk
       WHERE ug.usuario_id_fk=$1 AND g.asignatura_id_fk=a.id) AS grupo_id
      FROM usuario_asignatura ua JOIN asignatura a ON a.id=ua.asignatura_id_fk
      WHERE ua.usuario_id_fk=$1 ORDER BY a.curso, a.nombre, a.id`, [usuarioId]);
    const asignaturas = enrolled.rows;
    const paso = pasoConfiguracion(usuario, asignaturas);
    const estado = { usuario, paso, completo: paso === 'completo', matriculadas: asignaturas };
    if (!opciones) return estado;
    if (paso === 'grado') estado.estudios = (await client.query('SELECT id,nombre FROM estudios ORDER BY nombre')).rows;
    if (paso === 'asignaturas') estado.asignaturas = (await client.query(`SELECT DISTINCT a.id,a.nombre,a.curso
      FROM asignatura a JOIN asignatura_estudios ae ON ae.asignatura_id=a.id
      WHERE ae.estudios_id=$1 ORDER BY a.curso,a.nombre,a.id`, [usuario.estudios_id_fk])).rows;
    if (paso === 'grupos') estado.grupos = (await client.query(`SELECT g.id,g.nombre,g.asignatura_id_fk AS asignatura_id
      FROM grupo g WHERE g.asignatura_id_fk=ANY($1::int[]) ORDER BY g.nombre,g.id`, [asignaturas.map(a => a.id)])).rows;
    return estado;
  }
  async obtener(usuarioId) {
    const client = await this.db.connectPostgreSQL();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const estado = await this.estadoEnConexion(client, usuarioId, true);
      await client.query('COMMIT');
      return estado;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { await client.end(); }
  }
  async guardar(usuarioId, input) {
    if (!input || typeof input !== 'object' || !['grado','asignaturas','grupos'].includes(input.paso)) {
      throw new ConfiguracionError('Paso no válido.');
    }
    const client = await this.db.connectPostgreSQL();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM usuario WHERE id=$1 FOR UPDATE', [usuarioId]);
      const estado = await this.estadoEnConexion(client, usuarioId);
      if (input.paso !== estado.paso) throw new ConfiguracionError('Tu perfil ha cambiado. Recarga el paso para continuar.', 409);
      if (input.paso === 'grado') {
        if (!validId(input.estudio_id)) throw new ConfiguracionError('Selecciona un grado.');
        const exists = await client.query('SELECT id FROM estudios WHERE id=$1', [input.estudio_id]);
        if (!exists.rows.length) throw new ConfiguracionError('El grado seleccionado no existe.');
        await client.query('UPDATE usuario SET estudios_id_fk=$1 WHERE id=$2', [input.estudio_id, usuarioId]);
      } else if (input.paso === 'asignaturas') {
        const ids = input.asignatura_ids;
        if (!Array.isArray(ids) || !ids.length || ids.length > 300 || ids.some(id => !validId(id)) || new Set(ids).size !== ids.length) {
          throw new ConfiguracionError('Selecciona al menos una asignatura válida.');
        }
        const valid = await client.query(`SELECT DISTINCT asignatura_id FROM asignatura_estudios
          WHERE estudios_id=$1 AND asignatura_id=ANY($2::int[])`, [estado.usuario.estudios_id_fk, ids]);
        if (valid.rows.length !== ids.length) throw new ConfiguracionError('Todas las asignaturas deben pertenecer a tu grado.');
        await client.query(`INSERT INTO usuario_asignatura (usuario_id_fk,asignatura_id_fk)
          SELECT $1, unnest($2::int[])`, [usuarioId, ids]);
      } else {
        const grupos = input.grupos;
        if (!Array.isArray(grupos) || grupos.length !== estado.matriculadas.length ||
          grupos.some(g => !g || !validId(g.asignatura_id) || !validId(g.grupo_id)) ||
          new Set(grupos.map(g => g.asignatura_id)).size !== grupos.length ||
          estado.matriculadas.some(a => !grupos.some(g => g.asignatura_id === a.id))) {
          throw new ConfiguracionError('Selecciona un grupo para cada asignatura.');
        }
        const valid = await client.query('SELECT id,asignatura_id_fk FROM grupo WHERE id=ANY($1::int[])', [grupos.map(g => g.grupo_id)]);
        if (grupos.some(g => !valid.rows.some(v => v.id === g.grupo_id && v.asignatura_id_fk === g.asignatura_id))) {
          throw new ConfiguracionError('Un grupo no pertenece a su asignatura.');
        }
        await client.query(`DELETE FROM usuario_grupo WHERE usuario_id_fk=$1 AND grupo_id_fk IN
          (SELECT id FROM grupo WHERE asignatura_id_fk=ANY($2::int[]))`, [usuarioId, grupos.map(g => g.asignatura_id)]);
        await client.query('INSERT INTO usuario_grupo (usuario_id_fk,grupo_id_fk) SELECT $1,unnest($2::int[])', [usuarioId, grupos.map(g => g.grupo_id)]);
      }
      const actualizado = await this.estadoEnConexion(client, usuarioId, true);
      await client.query('COMMIT');
      return actualizado;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { await client.end(); }
  }
}
export default new ConfiguracionInicialService();
