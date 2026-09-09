import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const N = 32768;
const r = 8;
const p = 3;
const keyLength = 64;
const options = { N, r, p, maxmem: 64 * 1024 * 1024 };
const dummyHash = `scrypt$${N}$${r}$${p}$${'00'.repeat(16)}$${'00'.repeat(keyLength)}`;
const hashPattern = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128;
}

export async function hashPassword(password) {
  if (!isValidPassword(password)) throw new TypeError('La contraseña debe tener entre 12 y 128 caracteres.');
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, keyLength, options);
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, passwordHash) {
  if (!isValidPassword(password)) return false;
  const parsed = typeof passwordHash === 'string' ? hashPattern.exec(passwordHash) : null;
  // También derivamos una clave si la cuenta no existe o aún no tiene contraseña local.
  const [, saltHex, keyHex] = parsed || hashPattern.exec(dummyHash);
  const candidate = await deriveKey(password, Buffer.from(saltHex, 'hex'), keyLength, options);
  const matches = timingSafeEqual(candidate, Buffer.from(keyHex, 'hex'));
  return Boolean(parsed) && matches;
}
