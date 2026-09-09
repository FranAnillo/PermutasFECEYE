# Permutas FECEYE · Universidad de Sevilla

Adaptación de la plataforma de permutas de ETSII para FECEYE, con **registro web y acceso mediante nombre de usuario y contraseña local**. El bot y los envíos de Telegram quedan comentados; las notificaciones de la aplicación siguen funcionando.

## Base del proyecto

- `backend/`: copia de `TFMPermuta`, revisión `9090a57e297b0819e6ee4514379925d27466df8c`.
- `frontend/`: copia de `TFMFrontEnd`, revisión `a672e7be001e0692fbaf395c8efcc68df7b5d265`.
- Los repositorios originales no se modificaron. Se copiaron sus archivos de trabajo, sin historial Git, dependencias, configuración privada ni claves SSL.
- Los SQL preexistentes `verificar_estructura.sql` e `insert_estudios_asignaturas_grupos.sql` se conservan sin cambios. No se han ejecutado sobre la base de datos del usuario.

## Instalación local

Requisitos: Node.js 22 o posterior, npm y PostgreSQL con el esquema de permutas de FECEYE ya creado a partir de ETSII. Este proyecto no contiene un volcado completo del esquema original: `verificar_estructura.sql` solo lo comprueba.

1. En `backend/`, ejecutar `npm ci` y copiar `.env.example` a `.env`.
2. Completar `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER` y `DB_PASS` para la base de FECEYE.
3. Generar una clave con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y guardarla como `SESSION_SECRET` en `.env`.
4. Aplicar, en este orden y con una conexión a la base de FECEYE, los scripts completos:
   - `backend/migrations/001_autenticacion_local.sql`
   - `backend/migrations/002_sesiones_web.sql`
5. Ejecutar `npm start` desde `backend/`. La API escucha en `http://127.0.0.1:3000`.
6. En otra terminal, ejecutar `npm ci` y `npm run dev` desde `frontend/`.
7. Abrir `http://localhost:5173/registro`, crear una cuenta y seleccionar los estudios y grupos desde el área de estudiante.

El frontend usa un proxy `/api` hacia el backend. Para desarrollo, dejar `VITE_API_URL` vacío y `FRONTEND_URL=http://localhost:5173`. Si se cambia el puerto, actualizar el origen permitido. No se necesita SAML, bot, QR ni token de Telegram.

Las migraciones se pueden repetir. La primera comprueba duplicados de usuario/correo ignorando mayúsculas y espacios; si existen, aborta sin borrar datos. Añade `password_hash`, amplía las columnas de identidad a `text` y permite `chatid`/`userid` nulos. La segunda crea la tabla de sesiones. El SQL de estudios/asignaturas existente corresponde a una carga inicial separada que exige las tablas vacías; no forma parte de estas migraciones de autenticación.

## Acceso y cuentas

- `/login`: nombre de usuario y contraseña.
- `/registro`: nombre de usuario (3–50 letras, números, puntos, guiones o guiones bajos), nombre completo (2–150 caracteres), correo (hasta 254), contraseña y confirmación (12–128 caracteres).
- El registro crea exclusivamente el rol `estudiante`, aunque el cliente envíe otro rol. Después inicia sesión automáticamente.
- Las contraseñas usan scrypt con sal aleatoria. Las cookies son HttpOnly, SameSite=Lax, duran dos horas y se regeneran al autenticar. Las sesiones se guardan en PostgreSQL.
- La API vuelve a comprobar el estado y rol de la cuenta en las solicitudes privadas. El cierre de sesión elimina la sesión del servidor.
- El nombre de usuario es una cuenta local. El formulario no autentica ante el SSO de la Universidad ni verifica la propiedad del correo; no debe usarse la contraseña institucional. No se ha añadido recuperación automática por correo.

Las cuentas heredadas conservan su rol y datos, pero no tienen contraseña local automáticamente. Una persona con acceso autorizado al servidor puede asignarles una contraseña mediante `npm run password:usuario -- nombre_usuario`, desde `backend/`, después de las migraciones. La entrada está oculta y el comando no crea usuarios ni cambia roles. Invalida las sesiones guardadas en PostgreSQL; si se usa `SESSION_STORE=memory` en desarrollo, reiniciar también la API.

Para el primer administrador de una base nueva, registrar primero la cuenta y asignar explícitamente `administrador` a su fila en `roles` mediante la administración de la base de datos. No hay contraseña ni administrador predeterminado.

## API de autenticación

| Método | Ruta bajo `/api/v1/autorizacion` | Entrada / resultado |
| --- | --- | --- |
| POST | `/registro` | `{nombre_usuario,nombre_completo,correo,password}` → 201 y sesión |
| POST | `/login` | `{nombre_usuario,password}` → 200 y sesión |
| GET | `/obtenerSesion` | 200 y sesión, o 401 |
| POST | `/logout` | 200, `{isAuthenticated:false}` |

La respuesta autenticada es `{isAuthenticated:true,user:{uvus,rol}}`. Los errores incluyen `message`: 400 validación, 401 credenciales/sesión, 403 origen/permisos, 409 duplicado y 429 demasiados intentos. Login y registro comparten un límite de 20 intentos fallidos por IP cada 15 minutos (las peticiones en curso también cuentan). Las rutas SAML y el webhook de Telegram ya no están montados.

## Telegram y funciones heredadas

Los bloques de consulta de chat, construcción y envío de mensajes están comentados en los servicios de usuarios, grupos, incidencias, solicitudes, permutas y notificaciones. También se han comentado el registro de comandos, los handlers y la llamada central a Telegram. Las inserciones de notificaciones web, las operaciones de permutas y los correos se conservan. No se han probado envíos reales de correo.

Se mantiene el código funcional de ETSII y se corrigen los bloqueos de arranque encontrados: dependencia `csv-parser` ausente y una exportación de controlador inexistente. Los módulos antiguos de SAML, gestión adicional de usuarios y plazos que no estaban conectados al servidor no se activan en esta adaptación. El panel de usuarios continúa usando las rutas existentes `/api/v1/usuario`.

## Comprobaciones

- `cd backend && npm test`: pruebas de autenticación HTTP, contraseñas, transacciones simuladas, Telegram desactivado, notificaciones web y utilidades. Abren servidores locales efímeros.
- `cd frontend && npm run test -- --run`: pruebas de interfaz.
- `cd frontend && npm run build`: compilación para producción.
- `backend/test/postgres.integration.test.mjs`: prueba optativa contra PostgreSQL real y vacío. Usa únicamente `127.0.0.1`, usuario `postgres`, base `feceye_test` y contraseña de pruebas `feceye-test-only`; requiere `FECEYE_TEST_DB_PORT`. Rechaza una base que ya contenga `usuario`, crea un esquema mínimo y limpia solo sus tablas al finalizar. Valida ambas migraciones, repetición, cuentas heredadas, registro concurrente, perfiles, roles, cookies, sesión persistente, logout e inserciones revertidas. No sustituye una prueba sobre una copia del esquema completo de producción.

## Configuración de despliegue

Compilar el frontend y servirlo con fallback de rutas a `index.html`. Publicar `/api` bajo el mismo sitio mediante un proxy hacia el backend. Configurar `NODE_ENV=production`, `FRONTEND_URL=https://dominio-del-centro` y una `SESSION_SECRET` propia. Si el proxy termina HTTPS, establecer `TRUST_PROXY` con la IP o red del proxy; si Node termina HTTPS, configurar ambos archivos `SSL_KEY_PATH` y `SSL_CERT_PATH`.

Producción requiere sesiones en PostgreSQL y cookies Secure. El almacenamiento en memoria solo se permite para desarrollo/pruebas. En despliegues con varios procesos, añadir en el proxy un límite de intentos compartido. La persistencia sigue el contrato de [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple) y la configuración de cookies de [express-session](https://expressjs.com/en/resources/middleware/session/).

Completar las variables de correo y aportar la plantilla PDF de permuta de FECEYE en `PLANTILLAS` para los flujos de documentos heredados. Antes de publicar, completar los textos institucionales de privacidad/contacto y los recursos oficiales del centro. Los cambios locales requieren actualizar explícitamente el servidor; las pruebas no modifican su base de datos.

## Actualización: perfil académico obligatorio y colores FECEYE

El área de estudiante usa naranja `#FF5800`, blanco y gris `#363636`, tomados del tema de https://fceye.us.es/. Se usa un naranja más oscuro para texto/botones sobre blanco y variantes legibles para modo oscuro. Los estilos se limitan al área de estudiante.

Al registrarse se abre `/miPerfil`. Antes de montar las pantallas de estudiante, se consulta `GET /api/v1/usuario/configuracionInicial`. El asistente es un diálogo modal nativo: oscurece el fondo, bloquea interacción/foco fuera del diálogo y no permite cerrar con Escape ni clic exterior. Solo permite completar el paso, reintentar ante errores o cerrar sesión.

Pasos obligatorios: grado → una o más asignaturas (incluso de distintos cursos) → un grupo actual por cada asignatura. El estado se lee de la base al entrar, navegar y completar cada paso; las cuentas existentes retoman lo pendiente. Si se aprueban todas las asignaturas desde el perfil, se vuelve a exigir selección. Un perfil completo no muestra el asistente.

`POST /api/v1/usuario/configuracionInicial` guarda cada paso en una transacción, con validación de pertenencia e identificadores de base de datos (funciona también con asignaturas cuyo código sea nulo). El rol se obtiene de la sesión; el endpoint solo admite estudiantes. Las rutas de permutas y solicitudes rechazan perfiles incompletos con HTTP 409 y `code: PERFIL_INCOMPLETO`.

Esta actualización **no requiere migraciones SQL**. Una vez publicados los cambios en Git, actualizar el servidor:

```sh
cd /opt/PermutasFECEYE/PermutasFECEYE
export PATH="/opt/feceye-runtime/node-v22.23.2-linux-x64/bin:$PATH"
git pull --ff-only
npm --prefix backend ci
sudo systemctl restart permutas-feceye
npm --prefix frontend ci
npm --prefix frontend run build
```

El contenedor `permutas-feceye-web` sirve la carpeta `frontend/dist` que ya tiene montada. No requiere cambios en DNS, proxy, firewall ni `.env`.

Validación: 42 pruebas frontend; 28 comprobaciones backend superadas y una integración Docker optativa omitida. El nuevo SQL se ha probado en PostgreSQL embebido (PGlite, dependencia solo de desarrollo), incluyendo rollback, selecciones cruzadas y bloqueo de permutas. Compilación correcta; persiste el aviso previo de tamaño del bundle. No se han aplicado estos cambios a la base ni al servidor de producción.
