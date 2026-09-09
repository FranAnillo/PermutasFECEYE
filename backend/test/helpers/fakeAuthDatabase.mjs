// Doble de PostgreSQL: aplica unicidad, transacciones y serialización de escrituras.
// Las pruebas no se conectan a una base de datos real ni validan el dialecto SQL.
export class FakeAuthDatabase {
  users = [];
  roles = [];
  connections = [];
  nextId = 1;
  writeLock = Promise.resolve();
  failRoleInsert = false;

  async connectPostgreSQL() {
    const db = this;
    let pending;
    let release;
    const connection = {
      closed: false,
      commands: [],
      async query(query) {
        const text = typeof query === 'string' ? query : query.text;
        const values = typeof query === 'string' ? [] : query.values;
        const sql = text.replace(/\s+/g, ' ').trim();
        connection.commands.push(sql);
        if (sql === 'BEGIN') {
          const previous = db.writeLock;
          db.writeLock = new Promise(resolve => { release = resolve; });
          await previous;
          pending = { users: structuredClone(db.users), roles: structuredClone(db.roles) };
          return { rows: [] };
        }
        if (sql === 'COMMIT') {
          db.users = pending.users;
          db.roles = pending.roles;
          pending = undefined;
          release();
          return { rows: [] };
        }
        if (sql === 'ROLLBACK') {
          pending = undefined;
          release();
          return { rows: [] };
        }
        if (sql.startsWith('INSERT INTO usuario ')) {
          const [nombre_completo, correo, nombre_usuario, password_hash] = values;
          const canonical = value => value.trim().toLowerCase();
          if (pending.users.some(user => canonical(user.correo) === canonical(correo) || canonical(user.nombre_usuario) === canonical(nombre_usuario))) {
            throw Object.assign(new Error('secret database constraint details'), { code: '23505' });
          }
          const user = { id: db.nextId++, nombre_completo, correo, nombre_usuario, password_hash, activo: true, chatid: null, userid: null };
          pending.users.push(user);
          return { rows: [{ id: user.id, nombre_completo, nombre_usuario }] };
        }
        if (sql.startsWith('INSERT INTO roles ')) {
          if (db.failRoleInsert) throw new Error('secret database role failure');
          if (!sql.includes("'estudiante'")) throw new Error('Unexpected registration role');
          pending.roles.push({ usuario_id_fk: values[0], rol: 'estudiante' });
          return { rows: [] };
        }
        if (sql.startsWith('SELECT u.id,')) {
          const rows = db.users.filter(user => user.nombre_usuario.trim().toLowerCase() === values[0] && (!sql.includes('u.activo = true') || user.activo))
            .flatMap(user => {
              const roles = db.roles.filter(role => role.usuario_id_fk === user.id);
              if (!roles.length && sql.includes('LEFT JOIN')) return [{ ...user, rol: null }];
              return roles.map(role => ({ ...user, rol: role.rol }));
            });
          return { rows };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      },
      async end() { connection.closed = true; },
    };
    db.connections.push(connection);
    return connection;
  }
}
