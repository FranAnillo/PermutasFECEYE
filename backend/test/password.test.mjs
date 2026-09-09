import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, isValidPassword } from '../src/utils/password.mjs';

test('scrypt usa sales distintas y conserva los espacios de la contraseña', async () => {
  const password = '  una contraseña segura  ';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(first.startsWith('scrypt$32768$8$3$'));
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password.trim(), first), false);
  assert.equal(await verifyPassword('otra contraseña', first), false);
});

test('contraseñas heredadas o hashes corruptos no permiten autenticarse', async () => {
  for (const hash of [null, undefined, '', 'plaintext', 'scrypt$999999999$8$3$00$00', {}]) {
    assert.equal(await verifyPassword('una contraseña segura', hash), false);
  }
});

test('longitudes y tipos se comprueban antes de derivar la contraseña', async () => {
  for (const password of [null, undefined, {}, [], 123, 'x'.repeat(11), 'x'.repeat(129)]) {
    assert.equal(isValidPassword(password), false);
    await assert.rejects(hashPassword(password), TypeError);
    assert.equal(await verifyPassword(password, null), false);
  }
  assert.equal(isValidPassword('x'.repeat(12)), true);
  assert.equal(isValidPassword('x'.repeat(128)), true);
});
