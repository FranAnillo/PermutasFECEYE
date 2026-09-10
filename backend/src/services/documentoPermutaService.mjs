import database from '../config/database.mjs';

const fallo = (message, status = 409) => Object.assign(new Error(message), { status });
const comprobarIds = ids => {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 10 ||
      ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) {
    throw fallo('Selecciona entre 1 y 10 permutas distintas.', 400);
  }
};

const filasSQL = `SELECT p.id AS permuta_id, u1.nombre_usuario AS usuario_1_uvus,
  u2.nombre_usuario AS usuario_2_uvus, u1.nombre_completo AS nombre_1,
  u2.nombre_completo AS nombre_2, u1.correo AS correo_1, u2.correo AS correo_2,
  e1.nombre AS estudio_1, e2.nombre AS estudio_2, a.nombre AS nombre_asignatura,
  a.codigo AS codigo_asignatura, a.curso AS curso_asignatura,
  g1.nombre AS usuario_1_grupo, g2.nombre AS usuario_2_grupo,
  p.estado, p.vigente, p.aceptada_1, p.aceptada_2
  FROM permuta p JOIN usuario u1 ON u1.id = p.usuario_id_1_fk
  JOIN usuario u2 ON u2.id = p.usuario_id_2_fk
  LEFT JOIN estudios e1 ON e1.id = u1.estudios_id_fk LEFT JOIN estudios e2 ON e2.id = u2.estudios_id_fk
  LEFT JOIN asignatura a ON a.id = p.asignatura_id_fk
  LEFT JOIN grupo g1 ON g1.id = p.grupo_id_1_fk LEFT JOIN grupo g2 ON g2.id = p.grupo_id_2_fk`;

function participantes(rows, uvus) {
  const pareja = rows[0] && [rows[0].usuario_1_uvus, rows[0].usuario_2_uvus].sort();
  if (!pareja || pareja[0] === pareja[1] || !pareja.includes(uvus) ||
      rows.some(row => [row.usuario_1_uvus, row.usuario_2_uvus].sort().join('\0') !== pareja.join('\0'))) {
    throw fallo('No tienes acceso a este documento.', 403);
  }
  return pareja;
}

function grupo(rows, primero) {
  const row = rows[0];
  const numeros = row.usuario_1_uvus === primero ? [1, 2] : [2, 1];
  return {
    usuarios: numeros.map(n => ({ uvus: row[`usuario_${n}_uvus`], nombre_completo: row[`nombre_${n}`],
      correo: row[`correo_${n}`], estudio: row[`estudio_${n}`] })),
    permutas: rows.map(({ permuta_id, nombre_asignatura, codigo_asignatura, curso_asignatura,
      usuario_1_uvus, usuario_2_uvus, usuario_1_grupo, usuario_2_grupo }) => ({ permuta_id,
      nombre_asignatura, codigo_asignatura, curso_asignatura, usuario_1_uvus, usuario_2_uvus,
      usuario_1_grupo, usuario_2_grupo })),
  };
}

async function leer(conexion, id, uvus, lock = false) {
  if (!Number.isSafeInteger(id) || id < 1) throw fallo('Documento no válido.', 400);
  const { rows: docs } = await conexion.query(`SELECT id, estado, archivo, estudiante_cumplimentado_1,
    estudiante_cumplimentado_2 FROM permutas WHERE id = $1 AND vigente = true${lock ? ' FOR UPDATE' : ''}`, [id]);
  const doc = docs[0];
  if (!doc) throw fallo('No se encuentra el documento.', 404);
  const { rows } = await conexion.query(`${filasSQL} WHERE p.id IN
    (SELECT permuta_id_fk FROM permutas_permuta WHERE permutas_id_fk = $1) ORDER BY p.id`, [id]);
  const pareja = participantes(rows, uvus);
  if (!pareja.includes(doc.estudiante_cumplimentado_1)) throw fallo('El documento no tiene un primer firmante válido.');
  if (!['BORRADOR', 'FIRMADA', 'ACEPTADA', 'VALIDADA'].includes(doc.estado)) throw fallo('Estado de documento no válido.');
  return { ...doc, grupo: grupo(rows, doc.estudiante_cumplimentado_1),
    puedeEditar: (doc.estado === 'BORRADOR' && uvus === doc.estudiante_cumplimentado_1) ||
      (doc.estado === 'FIRMADA' && uvus !== doc.estudiante_cumplimentado_1),
    puedeValidar: doc.estado === 'ACEPTADA' };
}

export async function obtenerDocumento(id, uvus) {
  const conexion = await database.connectPostgreSQL();
  try { return await leer(conexion, id, uvus); } finally { await conexion.end(); }
}

export async function crearDocumento(ids, uvus) {
  comprobarIds(ids);
  const conexion = await database.connectPostgreSQL();
  try {
    await conexion.query('BEGIN');
    // Orden estable y bloqueo de las permutas: dos clics simultáneos no crean dos documentos.
    await conexion.query('SELECT id FROM permuta WHERE id = ANY($1) ORDER BY id FOR UPDATE', [ids]);
    const { rows } = await conexion.query(`${filasSQL} WHERE p.id = ANY($1) ORDER BY p.id`, [ids]);
    if (rows.length !== ids.length) throw fallo('Alguna permuta ya no está disponible.');
    const pareja = participantes(rows, uvus);
    if (uvus !== pareja[0]) throw fallo('El primer estudiante debe iniciar el documento.', 403);
    if (rows.some(row => !row.vigente || !row.aceptada_1 || !row.aceptada_2 || !['VALIDADA', 'FINALIZADA'].includes(row.estado))) {
      throw fallo('Todas las permutas deben estar aceptadas y vigentes.');
    }
    const { rows: existentes } = await conexion.query(`SELECT DISTINCT d.id FROM permutas d
      JOIN permutas_permuta pp ON pp.permutas_id_fk = d.id WHERE d.vigente = true AND pp.permuta_id_fk = ANY($1)`, [ids]);
    if (existentes.length) {
      if (existentes.length !== 1) throw fallo('La selección pertenece a varios documentos.');
      const doc = await leer(conexion, existentes[0].id, uvus);
      if (doc.grupo.permutas.length !== ids.length || doc.grupo.permutas.some(p => !ids.includes(p.permuta_id))) {
        throw fallo('Selecciona las permutas del documento existente.');
      }
      await conexion.query('COMMIT');
      return { id: doc.id, creado: false };
    }
    if (rows.some(row => !row.correo_1?.trim() || !row.correo_2?.trim() || !row.estudio_1?.trim() ||
        !row.estudio_2?.trim() || !row.nombre_asignatura?.trim() || row.curso_asignatura == null ||
        row.usuario_1_grupo == null || row.usuario_2_grupo == null || String(row.usuario_1_grupo) === String(row.usuario_2_grupo))) {
      throw fallo('Faltan datos académicos o de contacto para preparar el documento. Actualiza los perfiles y grupos.');
    }
    const { rows: creados } = await conexion.query("INSERT INTO permutas (estado, estudiante_cumplimentado_1) VALUES ('BORRADOR', $1) RETURNING id", [uvus]);
    const id = creados[0].id;
    for (const permutaId of ids) {
      await conexion.query('INSERT INTO permutas_permuta (permuta_id_fk, permutas_id_fk) VALUES ($1, $2)', [permutaId, id]);
    }
    await conexion.query("UPDATE permuta SET estado = 'FINALIZADA' WHERE id = ANY($1)", [ids]);
    await conexion.query('COMMIT');
    return { id, creado: true };
  } catch (error) { await conexion.query('ROLLBACK'); throw error; }
  finally { await conexion.end(); }
}

export async function cambiarEstadoDocumento(id, uvus, siguiente, archivo) {
  const conexion = await database.connectPostgreSQL();
  try {
    await conexion.query('BEGIN');
    const doc = await leer(conexion, id, uvus, true);
    const esperado = { FIRMADA: 'BORRADOR', ACEPTADA: 'FIRMADA', VALIDADA: 'ACEPTADA' }[siguiente];
    if (!esperado || doc.estado !== esperado) throw fallo('El documento ha cambiado de estado. Actualiza la página.');
    if (siguiente === 'VALIDADA' ? !doc.puedeValidar : !doc.puedeEditar) throw fallo('No es tu turno para completar el documento.', 403);
    if (siguiente !== 'VALIDADA' && !/^[0-9a-f-]{36}\.pdf$/i.test(archivo || '')) throw fallo('Adjunta un PDF válido.', 400);
    if (siguiente === 'VALIDADA') {
      await conexion.query("UPDATE permutas SET estado = 'VALIDADA' WHERE id = $1", [id]);
    } else {
      await conexion.query(`UPDATE permutas SET estado = $2, archivo = $3,
        estudiante_cumplimentado_2 = CASE WHEN $2 = 'ACEPTADA' THEN $4 ELSE estudiante_cumplimentado_2 END WHERE id = $1`, [id, siguiente, archivo, uvus]);
    }
    await conexion.query('COMMIT');
    return { id, estado: siguiente };
  } catch (error) { await conexion.query('ROLLBACK'); throw error; }
  finally { await conexion.end(); }
}

export async function listarDocumentos(ids, uvus) {
  comprobarIds(ids);
  const conexion = await database.connectPostgreSQL();
  try {
    const { rows } = await conexion.query(`SELECT DISTINCT d.id FROM permutas d JOIN permutas_permuta pp
      ON pp.permutas_id_fk = d.id WHERE d.vigente = true AND pp.permuta_id_fk = ANY($1) ORDER BY d.id`, [ids]);
    const docs = [];
    for (const row of rows) docs.push(await leer(conexion, row.id, uvus));
    return docs;
  } finally { await conexion.end(); }
}
