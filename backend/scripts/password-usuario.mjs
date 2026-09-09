import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import database from '../src/config/database.mjs';
import { hashPassword, isValidPassword } from '../src/utils/password.mjs';

const username = process.argv[2]?.trim().toLowerCase();
if (!username || username === '--help') {
  console.log('Uso: npm run password:usuario -- nombre_usuario\nAsigna una contraseña local a una cuenta existente, sin cambiar su rol.');
} else {
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) throw new Error('Nombre de usuario no válido.');
  if (!process.stdin.isTTY) throw new Error('Ejecuta este comando desde una terminal interactiva.');
  // No se aceptan contraseñas en argumentos ni se muestran al escribirlas.
  const hiddenOutput = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const prompt = createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
  let password;
  try {
    process.stdout.write('Nueva contraseña (12–128 caracteres, entrada oculta): ');
    password = await prompt.question('');
    process.stdout.write('\nRepite la contraseña: ');
    const confirmation = await prompt.question('');
    process.stdout.write('\n');
    if (!isValidPassword(password)) throw new Error('La contraseña debe tener entre 12 y 128 caracteres.');
    if (confirmation !== password) throw new Error('Las contraseñas no coinciden.');
  } finally {
    prompt.close();
  }
  const passwordHash = await hashPassword(password);
  password = undefined;
  const client = await database.connectPostgreSQL();
  try {
    await client.query('BEGIN');
    const result = await client.query({
      text: 'UPDATE usuario SET password_hash=$1 WHERE lower(btrim(nombre_usuario))=$2 RETURNING id',
      values: [passwordHash, username],
    });
    if (result.rowCount !== 1) throw new Error('No existe una única cuenta con ese nombre de usuario.');
    await client.query({ text: "DELETE FROM sesion_web WHERE sess->'user'->>'id'=$1", values: [String(result.rows[0].id)] });
    await client.query('COMMIT');
    console.log('Contraseña actualizada y sesiones persistentes cerradas. El rol y el estado de la cuenta no han cambiado.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error.code ? `No se pudo actualizar la contraseña (código ${error.code}).` : error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
