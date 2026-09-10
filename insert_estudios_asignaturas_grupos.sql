-- Fuente: Plantilla permutas filtrada (2).xlsx, hojas Grados y Asignaturas.
-- 4 estudios, 170 asignaturas, 170 relaciones y 556 grupos.
-- Cada fila de Asignaturas se mantiene independiente dentro de su estudio.
-- No se importan usuarios. No se asignan códigos inexistentes en el Excel.
-- Ejecutar como script COMPLETO en permutas_FCEYE.
-- Importación inicial: se exige que las cuatro tablas estén vacías.
-- Grupos numerados de 1 a N, con límite de 100 estudiantes.
-- Se amplía asignatura.nombre a varchar(120), conservando el nombre completo.
-- Si ocurre un error, ejecutar ROLLBACK; antes de volver a intentarlo.
BEGIN;
SET LOCAL standard_conforming_strings = on;
LOCK TABLE public.estudios, public.asignatura, public.asignatura_estudios,
           public.grupo IN EXCLUSIVE MODE;

CREATE TEMP TABLE carga_config(limite_estudiantes integer) ON COMMIT DROP;
INSERT INTO carga_config VALUES (100);

CREATE TEMP TABLE carga_estudios(nombre text, siglas text) ON COMMIT DROP;
INSERT INTO carga_estudios(nombre, siglas) VALUES
('Grado en Administración y Dirección de Empresas', 'ADE'),
('Grado en Economía', 'ECO'),
('Grado en Marketing e Investigación de Mercados', 'MIM'),
('Doble Grado en Administración y Dirección de Empresas y Derecho', 'ADE-DER');

CREATE TEMP TABLE carga_asignaturas(
    fila_excel integer, nombre text, siglas text, curso text,
    numero_grupos integer, estudio_siglas text
) ON COMMIT DROP;
INSERT INTO carga_asignaturas VALUES
(2, 'Estadística', 'E', '1', 10, 'ADE'),
(3, 'Finanzas', 'F', '1', 10, 'ADE'),
(4, 'Fundamentos de Contabilidad', 'FC', '1', 10, 'ADE'),
(5, 'Historia Económica', 'HE', '1', 10, 'ADE'),
(6, 'Instituciones Básicas de Derecho Privado', 'IBDP', '1', 9, 'ADE'),
(7, 'Introducción a la Economía', 'IE', '1', 10, 'ADE'),
(8, 'Introducción a la Economía de la Empresa (Organización)', 'IEE', '1', 10, 'ADE'),
(9, 'Introducción al Marketing', 'IM', '1', 10, 'ADE'),
(10, 'Matemáticas I', 'M', '1', 10, 'ADE'),
(11, 'Microeconomía', 'M', '1', 10, 'ADE'),
(12, 'Administración de Empresas', 'AE', '2', 7, 'ADE'),
(13, 'Derecho Mercantil', 'DM', '2', 7, 'ADE'),
(14, 'Economía Mundial y Española I', 'EME', '2', 7, 'ADE'),
(15, 'Estadística Avanzada', 'EA', '2', 8, 'ADE'),
(16, 'Estados Contables', 'EC', '2', 8, 'ADE'),
(17, 'Macroeconomía', 'M', '2', 8, 'ADE'),
(18, 'Matemáticas II', 'M', '2', 8, 'ADE'),
(19, 'Organización de Empresas II', 'OE', '2', 7, 'ADE'),
(20, 'Sector Público', 'SP', '2', 8, 'ADE'),
(21, 'Sistemas de Costes e Información Económica', 'SCIE', '2', 8, 'ADE'),
(22, 'Contabilidad para Directivos de Empresa', 'CDE', '3', 7, 'ADE'),
(23, 'Derecho del Trabajo', 'DT', '3', 6, 'ADE'),
(24, 'Dirección Comercial', 'DC', '3', 6, 'ADE'),
(25, 'Dirección de Recursos Humanos I', 'DRH', '3', 6, 'ADE'),
(26, 'Dirección Financiera', 'DF', '3', 8, 'ADE'),
(27, 'Dirección Táctico-Operativa de Operaciones', 'DTOO', '3', 6, 'ADE'),
(28, 'Econometría para la Empresa', 'EE', '3', 7, 'ADE'),
(29, 'Economía Mundial y Española II', 'EME', '3', 7, 'ADE'),
(30, 'Gestión Empresarial Informatizada', 'GEI', '3', 8, 'ADE'),
(31, 'Matemáticas Financieras', 'MF', '3', 8, 'ADE'),
(32, 'Análisis Financiero', 'AF', '4', 1, 'ADE'),
(33, 'Auditoría', 'A', '4', 3, 'ADE'),
(34, 'Control de Gestión', 'CG', '4', 1, 'ADE'),
(35, 'Creación de Empresas', 'CE', '4', 5, 'ADE'),
(36, 'Dirección de RR.HH. II', 'DRH', '4', 2, 'ADE'),
(37, 'Dirección Estratégica', 'DE', '4', 5, 'ADE'),
(38, 'Dirección Estratégica de Operaciones', 'DEO', '4', 1, 'ADE'),
(39, 'Diseño de Negocio Electrónico', 'DNE', '4', 1, 'ADE'),
(40, 'Distribución Comercial', 'DC', '4', 3, 'ADE'),
(41, 'Estrategia e Innovación', 'EI', '4', 2, 'ADE'),
(42, 'Gestión de la Calidad', 'GC', '4', 2, 'ADE'),
(43, 'Habilidades Directivas', 'HD', '4', 1, 'ADE'),
(44, 'Investigación Comercial', 'IC', '4', 6, 'ADE'),
(45, 'Marketing de Servicios', 'MS', '4', 2, 'ADE'),
(46, 'Plan de Empresa', 'PE', '4', 1, 'ADE'),
(47, 'Régimen Fiscal de la Empresa', 'RFE', '4', 5, 'ADE'),
(48, 'Estadística', 'E', '1', 4, 'ECO'),
(49, 'Finanzas', 'F', '1', 4, 'ECO'),
(50, 'Fundamentos de Contabilidad', 'FC', '1', 4, 'ECO'),
(51, 'Historia Económica', 'HE', '1', 4, 'ECO'),
(52, 'Instituciones Básicas de Derecho Privado', 'IBDP', '1', 3, 'ECO'),
(53, 'Introducción a la Economía', 'IE', '1', 3, 'ECO'),
(54, 'Introducción a la Economía de la Empresa', 'IEE', '1', 4, 'ECO'),
(55, 'Introducción al Marketing', 'IM', '1', 4, 'ECO'),
(56, 'Matemáticas I', 'MA', '1', 4, 'ECO'),
(57, 'Microeconomía I', 'MI', '1', 4, 'ECO'),
(58, 'Derecho Administrativo', 'DA', '2', 3, 'ECO'),
(59, 'Economía de la Unión Europea', 'EUE', '2', 3, 'ECO'),
(60, 'Economía Mundial', 'EM', '2', 3, 'ECO'),
(61, 'Estadística Avanzada', 'EA', '2', 3, 'ECO'),
(62, 'Historia Económica II', 'HE', '2', 3, 'ECO'),
(63, 'Macroeconomía I', 'MAC', '2', 3, 'ECO'),
(64, 'Macroeconomía II', 'M', '2', 3, 'ECO'),
(65, 'Matemáticas II', 'MAT', '2', 3, 'ECO'),
(66, 'Microeconomía II', 'MIC', '2', 3, 'ECO'),
(67, 'Programación Matemática', 'PM', '2', 3, 'ECO'),
(68, 'Derecho del Trabajo', 'DT', '3', 3, 'ECO'),
(69, 'Economía Española', 'EE', '3', 3, 'ECO'),
(70, 'Economía Internacional', 'EI', '3', 3, 'ECO'),
(71, 'Introducción a la Econometría', 'IE', '3', 3, 'ECO'),
(72, 'Macroeconomía III', 'M', '3', 3, 'ECO'),
(73, 'Métodos Avanzados de Econometría', 'MAE', '3', 3, 'ECO'),
(74, 'Microeconomía III', 'M', '3', 3, 'ECO'),
(75, 'Política Económica', 'PE', '3', 3, 'ECO'),
(76, 'Economía Pública I', 'EP', '3', 3, 'ECO'),
(77, 'Economía Pública II', 'EP', '3', 3, 'ECO'),
(78, 'Creación de Empresas', 'CE', '4', 2, 'ECO'),
(79, 'Cuentas Económicas y Fuentes Estadísticas para el Análisis Económico Aplicado', 'CEFE', '4', 1, 'ECO'),
(80, 'Derecho Tributario', 'DT', '4', 2, 'ECO'),
(81, 'Economía y Política del Medio Ambiente. Técnicas Multivariantes Aplicadas a la Gestión del Medio Ambiente', 'EPMA', '4', 1, 'ECO'),
(82, 'Estudios Aplicados de Sectores Económicos y Estructuras de Mercados', 'EASE', '4', 1, 'ECO'),
(83, 'Fiscalidad Internacional', 'FI', '4', 1, 'ECO'),
(84, 'Historia del Pensamiento Económico', 'HPE', '4', 3, 'ECO'),
(85, 'Historia Económica de Andalucía Contemporánea', 'HEAC', '4', 1, 'ECO'),
(86, 'Macroeconomía IV', 'MIV', '4', 3, 'ECO'),
(87, 'Matemáticas de las Operaciones Financieras', 'MOF', '4', 1, 'ECO'),
(88, 'Modelos Dinámicos Económicos', 'MDE', '4', 1, 'ECO'),
(89, 'Organización Económica Internacional', 'OEI', '4', 1, 'ECO'),
(90, 'Política Económica Territorial', 'PET', '4', 1, 'ECO'),
(91, 'Banca y Mercados Financieros Internacionales', 'BMFI', '4', 1, 'ECO'),
(92, 'Econometría Aplicada con Herramientas Informáticas', 'EAHI', '4', 1, 'ECO'),
(93, 'Métodos de Decisión y Teoría de Juegos', 'MDTJ', '4', 1, 'ECO'),
(94, 'Economía Pública III. Federalismo Fiscal y Sector Público en Situaciones de Crisis', 'EPIII', '4', 1, 'ECO'),
(95, 'Economía de la Energía y de los Recursos Naturales', 'EERN', '4', 1, 'ECO'),
(96, 'Estadística', 'E', '1', 3, 'MIM'),
(97, 'Finanzas', 'F', '1', 3, 'MIM'),
(98, 'Fundamentos de Contabilidad', 'FC', '1', 3, 'MIM'),
(99, 'Historia Económica', 'HE', '1', 3, 'MIM'),
(100, 'Introducción a la Economía', 'IE', '1', 3, 'MIM'),
(101, 'Introducción a la Economía de la Empresa (Organización)', 'IEE', '1', 3, 'MIM'),
(102, 'Introducción al Derecho Empresarial', 'IDE', '1', 3, 'MIM'),
(103, 'Introducción al Marketing', 'IM', '1', 3, 'MIM'),
(104, 'Matemáticas', 'MA', '1', 3, 'MIM'),
(105, 'Microeconomía', 'MI', '1', 3, 'MIM'),
(106, 'Administración de Empresas', 'AE', '2', 2, 'MIM'),
(107, 'Contabilidad para la Dirección Comercial', 'CDC', '2', 2, 'MIM'),
(108, 'Dirección Estratégica', 'DE', '2', 2, 'MIM'),
(109, 'Economía Internacional', 'EI', '2', 2, 'MIM'),
(110, 'Estadística Avanzada', 'EA', '2', 2, 'MIM'),
(111, 'Investigación de Mercados I', 'IM', '2', 2, 'MIM'),
(112, 'Macroeconomía', 'M', '2', 2, 'MIM'),
(113, 'Técnicas Cuantitativas', 'TC', '2', 2, 'MIM'),
(114, 'Técnicas de Muestreo', 'TM', '2', 2, 'MIM'),
(115, 'Teoría de Precios', 'TP', '2', 2, 'MIM'),
(116, 'Dirección Comercial', 'DIRC', '3', 2, 'MIM'),
(117, 'Dirección de Ventas I', 'DV', '3', 2, 'MIM'),
(118, 'Dirección de Ventas II', 'DV', '3', 2, 'MIM'),
(119, 'Distribución Comercial I', 'DC', '3', 2, 'MIM'),
(120, 'Distribución Comercial II', 'DC', '3', 2, 'MIM'),
(121, 'Gestión Informatizada del Subsistema Comercial', 'GISC', '3', 2, 'MIM'),
(122, 'Investigación de Mercados II', 'IM', '3', 2, 'MIM'),
(123, 'Investigación de Mercados III', 'IM', '3', 2, 'MIM'),
(124, 'Comunicación Comercial', 'CC', '3', 2, 'MIM'),
(125, 'Análisis Económico de los Mercados', 'AEM', '4', 1, 'MIM'),
(126, 'Comportamiento del Consumidor', 'CC', '4', 2, 'MIM'),
(127, 'Creación de Empresas', 'CE', '4', 2, 'MIM'),
(128, 'Gestión de Franquicias', 'GF', '4', 1, 'MIM'),
(129, 'Gestión de Marcas y Nuevos Productos', 'GMNP', '4', 1, 'MIM'),
(130, 'Marketing de Servicios', 'MS', '4', 2, 'MIM'),
(131, 'Marketing Industrial', 'MIND', '4', 1, 'MIM'),
(132, 'Marketing Internacional', 'MI', '4', 1, 'MIM'),
(133, 'Marketing y Ética en los Negocios', 'MYEN', '4', 1, 'MIM'),
(134, 'Merchandising', 'M', '4', 1, 'MIM'),
(135, 'Planificación y Gestión de Precios', 'PGP', '4', 1, 'MIM'),
(136, 'Régimen Jurídico del Mercado', 'RJM', '4', 2, 'MIM'),
(137, 'Comunicación Digital', 'CD', '4', 1, 'MIM'),
(138, 'Diseño de Negocios Electrónicos', 'DNE', '4', 1, 'MIM'),
(139, 'Investigación Cualitativa y Análisis Big Data en Entornos Comerciales', 'ICBD', '4', 1, 'MIM'),
(140, 'Marketing Online', 'MO', '4', 1, 'MIM'),
(141, 'Técnicas Multivariantes en Investigación de Mercados', 'TM', '4', 1, 'MIM'),
(142, 'Fundamentos de la Contabilidad', 'FC', '1', 2, 'ADE-DER'),
(143, 'Historia Económica', 'HE', '1', 2, 'ADE-DER'),
(144, 'Introducción a la Economía', 'IE', '1', 2, 'ADE-DER'),
(145, 'Introducción a la Economía de la Empresa (Organización)', 'IEE', '1', 2, 'ADE-DER'),
(146, 'Introducción al Marketing', 'IM', '1', 2, 'ADE-DER'),
(147, 'Matemáticas I', 'M', '1', 2, 'ADE-DER'),
(148, 'Microeconomía', 'M', '1', 2, 'ADE-DER'),
(149, 'Administración de Empresas', 'AE', '2', 2, 'ADE-DER'),
(150, 'Estadística', 'E', '2', 2, 'ADE-DER'),
(151, 'Estadística Avanzada', 'EA', '2', 2, 'ADE-DER'),
(152, 'Finanzas', 'F', '2', 2, 'ADE-DER'),
(153, 'Matemáticas II', 'M', '2', 2, 'ADE-DER'),
(154, 'Organización de Empresas II', 'OE', '2', 2, 'ADE-DER'),
(155, 'Dirección de Recursos Humanos I', 'DRH', '3', 2, 'ADE-DER'),
(156, 'Economía Mundial y Española I', 'EME', '3', 2, 'ADE-DER'),
(157, 'Economía Mundial y Española II', 'EME', '3', 2, 'ADE-DER'),
(158, 'Estados Contables', 'EC', '3', 2, 'ADE-DER'),
(159, 'Macroeconomía', 'M', '3', 2, 'ADE-DER'),
(160, 'Sector Público', 'SP', '3', 2, 'ADE-DER'),
(161, 'Sistemas de Costes e Información Económica', 'SCIE', '3', 2, 'ADE-DER'),
(162, 'Contabilidad para Directivos de Empresas', 'CDE', '4', 2, 'ADE-DER'),
(163, 'Dirección Comercial', 'DC', '4', 2, 'ADE-DER'),
(164, 'Dirección Financiera', 'DF', '4', 2, 'ADE-DER'),
(165, 'Dirección Táctico-Operativa de Operaciones', 'DTO', '4', 2, 'ADE-DER'),
(166, 'Econometría para la Empresa', 'EE', '4', 2, 'ADE-DER'),
(167, 'Gestión Empresarial Informatizada', 'GEI', '4', 2, 'ADE-DER'),
(168, 'Matemáticas Financieras', 'MF', '4', 2, 'ADE-DER'),
(169, 'Creación de Empresas', 'CE', '5', 2, 'ADE-DER'),
(170, 'Dirección Estratégica', 'DE', '5', 2, 'ADE-DER'),
(171, 'Investigación Comercial', 'IC', '5', 2, 'ADE-DER');

DO $carga$
DECLARE
    r record;
    estudio_id integer;
    asignatura_id_nueva integer;
    limite integer;
BEGIN
    IF current_database() <> 'permutas_FCEYE' THEN
        RAISE EXCEPTION 'Base incorrecta: %. Ejecutar en permutas_FCEYE.', current_database();
    END IF;
    SELECT limite_estudiantes INTO limite FROM carga_config;
    IF limite IS NULL OR limite <= 0 THEN
        RAISE EXCEPTION 'Falta indicar un límite de estudiantes positivo en carga_config.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.estudios)
       OR EXISTS (SELECT 1 FROM public.asignatura)
       OR EXISTS (SELECT 1 FROM public.asignatura_estudios)
       OR EXISTS (SELECT 1 FROM public.grupo) THEN
        RAISE EXCEPTION 'Importación inicial cancelada: alguna tabla de destino ya contiene datos.';
    END IF;

    ALTER TABLE public.asignatura ALTER COLUMN nombre TYPE varchar(120);

    INSERT INTO public.estudios(nombre, siglas)
    SELECT nombre, siglas FROM carga_estudios;

    FOR r IN SELECT * FROM carga_asignaturas ORDER BY fila_excel LOOP
        SELECT id INTO STRICT estudio_id FROM public.estudios
        WHERE siglas = r.estudio_siglas;

        INSERT INTO public.asignatura(nombre, siglas, codigo, curso)
        VALUES (r.nombre, r.siglas, NULL, r.curso)
        RETURNING id INTO asignatura_id_nueva;

        INSERT INTO public.asignatura_estudios(asignatura_id, estudios_id)
        VALUES (asignatura_id_nueva, estudio_id);

        INSERT INTO public.grupo(nombre, limite_estudiantes, tipo_grupo,
                                 proyecto_docente, asignatura_id_fk, habilitado)
        SELECT n, limite, NULL, NULL, asignatura_id_nueva, true
        FROM generate_series(1, r.numero_grupos) AS serie(n);
    END LOOP;

    IF (SELECT count(*) FROM public.estudios) <> 4
       OR (SELECT count(*) FROM public.asignatura) <> 170
       OR (SELECT count(*) FROM public.asignatura_estudios) <> 170
       OR (SELECT count(*) FROM public.grupo) <> 556 THEN
        RAISE EXCEPTION 'Los recuentos no coinciden con el Excel.';
    END IF;
END
$carga$;

COMMIT;

-- Resultado esperado: ADE 46/285; ECO 48/122; MIM 46/89; ADE-DER 30/60.
SELECT e.siglas, count(DISTINCT a.id) AS asignaturas, count(g.id) AS grupos
FROM public.estudios e
JOIN public.asignatura_estudios ae ON ae.estudios_id = e.id
JOIN public.asignatura a ON a.id = ae.asignatura_id
LEFT JOIN public.grupo g ON g.asignatura_id_fk = a.id
GROUP BY e.siglas ORDER BY e.siglas;
