# Permutas FCEYE — frontend

Adaptación de la plataforma de permutas de ETSII para la Facultad de Ciencias Económicas y Empresariales de la Universidad de Sevilla. Desarrollada con React y Vite.

## Desarrollo

```sh
npm ci
cp .env.example .env
npm run dev
```

Vite sirve la aplicación en `http://localhost:5173` y redirige `/api` al backend en `http://localhost:3000`. `VITE_API_URL` puede definir un backend separado. Las peticiones incluyen cookies de sesión.

## Acceso

- `/login`: acceso con UVUS y contraseña de la plataforma.
- `/registro`: alta con UVUS, nombre completo, correo y contraseña de 12 a 128 caracteres; inicia la sesión como estudiante.
- `/noRegistrado`: redirige al registro integrado.
- Las rutas privadas comprueban la sesión y el rol. Cerrar sesión invalida la sesión del servidor y actualiza la navegación.

Las notificaciones de la plataforma se mantienen en la portada y el menú. Esta adaptación no necesita el bot para acceder o registrarse. La marca se presenta como texto hasta disponer de recursos oficiales de FCEYE.

## Comprobaciones

```sh
npm test -- --run
npm run build
```
