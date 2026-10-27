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
- [x] Ejecutar compilación y documentar evidencia.

## Criterios de aceptación

- Un paciente puede registrarse e iniciar sesión.
- El login devuelve un JWT válido y datos públicos del usuario.
- Las rutas protegidas rechazan tokens ausentes, inválidos o revocados.
- Un administrador puede gestionar usuarios.
- Un paciente o médico no puede modificar recursos de otro usuario.

---

## Evidencia de ejecución y pruebas

### 1. Compilación TypeScript
- Comando: `npm run build` (`tsc`)
- Resultado: **Exitoso (Exit code 0)** sin errores de tipos o sintaxis.

### 2. Suite de Pruebas Automatizadas
- Comando: `npm test` (`tsx tests/auth-and-users.test.ts`)
- Resultado: **46/46 pruebas exitosas (100% PASS)**

```text
--- Test Group 1: 400 Bad Request on Register ---
  PASS: 400 on missing required fields
  PASS: 400 on invalid Ecuadorian ID checksum/province
  PASS: 400 on password shorter than 6 chars
  PASS: 400 on invalid email format
  PASS: 400 on invalid role

--- Test Group 2: Successful Registration & Password Masking ---
  PASS: 201 on valid patient registration
  PASS: Password is NEVER returned in response
  PASS: Default role is paciente
  PASS: 201 on admin registration

--- Test Group 3: 409 Conflict on Duplicate Fields ---
  PASS: 409 on duplicate cedula
  PASS: 409 on duplicate email

--- Test Group 4: Login Scenarios (400, 404, 401, 200) ---
  PASS: 400 on missing login password
  PASS: 404 on non-existent user
  PASS: 401 on incorrect password
  PASS: 200 on valid patient login
  PASS: JWT token is returned on login
  PASS: Login response masks password
  PASS: 200 on valid admin login

--- Test Group 5: /api/auth/me and Token Validation ---
  PASS: 401 when token is missing
  PASS: 401 when token is invalid
  PASS: 200 on /auth/me with valid token
  PASS: Profile belongs to current authenticated user
  PASS: Profile does not leak password

--- Test Group 6: Logout & Revoked Token (401) ---
  PASS: 200 on /auth/logout
  PASS: 401 Unauthorized with revoked token

--- Test Group 7: Role and Ownership Access Controls (403, 200) ---
  PASS: 403 when non-admin lists users
  PASS: 200 when admin lists users
  PASS: Admin receives user list
  PASS: 200 when patient views their own profile
  PASS: 403 when patient views another user profile
  PASS: 200 when admin views patient profile
  PASS: 400 on non-numeric user ID
  PASS: 404 when user ID does not exist

--- Test Group 8: Update User Validations & Guards ---
  PASS: 403 when patient attempts to modify another user
  PASS: 403 when non-admin attempts to change roles
  PASS: 400 when updating password with < 6 chars
  PASS: 400 on invalid email update
  PASS: 409 when updating email to an existing email
  PASS: 200 on valid user update
  PASS: Phone was successfully updated
  PASS: Insurance was successfully updated
  PASS: Updated user response does not contain password

--- Test Group 9: User Deactivation and Access Blocking (Rule 6) ---
  PASS: 403 when non-admin tries to delete/deactivate user
  PASS: 200 when admin deactivates user
  PASS: 401 when deactivated user attempts to log in
  PASS: 401 when deactivated user accesses protected endpoint with token

========================================
TEST SUMMARY: 46/46 TESTS PASSED!
========================================
```
