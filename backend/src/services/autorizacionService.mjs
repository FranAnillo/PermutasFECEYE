import database from "../config/database.mjs";
import { hashPassword, isValidPassword, verifyPassword } from '../utils/password.mjs';

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const credentialMessage = 'Usuario o contraseña incorrectos.';
const validRoles = new Set(['estudiante', 'administrador', 'mantenimiento', 'delegacion']);

function validateCredentials(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AuthError(400, 'Introduce un usuario y una contraseña válidos.');
  }
  if (typeof input.nombre_usuario !== 'string') {
    throw new AuthError(400, 'El nombre de usuario debe tener entre 3 y 50 caracteres.');
  }
  const nombre_usuario = input.nombre_usuario.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,50}$/.test(nombre_usuario)) {
    throw new AuthError(400, 'El usuario debe tener entre 3 y 50 letras, números, puntos, guiones o guiones bajos.');
  }
  if (!isValidPassword(input.password)) {
    throw new AuthError(400, 'La contraseña debe tener entre 12 y 128 caracteres.');
  }
  return { nombre_usuario, password: input.password };
}

function sessionUser(rows) {
  // El resto de la aplicación utiliza un único rol por sesión.
  const roles = new Set(rows.map(row => row.rol));
  if (!rows.length || roles.size !== 1 || !validRoles.has(rows[0].rol)) return null;
  const { id, nombre_completo, nombre_usuario, rol } = rows[0];
  return { id, nombre_completo, nombre_usuario, rol };
}

export class AutorizacionService {
  constructor(db = database) {
    this.database = db;
  }

  async verificarSiExisteUsuario(uvus) {
    const conexion = await this.database.connectPostgreSQL();
    try {
      const result = await conexion.query({
        text: `SELECT u.id, u.nombre_completo, u.nombre_usuario, r.rol
               FROM usuario u JOIN roles r ON u.id = r.usuario_id_fk
               WHERE lower(btrim(u.nombre_usuario)) = $1 AND u.activo = true`,
        values: [uvus.trim().toLowerCase()],
      });
      return sessionUser(result.rows);
    } finally {
      await conexion.end();
    }
  }

  async login(input) {
    const { nombre_usuario, password } = validateCredentials(input);
    const conexion = await this.database.connectPostgreSQL();
    let rows;
    try {
      const result = await conexion.query({
        text: `SELECT u.id, u.nombre_completo, u.nombre_usuario, u.password_hash, u.activo, r.rol
               FROM usuario u LEFT JOIN roles r ON u.id = r.usuario_id_fk
               WHERE lower(btrim(u.nombre_usuario)) = $1`,
        values: [nombre_usuario],
      });
      rows = result.rows;
    } finally {
      await conexion.end();
    }
    const validPassword = await verifyPassword(password, rows[0]?.password_hash);
    const user = sessionUser(rows);
    if (!validPassword || !rows[0]?.activo || !user) throw new AuthError(401, credentialMessage);
    return user;
  }

  async registro(input) {
    const { nombre_usuario, password } = validateCredentials(input);
    if (typeof input.nombre_completo !== 'string' || input.nombre_completo.trim().length < 2 ||
        input.nombre_completo.trim().length > 150 || /[\u0000-\u001f\u007f-\u009f]/.test(input.nombre_completo)) {
      throw new AuthError(400, 'El nombre completo debe tener entre 2 y 150 caracteres.');
    }
    if (typeof input.correo !== 'string' || input.correo.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.correo.trim()) || /[\u0000-\u001f\u007f-\u009f]/.test(input.correo)) {
      throw new AuthError(400, 'Introduce un correo electrónico válido de hasta 254 caracteres.');
    }
    const nombre_completo = input.nombre_completo.trim();
    const correo = input.correo.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    const conexion = await this.database.connectPostgreSQL();
    let transactionStarted = false;
    try {
      await conexion.query('BEGIN');
      transactionStarted = true;
      const result = await conexion.query({
        text: `INSERT INTO usuario (nombre_completo, correo, nombre_usuario, activo, password_hash, chatid, userid)
               VALUES ($1, $2, $3, true, $4, NULL, NULL)
               RETURNING id, nombre_completo, nombre_usuario`,
        values: [nombre_completo, correo, nombre_usuario, passwordHash],
      });
      const user = result.rows[0];
      await conexion.query({
        text: "INSERT INTO roles (usuario_id_fk, rol) VALUES ($1, 'estudiante')",
        values: [user.id],
      });
      await conexion.query('COMMIT');
      transactionStarted = false;
      return { id: user.id, nombre_completo: user.nombre_completo, nombre_usuario: user.nombre_usuario, rol: 'estudiante' };
    } catch (error) {
      if (transactionStarted) await conexion.query('ROLLBACK');
      if (error.code === '23505') throw new AuthError(409, 'El nombre de usuario o el correo ya está registrado.');
      throw error;
    } finally {
      await conexion.end();
    }
  }

  async verificarSiExisteUsuarioEnTelegram(userId,chatId){
    try{
      const conexion = await database.connectPostgreSQL();
      const query = {
        text: ` SELECT u.nombre_usuario
                FROM usuario u
                WHERE u.userId = $1 
                    AND u.chatId = $2`,
        values: [userId, chatId],
      };
      const res = await conexion.query(query);
      await conexion.end();
      if (res.rows.length > 0) {
        return res.rows[0].nombre_usuario;
      } else {
        return null; // No se encontró el usuario
      }
    } catch (error){
      console.error('Error al verificar si existe el usuario en Telegram:', error);
      return { err: true, errmsg: 'Error al verificar si existe el usuario en Telegram' };
    }
  }

    async obtenerChatIdUsuario(uvus){
    try{
      const conexion = await database.connectPostgreSQL();
      const query = {
        text: ` SELECT chatid FROM usuario WHERE nombre_usuario = $1`,
        values: [uvus],
      };
      const res = await conexion.query(query);
      await conexion.end();
      if (res.rows.length > 0) {
        return res.rows[0].chatid;
      } else {
        return null;
      }
    } catch (error){
      console.error('Error al obtener el chatId del usuario:', error);
      return { err: true, errmsg: 'Error al obtener el chatId del usuario' };
    }
  }

  async consultarSolicitudAltaUsuario(uvusEnviado){
    try{
      const conexion = await database.connectPostgreSQL();
      const query = {
        text: ` SELECT uvus, correo, nombre_completo, chat_id, user_id
                FROM alta_usuario_bot 
                WHERE uvus = $1`,
        values: [uvusEnviado],
      };
      const res = await conexion.query(query);
      await conexion.end();
      if (res.rows.length > 0) {
        return res.rows[0];
      } else {
        return 'No existe ningún usuario';
      }
    } catch (error){
      console.error('Error al consultarSolicitudAltaUsuario:', error);
      return { err: true, errmsg: 'Error al consultarSolicitudAltaUsuario' };
    }
  }

  async insertarSolicitudAltaUsuario(uvusEnviado,nombreCompleto,chatId,correo){
    try{
      const conexion = await database.connectPostgreSQL();
      if (correo!=null) correo = `${uvusEnviado}@alum.us.es`;
      const query = {
        text: ` INSERT INTO alta_usuario_bot (uvus, correo, nombre_completo, chat_id, user_id)
                VALUES ($1, $2, $3, $4, $5)`,
        values: [uvusEnviado,correo,nombreCompleto, chatId,chatId],
      };
      await conexion.query(query);
      await conexion.end();
      return 'Se ha insertado la solicitud de alta correctamente';
    } catch (error){
      console.error('Error al insertar la solicitud de alta:', error);
      return { err: true, errmsg: 'Error al insertar la solicitud de alta' };
    }
  }

  async insertarUsuario(uvusEnviado,nombreCompleto,correo,chatId){
    const conexion = await database.connectPostgreSQL();
    try {
      await conexion.query('BEGIN');
      const queryUsuario = {
        text: ` INSERT INTO usuario (nombre_completo, correo, nombre_usuario, activo, chatid, userid)
                VALUES ($1, $2, $3, true, $4, $5)
                RETURNING id`,
        values: [nombreCompleto, correo, uvusEnviado, chatId, chatId],
      };
      const resultado = await conexion.query(queryUsuario);
      const usuarioId = resultado.rows[0].id;
      const queryRol = {
        text: ` INSERT INTO roles (usuario_id_fk,rol)
                VALUES ($1, 'estudiante')`,
        values: [usuarioId],
      };
      await conexion.query(queryRol);
      await conexion.query('COMMIT');
      return 'Se ha insertado el usuario correctamente';
    } catch (error){
      await conexion.query('ROLLBACK');
      console.error('Error al insertar el usuario:', error);
      throw new Error("Error al crear la incidencia");
    } finally {
      await conexion.end();
    }
  }

  async eliminarSolicitudAltaUsuario(uvus){
    try{
      const conexion = await database.connectPostgreSQL();
      const query = {
        text: ` DELETE
                FROM alta_usuario_bot
                WHERE uvus = $1`,
        values: [uvus],
      };
      await conexion.query(query);
      await conexion.end();
      return 'Se ha eliminado el alta de usuario correctamente'
    } catch (error){
      console.error('Error al eliminar el alta de usuario:', error);
      return { err: true, errmsg: 'Error al eliminar el alta de usuario' };
    }
  }

  async obtenerUvusPorChatId(chatId) {
    const conexion = await database.connectPostgreSQL();
    const query = {
      text: `SELECT nombre_usuario FROM usuario WHERE chat_id = $1`,
      values: [chatId],
    };
    const res = await conexion.query(query);
    await conexion.end();
    return res.rows[0]?.nombre_usuario || null;
  }
}
const autorizacionService = new AutorizacionService();
export default autorizacionService;
