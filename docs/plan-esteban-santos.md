# Plan individual: Esteban Santos

## Módulo asignado

**Citas médicas**  
**Tabla principal:** `citas`  
**Rama:** `esteban-santos`

## Objetivo

Implementar el ciclo completo de una cita médica: disponibilidad, creación,
consulta, actualización, confirmación, finalización y cancelación.

## Archivos a revisar o modificar

- `prisma/schema.prisma`
- `src/controllers/appointments.controller.ts`
- `src/routes/appointments.routes.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/roleGuard.ts`
- `src/controllers/stats.controller.ts`

## Operaciones y endpoints

| Método | Endpoint | Acceso | Función |
|---|---|---|---|
| GET | `/api/appointments` | Autenticado | Listar citas según el rol |
| GET | `/api/appointments/:id` | Autenticado | Consultar una cita |
| GET | `/api/appointments/available-schedules` | Autenticado | Consultar horarios libres |
| POST | `/api/appointments` | Paciente | Crear cita |
| PUT | `/api/appointments/:id` | Médico/Admin | Actualizar cita |
| DELETE | `/api/appointments/:id` | Paciente/Admin | Cancelar cita |

Se deben conservar los alias existentes:

```text
/api/citas
/api/citas/horarios-disponibles
```

## Estados de la cita

```text
pendiente
confirmada
completada
cancelada
```

## Reglas de negocio

1. El paciente debe existir y estar activo.
2. El médico debe existir y estar activo.
3. La terapia debe existir y estar activa.
4. La fecha no puede ser anterior a la fecha actual.
5. La hora debe estar dentro de un horario activo del médico.
6. No se puede reservar el mismo médico en la misma fecha y hora.
7. Solo un paciente puede crear una cita.
8. El médico o administrador puede confirmar, actualizar o completar una cita.
9. El paciente puede cancelar sus propias citas.
10. Una cita completada no puede cancelarse.
11. La cancelación debe guardar el motivo cuando corresponda.
12. La creación y la validación de disponibilidad deben protegerse contra
    reservas duplicadas mediante transacción y restricción única.

## Checklist de entrega

- [x] Completar creación de citas con validación de relaciones.
- [x] Completar listado por rol: paciente, médico y administrador.
- [x] Completar consulta por ID y errores `404`.
- [x] Implementar horarios disponibles por médico y fecha.
- [x] Validar anticipación, horario activo y conflictos.
- [x] Implementar confirmación, finalización y cancelación.
- [x] Validar transiciones de estado y permisos.
- [x] Conservar síntomas, exámenes, motivo de cancelación y notas médicas.
- [x] Probar doble reserva y citas con entidades inexistentes.
- [x] Ejecutar compilación y documentar evidencia.

## Evidencia de validación

Ejecutado en la rama `Test`:

```text
npm run build       PASS
npm test            PASS - 7 pruebas
npm run lint        PASS - 0 errores, 38 advertencias existentes
health endpoint     PASS - GET /api/health -> 200
```

Las pruebas unitarias se encuentran en
`tests/appointments.controller.test.ts` y mockean Prisma para validar el
controlador sin depender de una base de datos PostgreSQL.

## Criterios de aceptación

- Un paciente puede consultar disponibilidad y crear una cita válida.
- Una cita no puede duplicar médico, fecha y hora.
- El médico puede actualizar notas y estado según sus permisos.
- El paciente puede cancelar una cita permitida.
- El administrador puede consultar y gestionar todas las citas.
- El flujo completo mantiene las relaciones con usuarios, médicos y terapias.
