# Resumen del Cambio: Actualización de URLs de Servidor en la Documentación de Endpoints

Modificamos el archivo de especificación de endpoints en la arquitectura de dos servidores (`Flova_back`) para reemplazar las referencias locales (`localhost`) por las direcciones IP públicas correspondientes a los servidores de Staging/Despliegue.

---

## 🏗️ Cambios Implementados

### 1. Actualización de Direcciones Base (`COLECCION_INSOMNIA_COMPLETA_DOS_BACKENDS.md`)
*   **Servidor de Reglas de Negocio / API Pública (`Flova_back`):**
    - **Antes:** `http://localhost:4000`
    - **Ahora:** `https://32.196.88.12`
*   **Servidor de Persistencia / CRUD Interno (`flova_db`):**
    - **Antes:** `http://localhost:5001`
    - **Ahora:** `http://3.135.164.193`

---

## 🧪 Verificación y Despliegue
*   **Verificación de reemplazos:** Validamos que no existan referencias remanentes a `localhost` en las URLs especificadas en la colección.
*   **GitHub:** Los cambios han sido subidos exitosamente a la rama principal (`main`) en el repositorio remoto del backend (`Flova_back`).
