# Resumen del Cambio: Soporte de Rutas Duales (Inglés y Español) en el Servidor Backend

Para solucionar el problema en el frontend (`Flova_front`) que impedía la visualización de Terapias y Citas previas en las pantallas del Dashboard y del listado de Terapias, registramos alias de rutas en español en el servidor del backend (`Flova_back`).

---

## 🏗️ Cambios Implementados

### 1. Registro de Alias de Enrutamiento (`Flova_back/src/index.ts`)
*   Se configuró el servidor Express para que escuche y maneje las peticiones tanto en las rutas en inglés como en sus alias correspondientes en español:
    *   `/api/appointments` ➕ `/api/citas` ➡️ `appointmentsRoutes`
    *   `/api/doctors` ➕ `/api/medicos` ➡️ `doctorsRoutes`
    *   `/api/therapies` ➕ `/api/terapias` ➡️ `therapiesRoutes`
    *   `/api/users` ➕ `/api/usuarios` ➡️ `usersRoutes`

### 2. Alias de Estadísticas Financieras (`Flova_back/src/routes/stats.routes.ts`)
*   Se agregó la ruta `/finanzas` para resolver la carga de estadísticas en la interfaz del administrador:
    *   `/api/stats/financial` ➕ `/api/stats/finanzas` ➡️ `getFinancialStats`

---

## 🧪 Verificación y Despliegue
*   **Compilación:** El backend compila perfectamente y sin advertencias (`npx tsc` finalizó con éxito).
*   **GitHub:** Los cambios han sido subidos a la rama principal (`main`) de `Flova_back` (`origin/main`).
