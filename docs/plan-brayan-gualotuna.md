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

- [x] Verificar que el controlador use los nombres reales de `schema.prisma`.
- [x] Completar validaciones de registro y actualización.
- [x] Completar login, perfil y logout.
- [x] Proteger rutas con `authMiddleware` y `requireRoles`.
- [x] Ocultar contraseñas en todas las respuestas.
- [x] Probar errores `400`, `401`, `403`, `404` y `409`.
- [x] Actualizar la colección de Insomnia con ejemplos.
- [x] Configurar y ejecutar pruebas unitarias con Jest (`npm test`).
- [x] Configurar y ejecutar validación de código con ESLint (`npm run lint`).
- [x] Ejecutar compilación y documentar evidencia.

## Criterios de aceptación

- Un paciente puede registrarse e iniciar sesión.
- El login devuelve un JWT válido y datos públicos del usuario.
- Las rutas protegidas rechazan tokens ausentes, inválidos o revocados.
- Un administrador puede gestionar usuarios.
- Un paciente o médico no puede modificar recursos de otro usuario.

---

## Evidencia de ejecución y validación

Ejecutado en la rama `brayan-gualotuna`:

```text
npm run build       PASS - Compilación TypeScript limpia (Exit code 0)
npm test            PASS - 37 pruebas unitarias con Jest (100% PASS)
npm run lint        PASS - 0 errores (Exit code 0)
```

### Detalle de pruebas Jest (`npm test`):

```text
PASS tests/auth-and-users.test.ts
  Flova Authentication and User Management Module (Brayan Plan)
    1. Error 400 - Registration Validations
      √ returns 400 on missing required fields
      √ returns 400 on invalid Ecuadorian ID checksum/province
      √ returns 400 on password shorter than 6 characters
      √ returns 400 on invalid email format
      √ returns 400 on invalid user role
    2. Registration (201 Created) and Password Masking
      √ registers a patient successfully without returning password
      √ registers an administrator successfully
    3. Error 409 - Conflict on Duplicate Records
      √ returns 409 on duplicate cedula registration
      √ returns 409 on duplicate email registration
    4. Login Scenarios (400, 404, 401, 200)
      √ returns 400 when login password is missing
      √ returns 404 when user does not exist
      √ returns 401 when password is incorrect
      √ returns 200 and JWT on valid patient login without exposing password
      √ returns 200 on valid admin login
    5. Profile /api/auth/me and Token Validation
      √ returns 401 when token is missing
      √ returns 401 when token is invalid
      √ returns 200 with user profile on valid token
    6. Logout and Token Revocation (401)
      √ returns 200 on logout and revokes the token
      √ returns 401 when using a revoked token
      √ allows user to login again and receive a new valid token
    7. User Management Access Controls (403, 200)
      √ returns 403 when non-admin attempts to list users
      √ returns 200 when admin lists users
      √ allows patient to view their own profile
      √ returns 403 when patient attempts to view another user profile
      √ allows admin to view any user profile
      √ returns 400 when user ID parameter is non-numeric
      √ returns 404 when user ID does not exist
    8. User Updates & Ownership Guards
      √ returns 403 when patient attempts to modify another user
      √ returns 403 when non-admin attempts to change their role
      √ returns 400 when updating password with fewer than 6 characters
      √ returns 400 on invalid email update
      √ returns 409 when updating email to an existing email
      √ updates user profile successfully
    9. User Deactivation and Access Blocking (Rule 6)
      √ returns 403 when non-admin attempts to delete/deactivate user
      √ allows admin to deactivate user
      √ returns 401 when deactivated user attempts to log in
      √ returns 401 when deactivated user attempts to access protected endpoint with old token

Test Suites: 1 passed, 1 total
Tests:       37 passed, 37 total
Snapshots:   0 total
```
