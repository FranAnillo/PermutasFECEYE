-- Ejecutar en permutas_FECEYE. Solo lectura.
SELECT current_database() AS base_actual, current_user AS usuario;

-- Debe devolver CERO filas: cada fila indica un objeto ausente.
-- Comprueba nombres y pertenencia; no compara tipos ni definiciones completas.
WITH esperados(tipo, tabla, nombre) AS (VALUES
    ('tabla', 'alta_usuario_bot', 'alta_usuario_bot'),
    ('columna', 'alta_usuario_bot', 'id'),
    ('columna', 'alta_usuario_bot', 'uvus'),
    ('columna', 'alta_usuario_bot', 'correo'),
    ('columna', 'alta_usuario_bot', 'nombre_completo'),
    ('columna', 'alta_usuario_bot', 'chat_id'),
    ('columna', 'alta_usuario_bot', 'user_id'),
    ('restriccion', 'alta_usuario_bot', 'alta_usuario_bot_pkey'),
    ('restriccion', 'alta_usuario_bot', 'alta_usuario_bot_uvus_key'),
    ('tabla', 'asignatura', 'asignatura'),
    ('columna', 'asignatura', 'id'),
    ('columna', 'asignatura', 'nombre'),
    ('columna', 'asignatura', 'siglas'),
    ('columna', 'asignatura', 'codigo'),
    ('columna', 'asignatura', 'curso'),
    ('restriccion', 'asignatura', 'asignatura_codigo_key'),
    ('restriccion', 'asignatura', 'asignatura_pkey'),
    ('tabla', 'estudios', 'estudios'),
    ('columna', 'estudios', 'id'),
    ('columna', 'estudios', 'nombre'),
    ('columna', 'estudios', 'siglas'),
    ('restriccion', 'estudios', 'estudios_pkey'),
    ('tabla', 'incidencia', 'incidencia'),
    ('columna', 'incidencia', 'id'),
    ('columna', 'incidencia', 'fecha_creacion'),
    ('columna', 'incidencia', 'descripcion'),
    ('columna', 'incidencia', 'tipo_incidencia'),
    ('columna', 'incidencia', 'estado_incidencia'),
    ('columna', 'incidencia', 'archivo'),
    ('restriccion', 'incidencia', 'incidencia_pkey'),
    ('tabla', 'permutas', 'permutas'),
    ('columna', 'permutas', 'estado'),
    ('columna', 'permutas', 'archivo'),
    ('columna', 'permutas', 'id'),
    ('columna', 'permutas', 'estudiante_cumplimentado_1'),
    ('columna', 'permutas', 'estudiante_cumplimentado_2'),
    ('columna', 'permutas', 'vigente'),
    ('restriccion', 'permutas', 'permutas_pk'),
    ('tabla', 'plazos_permutas', 'plazos_permutas'),
    ('columna', 'plazos_permutas', 'inicio_primer_periodo'),
    ('columna', 'plazos_permutas', 'final_primer_periodo'),
    ('columna', 'plazos_permutas', 'inicio_segundo_periodo'),
    ('columna', 'plazos_permutas', 'final_segundo_periodo'),
    ('tabla', 'pregunta_valoracion_asignatura', 'pregunta_valoracion_asignatura'),
    ('columna', 'pregunta_valoracion_asignatura', 'id'),
    ('columna', 'pregunta_valoracion_asignatura', 'codigo'),
    ('columna', 'pregunta_valoracion_asignatura', 'bloque'),
    ('columna', 'pregunta_valoracion_asignatura', 'bloque_nombre'),
    ('columna', 'pregunta_valoracion_asignatura', 'enunciado'),
    ('columna', 'pregunta_valoracion_asignatura', 'tipo_respuesta'),
    ('columna', 'pregunta_valoracion_asignatura', 'condicion'),
    ('columna', 'pregunta_valoracion_asignatura', 'orden'),
    ('columna', 'pregunta_valoracion_asignatura', 'activa'),
    ('restriccion', 'pregunta_valoracion_asignatura', 'pregunta_valoracion_asignatura_codigo_key'),
    ('restriccion', 'pregunta_valoracion_asignatura', 'pregunta_valoracion_asignatura_orden_key'),
    ('restriccion', 'pregunta_valoracion_asignatura', 'pregunta_valoracion_asignatura_pkey'),
    ('restriccion', 'pregunta_valoracion_asignatura', 'pregunta_valoracion_asignatura_tipo_respuesta_check'),
    ('tabla', 'asignatura_estudios', 'asignatura_estudios'),
    ('columna', 'asignatura_estudios', 'asignatura_id'),
    ('columna', 'asignatura_estudios', 'estudios_id'),
    ('restriccion', 'asignatura_estudios', 'asignatura_estudios_fk1'),
    ('restriccion', 'asignatura_estudios', 'asignatura_estudios_fk2'),
    ('tabla', 'grupo', 'grupo'),
    ('columna', 'grupo', 'id'),
    ('columna', 'grupo', 'nombre'),
    ('columna', 'grupo', 'limite_estudiantes'),
    ('columna', 'grupo', 'tipo_grupo'),
    ('columna', 'grupo', 'proyecto_docente'),
    ('columna', 'grupo', 'asignatura_id_fk'),
    ('columna', 'grupo', 'habilitado'),
    ('restriccion', 'grupo', 'grupo_pkey'),
    ('restriccion', 'grupo', 'grupo_fk1'),
    ('tabla', 'usuario', 'usuario'),
    ('columna', 'usuario', 'id'),
    ('columna', 'usuario', 'nombre_completo'),
    ('columna', 'usuario', 'correo'),
    ('columna', 'usuario', 'nombre_usuario'),
    ('columna', 'usuario', 'activo'),
    ('columna', 'usuario', 'estudios_id_fk'),
    ('columna', 'usuario', 'userid'),
    ('columna', 'usuario', 'chatid'),
    ('restriccion', 'usuario', 'unique_userid_chatid'),
    ('restriccion', 'usuario', 'usuario_correo_key'),
    ('restriccion', 'usuario', 'usuario_pkey'),
    ('restriccion', 'usuario', 'fk_usuario_estudios'),
    ('tabla', 'usuario_asignatura', 'usuario_asignatura'),
    ('columna', 'usuario_asignatura', 'usuario_id_fk'),
    ('columna', 'usuario_asignatura', 'asignatura_id_fk'),
    ('restriccion', 'usuario_asignatura', 'usuario_asignatura_fk1'),
    ('restriccion', 'usuario_asignatura', 'usuario_asignatura_fk2'),
    ('tabla', 'usuario_grupo', 'usuario_grupo'),
    ('columna', 'usuario_grupo', 'usuario_id_fk'),
    ('columna', 'usuario_grupo', 'grupo_id_fk'),
    ('restriccion', 'usuario_grupo', 'usuario_grupo_fk1'),
    ('restriccion', 'usuario_grupo', 'usuario_grupo_fk2'),
    ('tabla', 'feedback_sistema', 'feedback_sistema'),
    ('columna', 'feedback_sistema', 'id_feedback'),
    ('columna', 'feedback_sistema', 'usuario_id_fk'),
    ('columna', 'feedback_sistema', 'rol'),
    ('columna', 'feedback_sistema', 'satisfaccion_general'),
    ('columna', 'feedback_sistema', 'facilidad_uso'),
    ('columna', 'feedback_sistema', 'recomendacion'),
    ('columna', 'feedback_sistema', 'tipo_aporte'),
    ('columna', 'feedback_sistema', 'comentario'),
    ('columna', 'feedback_sistema', 'solicita_seguimiento'),
    ('columna', 'feedback_sistema', 'estado'),
    ('columna', 'feedback_sistema', 'respuesta_administracion'),
    ('columna', 'feedback_sistema', 'fecha_creacion'),
    ('columna', 'feedback_sistema', 'fecha_actualizacion'),
    ('columna', 'feedback_sistema', 'actualizado_por_usuario_id_fk'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_estado_check'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_facilidad_uso_check'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_pkey'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_recomendacion_check'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_satisfaccion_general_check'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_tipo_aporte_check'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_actualizado_por_usuario_id_fk_fkey'),
    ('restriccion', 'feedback_sistema', 'feedback_sistema_usuario_id_fk_fkey'),
    ('tabla', 'historial_feedback_sistema', 'historial_feedback_sistema'),
    ('columna', 'historial_feedback_sistema', 'id'),
    ('columna', 'historial_feedback_sistema', 'feedback_id_fk'),
    ('columna', 'historial_feedback_sistema', 'estado_anterior'),
    ('columna', 'historial_feedback_sistema', 'estado_nuevo'),
    ('columna', 'historial_feedback_sistema', 'respuesta_administracion'),
    ('columna', 'historial_feedback_sistema', 'administrador_usuario_id_fk'),
    ('columna', 'historial_feedback_sistema', 'fecha_cambio'),
    ('restriccion', 'historial_feedback_sistema', 'historial_feedback_sistema_pkey'),
    ('restriccion', 'historial_feedback_sistema', 'historial_feedback_sistema_administrador_usuario_id_fk_fkey'),
    ('restriccion', 'historial_feedback_sistema', 'historial_feedback_sistema_feedback_id_fk_fkey'),
    ('tabla', 'incidencia_usuario', 'incidencia_usuario'),
    ('columna', 'incidencia_usuario', 'id'),
    ('columna', 'incidencia_usuario', 'usuario_id_fk'),
    ('columna', 'incidencia_usuario', 'usuario_id_mantenimiento_fk'),
    ('restriccion', 'incidencia_usuario', 'incidencia_usuario_pkey'),
    ('restriccion', 'incidencia_usuario', 'incidencia_usuario_fk1'),
    ('restriccion', 'incidencia_usuario', 'incidencia_usuario_fk2'),
    ('tabla', 'notificacion', 'notificacion'),
    ('columna', 'notificacion', 'id'),
    ('columna', 'notificacion', 'usuario_id_fk'),
    ('columna', 'notificacion', 'fecha_creacion'),
    ('columna', 'notificacion', 'contenido'),
    ('columna', 'notificacion', 'receptor'),
    ('columna', 'notificacion', 'fecha_expiracion'),
    ('restriccion', 'notificacion', 'notificacion_pkey'),
    ('restriccion', 'notificacion', 'notificacion_fk1'),
    ('tabla', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura'),
    ('columna', 'respuesta_valoracion_asignatura', 'id'),
    ('columna', 'respuesta_valoracion_asignatura', 'usuario_id_fk'),
    ('columna', 'respuesta_valoracion_asignatura', 'asignatura_id_fk'),
    ('columna', 'respuesta_valoracion_asignatura', 'pregunta_id_fk'),
    ('columna', 'respuesta_valoracion_asignatura', 'respuesta_boolean'),
    ('columna', 'respuesta_valoracion_asignatura', 'respuesta_numero'),
    ('columna', 'respuesta_valoracion_asignatura', 'respuesta_texto'),
    ('columna', 'respuesta_valoracion_asignatura', 'fecha_respuesta'),
    ('columna', 'respuesta_valoracion_asignatura', 'grupo_id_fk'),
    ('columna', 'respuesta_valoracion_asignatura', 'curso_academico'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_contenido_chk'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_curso_chk'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_numero_chk'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_pkey'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_unica_curso'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_asignatura_id_fk_fkey'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_grupo_id_fk_fkey'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_pregunta_id_fk_fkey'),
    ('restriccion', 'respuesta_valoracion_asignatura', 'respuesta_valoracion_asignatura_usuario_id_fk_fkey'),
    ('tabla', 'roles', 'roles'),
    ('columna', 'roles', 'id'),
    ('columna', 'roles', 'usuario_id_fk'),
    ('columna', 'roles', 'rol'),
    ('restriccion', 'roles', 'roles_pkey'),
    ('restriccion', 'roles', 'roles_fk1'),
    ('tabla', 'solicitud_permuta', 'solicitud_permuta'),
    ('columna', 'solicitud_permuta', 'id'),
    ('columna', 'solicitud_permuta', 'estado'),
    ('columna', 'solicitud_permuta', 'usuario_id_fk'),
    ('columna', 'solicitud_permuta', 'grupo_solicitante_id_fk'),
    ('columna', 'solicitud_permuta', 'id_asignatura_fk'),
    ('columna', 'solicitud_permuta', 'vigente'),
    ('restriccion', 'solicitud_permuta', 'solicitud_permuta_pkey'),
    ('restriccion', 'solicitud_permuta', 'grupo_fk1'),
    ('restriccion', 'solicitud_permuta', 'grupo_fk2'),
    ('tabla', 'grupo_deseado', 'grupo_deseado'),
    ('columna', 'grupo_deseado', 'id'),
    ('columna', 'grupo_deseado', 'solicitud_permuta_id_fk'),
    ('columna', 'grupo_deseado', 'grupo_id_fk'),
    ('restriccion', 'grupo_deseado', 'grupo_deseado_pkey'),
    ('restriccion', 'grupo_deseado', 'grupo_deseado_fk1'),
    ('restriccion', 'grupo_deseado', 'grupo_deseado_fk2'),
    ('tabla', 'permuta', 'permuta'),
    ('columna', 'permuta', 'id'),
    ('columna', 'permuta', 'usuario_id_1_fk'),
    ('columna', 'permuta', 'usuario_id_2_fk'),
    ('columna', 'permuta', 'asignatura_id_fk'),
    ('columna', 'permuta', 'grupo_id_1_fk'),
    ('columna', 'permuta', 'grupo_id_2_fk'),
    ('columna', 'permuta', 'estado'),
    ('columna', 'permuta', 'aceptada_1'),
    ('columna', 'permuta', 'aceptada_2'),
    ('columna', 'permuta', 'solicitud_permuta_id_fk'),
    ('columna', 'permuta', 'vigente'),
    ('restriccion', 'permuta', 'permuta_pkey'),
    ('restriccion', 'permuta', 'permuta_fk1'),
    ('restriccion', 'permuta', 'permuta_fk2'),
    ('restriccion', 'permuta', 'permuta_fk3'),
    ('restriccion', 'permuta', 'permuta_fk4'),
    ('restriccion', 'permuta', 'permuta_fk5'),
    ('restriccion', 'permuta', 'permuta_solicitud_permuta_fk'),
    ('tabla', 'permutas_permuta', 'permutas_permuta'),
    ('columna', 'permutas_permuta', 'permutas_id_fk'),
    ('columna', 'permutas_permuta', 'permuta_id_fk'),
    ('restriccion', 'permutas_permuta', 'permuta_id_fk'),
    ('restriccion', 'permutas_permuta', 'permutas_id_fk'),
    ('indice', 'grupo', 'idx_grupo_asignatura_habilitado'),
    ('indice', 'feedback_sistema', 'idx_feedback_sistema_estado_fecha'),
    ('indice', 'feedback_sistema', 'idx_feedback_sistema_usuario_fecha'),
    ('indice', 'historial_feedback_sistema', 'idx_historial_feedback_sistema_feedback'),
    ('indice', 'respuesta_valoracion_asignatura', 'idx_respuesta_valoracion_asignatura_asignatura'),
    ('indice', 'respuesta_valoracion_asignatura', 'idx_respuesta_valoracion_asignatura_fecha'),
    ('indice', 'respuesta_valoracion_asignatura', 'idx_respuesta_valoracion_asignatura_grupo_curso'),
    ('indice', 'respuesta_valoracion_asignatura', 'idx_respuesta_valoracion_asignatura_pregunta'),
    ('indice', 'grupo_deseado', 'uq_grupo_deseado_solicitud_grupo')
), existentes AS (
 SELECT 'tabla'::text tipo, c.relname::text tabla, c.relname::text nombre
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
 UNION ALL
 SELECT 'columna', c.relname, a.attname
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'restriccion', c.relname, k.conname
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
 UNION ALL
 SELECT 'indice', tablename, indexname FROM pg_indexes WHERE schemaname='public'
)
SELECT * FROM esperados EXCEPT SELECT * FROM existentes ORDER BY 1,2,3;

-- Recuento EXACTO de registros: todas las tablas deben tener 0.
SELECT 'alta_usuario_bot' AS tabla, count(*) AS registros FROM public.alta_usuario_bot
UNION ALL
SELECT 'asignatura' AS tabla, count(*) AS registros FROM public.asignatura
UNION ALL
SELECT 'estudios' AS tabla, count(*) AS registros FROM public.estudios
UNION ALL
SELECT 'incidencia' AS tabla, count(*) AS registros FROM public.incidencia
UNION ALL
SELECT 'permutas' AS tabla, count(*) AS registros FROM public.permutas
UNION ALL
SELECT 'plazos_permutas' AS tabla, count(*) AS registros FROM public.plazos_permutas
UNION ALL
SELECT 'pregunta_valoracion_asignatura' AS tabla, count(*) AS registros FROM public.pregunta_valoracion_asignatura
UNION ALL
SELECT 'asignatura_estudios' AS tabla, count(*) AS registros FROM public.asignatura_estudios
UNION ALL
SELECT 'grupo' AS tabla, count(*) AS registros FROM public.grupo
UNION ALL
SELECT 'usuario' AS tabla, count(*) AS registros FROM public.usuario
UNION ALL
SELECT 'usuario_asignatura' AS tabla, count(*) AS registros FROM public.usuario_asignatura
UNION ALL
SELECT 'usuario_grupo' AS tabla, count(*) AS registros FROM public.usuario_grupo
UNION ALL
SELECT 'feedback_sistema' AS tabla, count(*) AS registros FROM public.feedback_sistema
UNION ALL
SELECT 'historial_feedback_sistema' AS tabla, count(*) AS registros FROM public.historial_feedback_sistema
UNION ALL
SELECT 'incidencia_usuario' AS tabla, count(*) AS registros FROM public.incidencia_usuario
UNION ALL
SELECT 'notificacion' AS tabla, count(*) AS registros FROM public.notificacion
UNION ALL
SELECT 'respuesta_valoracion_asignatura' AS tabla, count(*) AS registros FROM public.respuesta_valoracion_asignatura
UNION ALL
SELECT 'roles' AS tabla, count(*) AS registros FROM public.roles
UNION ALL
SELECT 'solicitud_permuta' AS tabla, count(*) AS registros FROM public.solicitud_permuta
UNION ALL
SELECT 'grupo_deseado' AS tabla, count(*) AS registros FROM public.grupo_deseado
UNION ALL
SELECT 'permuta' AS tabla, count(*) AS registros FROM public.permuta
UNION ALL
SELECT 'permutas_permuta' AS tabla, count(*) AS registros FROM public.permutas_permuta
ORDER BY tabla;
