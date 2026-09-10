-- Migración FCEYE: ejecutar con un usuario autorizado en la base de FCEYE,
-- antes de iniciar la aplicación. No modifica contraseñas ni cuentas existentes.
-- Las cuentas heredadas necesitan una contraseña local provisionada por
-- administración; el registro no puede apropiarse de ellas.
BEGIN;

-- Evita escrituras entre la comprobación de duplicados y la creación de índices.
LOCK TABLE public.usuario IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim(nombre_usuario)) FROM public.usuario
    WHERE nombre_usuario IS NOT NULL
    GROUP BY lower(btrim(nombre_usuario)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay nombres de usuario duplicados ignorando mayúsculas y espacios. Revise los datos antes de repetir la migración.';
  END IF;
  IF EXISTS (
    SELECT lower(btrim(correo)) FROM public.usuario
    WHERE correo IS NOT NULL
    GROUP BY lower(btrim(correo)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay correos duplicados ignorando mayúsculas y espacios. Revise los datos antes de repetir la migración.';
  END IF;
END $$;

ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS password_hash text;
-- Conserva valores heredados y evita que límites varchar de ETSII recorten los
-- campos que valida la API local (150/254/50 caracteres respectivamente).
ALTER TABLE public.usuario ALTER COLUMN nombre_completo TYPE text;
ALTER TABLE public.usuario ALTER COLUMN correo TYPE text;
ALTER TABLE public.usuario ALTER COLUMN nombre_usuario TYPE text;
ALTER TABLE public.usuario ALTER COLUMN chatid DROP NOT NULL;
ALTER TABLE public.usuario ALTER COLUMN userid DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_nombre_usuario_local_unique
  ON public.usuario (lower(btrim(nombre_usuario)));
CREATE UNIQUE INDEX IF NOT EXISTS usuario_correo_local_unique
  ON public.usuario (lower(btrim(correo)));

COMMIT;
