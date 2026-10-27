# Plan individual: Brayan Gualotuña

## Módulo asignado

**Usuarios y autenticación**  
**Tabla principal:** `users`  
**Rama:** `brayan-gualotuna`

## Objetivo

Implementar y dejar funcional el registro, autenticación, perfil y gestión de
usuarios del sistema Flova, manteniendo protección mediante JWT y permisos por
rol.

## Archivos a revisar o modificar

- `prisma/schema.prisma`
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/routes/users.routes.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/roleGuard.ts`
- `src/utils/jwt.ts`
- `src/utils/password.ts`
- `src/utils/validators.ts`

## Operaciones y endpoints

| Método | Endpoint | Acceso | Función |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Registrar paciente |
| POST | `/api/auth/login` | Público | Iniciar sesión y emitir JWT |
| GET | `/api/auth/me` | Autenticado | Consultar perfil actual |
| POST | `/api/auth/logout` | Autenticado | Revocar token |
| GET | `/api/users` | Admin | Listar y filtrar usuarios |
| GET | `/api/users/:id` | Propietario/Admin | Consultar usuario |
| PUT | `/api/users/:id` | Propietario/Admin | Actualizar usuario |
| DELETE | `/api/users/:id` | Admin | Desactivar o eliminar usuario |

## Reglas de negocio

1. `cedula` y `username` deben ser únicos.
2. El correo, cuando exista, debe ser válido y único.
3. La contraseña debe tener mínimo seis caracteres y almacenarse con bcrypt.
4. Nunca se debe devolver `password` en una respuesta.
5. Los roles válidos son `admin`, `medico` y `paciente`.
6. Un usuario desactivado no debe autenticarse ni realizar operaciones nuevas.
7. Un usuario normal solo puede consultar o modificar su propio perfil.
8. Solo `admin` puede listar, cambiar roles o eliminar otros usuarios.
9. Un token revocado debe devolver `401 Unauthorized`.

## Checklist de entrega

- [ ] Verificar que el controlador use los nombres reales de `schema.prisma`.
- [ ] Completar validaciones de registro y actualización.
- [ ] Completar login, perfil y logout.
- [ ] Proteger rutas con `authMiddleware` y `requireRoles`.
- [ ] Ocultar contraseñas en todas las respuestas.
- [ ] Probar errores `400`, `401`, `403`, `404` y `409`.
- [ ] Actualizar la colección de Insomnia con ejemplos.
- [ ] Ejecutar compilación y documentar evidencia.

## Criterios de aceptación

- Un paciente puede registrarse e iniciar sesión.
- El login devuelve un JWT válido y datos públicos del usuario.
- Las rutas protegidas rechazan tokens ausentes, inválidos o revocados.
- Un administrador puede gestionar usuarios.
- Un paciente o médico no puede modificar recursos de otro usuario.

