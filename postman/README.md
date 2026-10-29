# Ecosistema de Pruebas en Postman — Flova Backend
## Módulo: Médicos y Horarios de Atención (David Rodríguez)

Este directorio contiene la colección y el entorno listos para importar en Postman y ejecutar en directo durante la defensa técnica del proyecto.

---

## 📁 Archivos incluidos

1. **`Flova_Backend.postman_collection.json`**  
   Colección organizada en 6 carpetas temáticas con pruebas automatizadas (`pm.test`), extracción dinámica de tokens JWT (`token_admin`, `token_medico`, `token_paciente`) y verificación de códigos de respuesta HTTP.
2. **`Flova_Backend.postman_environment.json`**  
   Variables de entorno preconfiguradas (`baseUrl`, credenciales por rol, variables dinámicas de IDs y tokens).

---

## 🚀 Pasos para importar y ejecutar en directo

### 1. Iniciar el servidor backend
Asegúrate de que la base de datos esté activa y levanta el servidor:
```bash
npm run dev
```
*El servidor correrá en `http://localhost:3000`.*

### 2. Importar en Postman
1. Abre **Postman**.
2. Haz clic en el botón **Import** (arriba a la izquierda).
3. Arrastra o selecciona los dos archivos:
   - `postman/Flova_Backend.postman_collection.json`
   - `postman/Flova_Backend.postman_environment.json`
4. En la esquina superior derecha de Postman, selecciona el entorno activo: **`Flova Backend - Local Environment`**.

### 3. Orden de ejecución recomendado para la defensa

| Carpeta | Propósito técnico | Código esperado |
|---|---|---|
| **00 - Health Check** | Demuestra disponibilidad del servicio | `200 OK` |
| **01 - Autenticación** | Inicia sesión y extrae automáticamente los JWT para Admin, Médico y Paciente | `200 OK` |
| **02 - Médicos (Flujo Positivo)** | Lista médicos, consulta por ID, filtra por especialidad, crea y actualiza con rol Admin | `200 OK`, `201 Created` |
| **03 - Médicos (Casos Negativos)** | Valida seguridad RBAC (401 sin token, 403 rol paciente), unicidad de licencia (409 Conflict) y baja lógica | `401`, `403`, `400`, `409`, `404`, `200` |
| **04 - Horarios (Flujo Positivo)** | Consulta y crea horarios de atención para especialistas | `200 OK`, `201 Created` |
| **05 - Horarios (Validaciones & Conflictos)** | Demuestra algoritmo anti-solapamiento (409 Conflict), rango invertido (400 Bad Request) y control de acceso | `400`, `409`, `404`, `403`, `200` |
| **06 - Rutas Duales** | Demuestra compatibilidad en inglés y español (`/api/medicos`, `/api/horarios`) | `200 OK` |

---

## ⚡ Ejecución automatizada con Runner de Postman

Si el docente o evaluador pide correr todo de forma automatizada:
1. Haz clic derecho sobre la colección **`Flova Backend - Pruebas de API (Defensa David Rodríguez)`**.
2. Selecciona **Run Collection**.
3. Asegúrate de tener seleccionado el entorno `Flova Backend - Local Environment`.
4. Haz clic en **Run Flova Backend...** y observa cómo todas las pruebas pasan en verde (100% Passed).
