# Plan individual: Jonathan Ampuero

## Módulo asignado

**Terapias**  
**Tabla principal:** `terapias`  
**Rama:** `jonathan-ampuero`

## Objetivo

Implementar el catálogo de terapias de rehabilitación, incluyendo su
especialidad, duración, precio, imagen y estado de disponibilidad.

## Archivos a revisar o modificar

- `prisma/schema.prisma`
- `src/controllers/therapies.controller.ts`
- `src/routes/therapies.routes.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/roleGuard.ts`
- `README.md`

## Operaciones y endpoints

| Método | Endpoint | Acceso | Función |
|---|---|---|---|
| POST | `/api/therapies` | Admin | Crear terapia |
| GET | `/api/therapies` | Público | Listar terapias |
| GET | `/api/therapies/:id` | Público | Consultar terapia |
| PUT | `/api/therapies/:id` | Admin | Actualizar terapia |
| DELETE | `/api/therapies/:id` | Admin | Desactivar terapia |

También deben conservarse los alias en español:

```text
/api/terapias
```

## Filtros

```http
GET /api/therapies?specialty=Fisioterapia
GET /api/therapies?active=true
```

## Reglas de negocio

1. `nombre`, `descripcion` y `especialidad` son obligatorios.
2. `duracion` debe ser un entero mayor que cero.
3. `precio` debe ser un número mayor o igual que cero.
4. Una terapia inactiva no debe ofrecerse para nuevas citas.
5. Solo un administrador puede crear, actualizar o desactivar terapias.
6. No se debe eliminar físicamente una terapia con citas relacionadas.
7. Las respuestas deben mantener un formato consistente para los campos de
   terapia.
8. La imagen es opcional, pero debe conservarse cuando se proporcione.

## Checklist de entrega

- [ ] Verificar que el modelo y el controlador usen los mismos nombres.
- [ ] Completar CRUD de terapias.
- [ ] Agregar validaciones de duración, precio y campos obligatorios.
- [ ] Agregar filtros por especialidad y estado.
- [ ] Proteger escritura con autenticación y rol `admin`.
- [ ] Manejar terapia inexistente con `404`.
- [ ] Manejar datos inválidos con `400`.
- [ ] Manejar relaciones existentes mediante desactivación lógica.
- [ ] Actualizar ejemplos de endpoints en `README.md`.
- [ ] Ejecutar compilación y documentar evidencia.

## Criterios de aceptación

- Un administrador puede crear, modificar y desactivar terapias.
- Los usuarios pueden consultar terapias activas.
- Las terapias pueden filtrarse por especialidad.
- No se pueden registrar duración o precio inválidos.
- Una terapia inactiva no puede seleccionarse para una nueva cita.

