import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import database from '../src/config/database.mjs';
import { crearDocumento, obtenerDocumento, cambiarEstadoDocumento, listarDocumentos } from '../src/services/documentoPermutaService.mjs';
import permutaService from '../src/services/permutaService.mjs';
import express from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { subirDocumento, descargarDocumento } from '../src/middleware/documentoPermutaUpload.mjs';
import controller from '../src/controllers/permutasController.mjs';
import { PDFDocument } from 'pdf-lib';

test('documentos: selección, contrato, permisos, duplicados y transiciones con SQL real', async t => {
  const db = new PGlite();
  const original = database.connectPostgreSQL;
  database.connectPostgreSQL = async () => ({
    query: (sql, values) => typeof sql === 'string' ? db.query(sql, values) : db.query(sql.text, sql.values),
    end: async () => {},
  });
  t.after(async () => { database.connectPostgreSQL = original; await db.close(); });
  await db.exec(`
    CREATE TABLE estudios(id int PRIMARY KEY, nombre text);
    CREATE TABLE usuario(id int PRIMARY KEY, nombre_usuario text, nombre_completo text, correo text, estudios_id_fk int);
    CREATE TABLE asignatura(id int PRIMARY KEY, nombre text, codigo int, curso int);
    CREATE TABLE grupo(id int PRIMARY KEY, nombre int);
    CREATE TABLE permuta(id int PRIMARY KEY, usuario_id_1_fk int, usuario_id_2_fk int,
      asignatura_id_fk int, grupo_id_1_fk int, grupo_id_2_fk int, estado text,
      vigente boolean DEFAULT true, aceptada_1 boolean DEFAULT true, aceptada_2 boolean DEFAULT true);
    CREATE TABLE permutas(id serial PRIMARY KEY, estado text, archivo text, estudiante_cumplimentado_1 text,
      estudiante_cumplimentado_2 text, vigente boolean DEFAULT true);
    CREATE TABLE permutas_permuta(permuta_id_fk int, permutas_id_fk int);
    INSERT INTO estudios VALUES(1,'Economía');
    INSERT INTO usuario VALUES(1,'aaa0000','Arturo','arturo@example.test',1),
      (2,'aaa0001','Danvalreb','dan@example.test',1),(3,'sample','Sample','sample@example.test',1);
    INSERT INTO asignatura VALUES(1,'Matemáticas II',1560018,1),(2,'Economía Pública I',1560055,3),(3,'Finanzas',1560002,2);
    INSERT INTO grupo VALUES(1,1),(2,2);
    INSERT INTO permuta(id,usuario_id_1_fk,usuario_id_2_fk,asignatura_id_fk,grupo_id_1_fk,grupo_id_2_fk,estado)
      VALUES(2,2,1,1,2,1,'VALIDADA'),(5,1,3,2,1,2,'VALIDADA'),(6,1,3,3,1,2,'VALIDADA');
  `);
  for (const ids of [[], [2,2], ['2'], [0], Array.from({length:11},(_,i)=>i+1)]) {
    await assert.rejects(crearDocumento(ids, 'aaa0000'), e => e.status === 400);
  }
  await assert.rejects(crearDocumento([2], 'sample'), e => e.status === 403);
  await assert.rejects(crearDocumento([2], 'aaa0001'), e => e.status === 403);
  await assert.rejects(crearDocumento([2,5], 'aaa0000'), e => e.status === 403);
  await db.query("UPDATE usuario SET correo = NULL WHERE id = 2");
  await assert.rejects(crearDocumento([2], 'aaa0000'), /Faltan datos/);
  assert.equal((await db.query('SELECT * FROM permutas')).rows.length, 0);
  await db.query("UPDATE usuario SET correo = 'dan@example.test' WHERE id = 2");
  const first = await crearDocumento([2], 'aaa0000');
  const second = await crearDocumento([5,6], 'aaa0000');
  assert.notEqual(first.id, second.id);
  assert.deepEqual(await crearDocumento([6,5], 'aaa0000'), { id: second.id, creado: false });
  assert.equal((await db.query('SELECT * FROM permutas')).rows.length, 2);
  await assert.rejects(crearDocumento([5], 'aaa0000'), /Selecciona/);
  const doc = await obtenerDocumento(second.id, 'sample');
  assert.deepEqual(doc.grupo.permutas.map(p => p.permuta_id), [5,6]);
  assert.equal(doc.grupo.usuarios[0].correo, 'arturo@example.test');
  assert.equal(doc.grupo.permutas[0].curso_asignatura, 3);
  assert.equal(doc.puedeEditar, false);
  await assert.rejects(obtenerDocumento(first.id, 'sample'), e => e.status === 403);
  await assert.rejects(listarDocumentos([2], 'sample'), e => e.status === 403);
  await assert.rejects(obtenerDocumento(999, 'aaa0000'), e => e.status === 404);
  const listado = await permutaService.obtenerPermutasAgrupadasPorUsuario('aaa0000');
  const matematicas = listado.find(g => g.permutas[0].permuta_id === 2);
  assert.deepEqual(matematicas.usuarios, ['aaa0000','aaa0001']);
  assert.equal(matematicas.permutas[0].grupo_1, 1);
  assert.equal(matematicas.permutas[0].grupo_2, 2);
  assert.equal(matematicas.permutas[0].documento_id, first.id);
  const pdf = '12345678-1234-1234-1234-123456789abc.pdf';
  await assert.rejects(cambiarEstadoDocumento(first.id, 'aaa0001', 'FIRMADA', pdf), e => e.status === 403);
  await assert.rejects(cambiarEstadoDocumento(first.id, 'aaa0000', 'ACEPTADA', pdf), e => e.status === 409);
  await cambiarEstadoDocumento(first.id, 'aaa0000', 'FIRMADA', pdf);
  assert.equal((await obtenerDocumento(first.id, 'aaa0001')).puedeEditar, true);
  assert.equal((await obtenerDocumento(first.id, 'aaa0000')).puedeEditar, false);
  await assert.rejects(cambiarEstadoDocumento(first.id, 'aaa0000', 'FIRMADA', pdf), e => e.status === 409);
  await assert.rejects(cambiarEstadoDocumento(first.id, 'aaa0000', 'ACEPTADA', pdf), e => e.status === 403);
  await cambiarEstadoDocumento(first.id, 'aaa0001', 'ACEPTADA', pdf);
  // Consultar un documento firmado no exige reconstruir datos académicos actuales.
  await db.query('UPDATE usuario SET correo = NULL WHERE id = 2');
  assert.equal((await obtenerDocumento(first.id, 'aaa0000')).archivo, pdf);
  await assert.rejects(cambiarEstadoDocumento(first.id, 'sample', 'VALIDADA'), e => e.status === 403);
  await cambiarEstadoDocumento(first.id, 'aaa0000', 'VALIDADA');
  await assert.rejects(cambiarEstadoDocumento(first.id, 'aaa0000', 'VALIDADA'), e => e.status === 409);

  await t.test('subida HTTP vinculada al documento, errores de archivo y descarga íntegra', async t => {
    const carpeta = await mkdtemp(path.join(os.tmpdir(), 'fceye-documento-test-'));
    const buzonAnterior = process.env.BUZON;
    process.env.BUZON = carpeta;
    const sesiones = {};
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const uvus = req.get('x-test-user') || 'aaa0000';
      sesiones[uvus] ||= { user: { nombre_usuario: uvus } };
      req.session = sesiones[uvus]; next();
    });
    app.post('/documento/:id', subirDocumento);
    app.get('/documento/:id', descargarDocumento);
    app.post('/firmar', controller.firmarPermuta);
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(async () => {
      await new Promise(resolve => server.close(resolve));
      if (buzonAnterior === undefined) delete process.env.BUZON; else process.env.BUZON = buzonAnterior;
      // Solo la carpeta temporal creada por esta prueba, nunca almacenamiento de la aplicación.
      assert.equal(path.dirname(carpeta), path.resolve(os.tmpdir()));
      assert.ok(path.basename(carpeta).startsWith('fceye-documento-test-'));
      await rm(carpeta, { recursive: true, force: true });
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const bytes = await readFile(new URL('../assets/plantillas/plantillaPermuta2627.pdf', import.meta.url));
    const subir = (contenido, tipo = 'application/pdf', nombre = 'firmado.pdf', user = 'aaa0000') => {
      const body = new FormData(); body.append('file', new Blob([contenido], { type: tipo }), nombre);
      return fetch(`${base}/documento/${second.id}`, { method: 'POST', body, headers: { 'x-test-user': user } });
    };
    assert.equal((await subir(bytes, 'application/pdf', 'firmado.pdf', 'sample')).status, 403);
    assert.equal((await subir(bytes, 'image/png', 'imagen.png')).status, 400);
    assert.equal((await subir('no es un PDF')).status, 400);
    assert.equal((await subir('%PDF-1.7\ncontenido incompleto')).status, 400);
    assert.equal((await subir(Buffer.alloc(10 * 1024 * 1024 + 1))).status, 400);
    const equivocado = await PDFDocument.load(bytes);
    equivocado.setSubject(`Permutas FCEYE: documento ${first.id}`);
    assert.equal((await subir(await equivocado.save())).status, 400);
    const respuesta = await subir(bytes);
    assert.equal(respuesta.status, 200);
    const { fileId } = await respuesta.json();
    const firmar = id => fetch(base + '/firmar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permutaId: id, archivo: fileId }) });
    assert.equal((await firmar(first.id)).status, 400);
    assert.equal((await firmar(second.id)).status, 200);
    assert.equal((await firmar(second.id)).status, 400);
    const descargado = await fetch(`${base}/documento/${second.id}`, { headers: { 'x-test-user': 'sample' } });
    assert.equal(descargado.status, 200);
    assert.deepEqual(Buffer.from(await descargado.arrayBuffer()), bytes);
    assert.equal((await fetch(`${base}/documento/${second.id}`, { headers: { 'x-test-user': 'aaa0001' } })).status, 403);
  });
});
