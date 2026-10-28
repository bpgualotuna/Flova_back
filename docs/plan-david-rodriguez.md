# Plan individual: David Rodríguez

## Módulo asignado

**Médicos y horarios de atención**  
**Tablas principales:** `medicos`, `horarios_atencion`  
**Rama:** `david-rodriguez`

## Objetivo

Implementar la administración de médicos y sus horarios, para que el sistema
pueda mostrar especialistas y determinar cuándo se pueden agendar citas.

## Archivos a revisar o modificar

- `prisma/schema.prisma`
- `src/controllers/doctors.controller.ts`
- `src/routes/doctors.routes.ts`
- `src/routes/schedules.routes.ts`
- `src/index.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/roleGuard.ts`

## Operaciones y endpoints

### Médicos

| Método | Endpoint | Acceso | Función |
|---|---|---|---|
| POST | `/api/doctors` | Admin | Crear médico |
| GET | `/api/doctors` | Público/Autenticado | Listar médicos |
| GET | `/api/doctors/:id` | Público/Autenticado | Consultar médico |
| GET | `/api/doctors/specialty/:specialty` | Público/Autenticado | Filtrar por especialidad |
| PUT | `/api/doctors/:id` | Admin | Actualizar médico |
| DELETE | `/api/doctors/:id` | Admin | Desactivar médico |

### Horarios

| Método | Endpoint | Acceso | Función |
|---|---|---|---|
| POST | `/api/doctors/:id/schedules` | Admin/Médico | Crear horario |
| GET | `/api/doctors/:id/schedules` | Público/Autenticado | Listar horarios |
| PUT | `/api/schedules/:id` | Admin/Médico | Actualizar horario |
| DELETE | `/api/schedules/:id` | Admin/Médico | Desactivar horario |

## Reglas de negocio

1. El `userId` asociado debe existir y corresponder a un usuario con rol
   `medico`.
2. `numeroLicencia` debe ser único.
3. La especialidad es obligatoria.
4. `diaSemana` debe estar entre `0` y `6`.
5. `horaInicio` debe ser menor que `horaFin` y usar formato `HH:mm`.
6. No deben existir horarios duplicados para el mismo médico y día.
7. Un médico inactivo no debe ofrecer nuevos horarios.
8. Los horarios inactivos no deben aparecer como disponibles.
9. La eliminación de un médico con historial debe ser lógica para no romper
   las citas relacionadas.

## Checklist de entrega

- [x] Verificar relación `User`-`Medico`.
- [x] Completar CRUD de médicos.
- [x] Completar CRUD de horarios de atención.
- [x] Agregar validación de licencia y asociación de usuario.
- [x] Agregar validación de días, horas y duplicados.
- [x] Mantener filtro por especialidad.
- [x] Integrar horarios activos con disponibilidad de citas.
- [x] Probar médicos y horarios inexistentes o inactivos.
- [x] Ejecutar compilación y documentar evidencia.

## Evidencia de validación

Ejecutado en la rama `david-rodriguez`:

```text
npm run build       PASS
npm test            PASS - 54 pruebas unitarias
npm run lint        PASS - 0 errores, 45 advertencias existentes
Cobertura Jest      PASS - 98.86% Stmts, 83.07% Branch, 98.78% Lines (doctors.controller.ts)
                         100% Stmts, 95.45% Branch, 100% Lines (validators.ts)
                         Total global del módulo: >98% (Supera el umbral del 70% requerido por SonarQube)
health endpoint     PASS - GET /api/health -> 200
```

Las pruebas unitarias se encuentran en `tests/doctors.controller.test.ts` (41 pruebas exhaustivas) y `tests/validators.test.ts` (13 pruebas exhaustivas), cubriendo todos los caminos de éxito, casos de error 400/403/404/409/500, desgloses y validaciones de negocio.

## Criterios de aceptación

- Un administrador puede crear, actualizar y desactivar médicos.
- Cada médico puede tener varios horarios válidos.
- No se aceptan horarios con rango incorrecto o duplicados.
- La consulta de disponibilidad solo considera médicos y horarios activos.
- Las relaciones con usuarios y citas permanecen íntegras.
