-- Ejecutar en la misma base de datos FECEYE después de 001_autenticacion_local.sql.
-- Esquema compatible con connect-pg-simple; no modifica datos de usuarios.
BEGIN;
CREATE TABLE IF NOT EXISTS public.sesion_web (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS sesion_web_expire_idx ON public.sesion_web (expire);
COMMIT;
