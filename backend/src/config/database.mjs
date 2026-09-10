import pg from "pg";

export const databaseConfig = (env = process.env) => ({
  user: env.DB_USER || undefined,
  password: env.DB_PASS || env.DB_PASSWORD || undefined,
  host: env.DB_HOST || 'localhost',
  port: Number(env.DB_PORT || 5432),
  database: env.DB_DATABASE || env.DB_NAME || 'permutas_FCEYE',
  connectionTimeoutMillis: 5000,
});

class Database {
    async connectPostgreSQL() {
    const { Client } = pg;
    const client = new Client(databaseConfig());
    await client.connect();
    return client;
  }
}
const database = new Database();
export default database;
