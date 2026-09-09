import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { ConfiguracionInicialService, pasoConfiguracion } from '../src/services/configuracionInicialService.mjs';
import { exigirPerfilCompleto } from '../src/routes/configuracionInicialRoutes.mjs';

await test('configuración inicial: SQL de grado, asignaturas y grupos en PostgreSQL embebido', async t => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(`
    CREATE TABLE estudios(id integer PRIMARY KEY,nombre text);
    CREATE TABLE usuario(id integer PRIMARY KEY,nombre_completo text,estudios_id_fk integer REFERENCES estudios(id));
    CREATE TABLE asignatura(id integer PRIMARY KEY,nombre text,curso integer,codigo integer);
    CREATE TABLE asignatura_estudios(asignatura_id integer REFERENCES asignatura(id),estudios_id integer REFERENCES estudios(id));
    CREATE TABLE usuario_asignatura(usuario_id_fk integer REFERENCES usuario(id),asignatura_id_fk integer REFERENCES asignatura(id));
    CREATE TABLE grupo(id integer PRIMARY KEY,nombre integer,asignatura_id_fk integer REFERENCES asignatura(id));
    CREATE TABLE usuario_grupo(usuario_id_fk integer REFERENCES usuario(id),grupo_id_fk integer REFERENCES grupo(id));
    INSERT INTO estudios VALUES(1,'Economía'),(2,'ADE');
    INSERT INTO usuario VALUES(1,'Ana',NULL),(2,'Otro usuario',NULL);
    INSERT INTO asignatura VALUES(10,'Matemáticas',1,NULL),(11,'Econometría',2,NULL),(12,'Contabilidad',1,NULL);
    INSERT INTO asignatura_estudios VALUES(10,1),(11,1),(12,2);
    INSERT INTO grupo VALUES(20,1,10),(21,2,11),(22,1,12);
  `);
  const db = { connectPostgreSQL: async () => ({ query: (...args) => pg.query(...args), end: async () => {} }) };
  const service = new ConfiguracionInicialService(db);
  let estado = await service.obtener(1);
  assert.equal(estado.paso,'grado');
  assert.equal(estado.estudios.length,2);
  await assert.rejects(service.guardar(1,{paso:'asignaturas',asignatura_ids:[10]}), e => e.status===409);
  await assert.rejects(service.guardar(1,{paso:'grado',estudio_id:999}), /no existe/);
  await assert.rejects(service.guardar(1,{paso:'grado',estudio_id:'1'}), /Selecciona/);
  estado = await service.guardar(1,{paso:'grado',estudio_id:1});
  assert.equal(estado.paso,'asignaturas');
  assert.deepEqual(estado.asignaturas.map(a=>a.id),[10,11]);
  assert.equal((await service.obtener(2)).paso,'grado');
  await assert.rejects(service.guardar(1,{paso:'grado',estudio_id:2}), e=>e.status===409);
  for (const ids of [[],[10,10],[12],[10,12]]) {
    await assert.rejects(service.guardar(1,{paso:'asignaturas',asignatura_ids:ids}), e=>e.status===400);
    assert.equal((await service.obtener(1)).matriculadas.length,0);
  }
  estado = await service.guardar(1,{paso:'asignaturas',asignatura_ids:[10,11]});
  assert.equal(estado.paso,'grupos');
  assert.equal(estado.matriculadas.length,2);
  assert.equal(estado.grupos.length,2);
  assert.equal((await service.obtener(1)).paso,'grupos'); // Reanuda desde BD.
  await assert.rejects(service.guardar(1,{paso:'grupos',grupos:[{asignatura_id:10,grupo_id:20}]}), /cada asignatura/);
  await assert.rejects(service.guardar(1,{paso:'grupos',grupos:[{asignatura_id:10,grupo_id:21},{asignatura_id:11,grupo_id:20}]}), /no pertenece/);
  await pg.query('INSERT INTO usuario_grupo VALUES(1,20)');
  estado = await service.obtener(1);
  assert.equal(estado.matriculadas[0].grupo_id,20);
  assert.equal(estado.completo,false);
  const selection = {paso:'grupos',grupos:[{asignatura_id:10,grupo_id:20},{asignatura_id:11,grupo_id:21}]};
  const failureService = new ConfiguracionInicialService({ connectPostgreSQL: async () => ({
    query: (sql,params) => { if(sql.startsWith('INSERT INTO usuario_grupo')) throw new Error('Fallo de escritura'); return pg.query(sql,params); },
    end: async () => {},
  }) });
  await assert.rejects(failureService.guardar(1,selection), /Fallo de escritura/);
  assert.equal((await service.obtener(1)).matriculadas[0].grupo_id,20); // DELETE revertido.
  const gate = exigirPerfilCompleto(service);
  let status, payload, passed = false;
  const res = {status: code=>{status=code;return res;},json:data=>{payload=data;}};
  await gate({session:{user:{id:1,rol:'estudiante'}}},res,()=>{passed=true;});
  assert.equal(status,409); assert.equal(payload.code,'PERFIL_INCOMPLETO'); assert.equal(passed,false);
  estado = await service.guardar(1,selection);
  assert.equal(estado.paso,'completo'); assert.equal(estado.completo,true);
  await gate({session:{user:{id:1,rol:'estudiante'}}},res,()=>{passed=true;});
  assert.equal(passed,true);
  passed=false;
  await gate({session:{user:{id:2,rol:'administrador'}}},res,()=>{passed=true;});
  assert.equal(passed,true); // Administración no necesita matrícula.
  await assert.rejects(service.guardar(1,selection),e=>e.status===409); // No duplicados al reenviar.
  assert.equal((await pg.query('SELECT count(*) FROM usuario_grupo WHERE usuario_id_fk=1')).rows[0].count,2);
  await pg.query('DELETE FROM usuario_grupo WHERE usuario_id_fk=1');
  assert.equal((await service.obtener(1)).paso,'grupos');
  await pg.query('DELETE FROM usuario_asignatura WHERE usuario_id_fk=1');
  assert.equal((await service.obtener(1)).paso,'asignaturas');
});

test('un perfil sin asignaturas nunca se considera completo', () => {
  assert.equal(pasoConfiguracion({estudios_id_fk:null},[]),'grado');
  assert.equal(pasoConfiguracion({estudios_id_fk:1},[]),'asignaturas');
  assert.equal(pasoConfiguracion({estudios_id_fk:1},[{grupo_id:null}]),'grupos');
  assert.equal(pasoConfiguracion({estudios_id_fk:1},[{grupo_id:2}]),'completo');
});
