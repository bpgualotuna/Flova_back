# 🚀 Guía de Deploy en Render - Flova Backend

Esta guía te ayudará a desplegar el backend de Flova en Render.

## 📋 Pre-requisitos

- Cuenta en [Render](https://render.com)
- Base de datos PostgreSQL en Neon (ya configurada)
- Repositorio Git con el código

---

## 🔧 Configuración de Variables de Entorno en Render

Cuando crees el servicio en Render, necesitas configurar las siguientes variables de entorno:

### Variables Requeridas:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_iEA9wDrd5qCv@ep-spring-cell-an5iknyh.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require` | URL de conexión a Neon PostgreSQL |
| `JWT_SECRET` | `flova_secret_key_super_segura_2026_medical_system` | Secreto para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | Tiempo de expiración del token |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `PORT` | `3000` | Puerto del servidor (Render lo asigna automáticamente) |
| `CORS_ORIGIN` | `https://tu-frontend.vercel.app` | URL del frontend (actualizar cuando despliegues el frontend) |

---

## 🚀 Pasos para Deploy

### Opción 1: Deploy Automático desde GitHub

1. **Conecta tu repositorio a Render:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Click en "New +" → "Web Service"
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio `Flova_back`

2. **Configura el servicio:**
   - **Name:** `flova-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `main` (o la rama que uses)
   - **Root Directory:** `Flova_back` (si está en una subcarpeta)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build && npx prisma migrate deploy`
   - **Start Command:** `npm start`

3. **Agrega las variables de entorno:**
   - En la sección "Environment Variables", agrega todas las variables listadas arriba

4. **Selecciona el plan:**
   - Free (para pruebas)
   - Starter ($7/mes) (para producción)

5. **Click en "Create Web Service"**

Render automáticamente:
- Instalará las dependencias
- Ejecutará las migraciones de Prisma
- Compilará TypeScript
- Iniciará el servidor

---

### Opción 2: Deploy Manual usando render.yaml

1. **Sube el archivo `render.yaml` a tu repositorio**

2. **En Render Dashboard:**
   - Click en "New +" → "Blueprint"
   - Conecta tu repositorio
   - Render detectará automáticamente el archivo `render.yaml`

3. **Actualiza las variables de entorno:**
   - Edita `CORS_ORIGIN` con la URL de tu frontend
   - Verifica que `DATABASE_URL` apunte a tu base de datos en Neon

4. **Click en "Apply"**

---

## 🗄️ Base de Datos

### Ya tienes la base de datos configurada en Neon:

✅ **URL de conexión:**
```
postgresql://neondb_owner:npg_iEA9wDrd5qCv@ep-spring-cell-an5iknyh.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

✅ **Migraciones aplicadas:** Sí

✅ **Datos de prueba cargados:** Sí

### Si necesitas ejecutar el seed en producción:

```bash
# Conectarse al servicio en Render y ejecutar:
npm run prisma:seed
```

---

## 🔍 Verificación del Deploy

Una vez desplegado, verifica que todo funcione:

### 1. Health Check
```bash
curl https://tu-app.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Flova Backend API - Sistema de Gestión de Citas Médicas",
  "timestamp": "2026-05-04T05:00:00.000Z"
}
```

### 2. Login de prueba
```bash
curl -X POST https://tu-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"admin","password":"admin123"}'
```

### 3. Obtener terapias
```bash
curl https://tu-app.onrender.com/api/terapias
```

---

## 📝 Comandos Útiles en Render

### Ver logs en tiempo real:
- Ve a tu servicio en Render Dashboard
- Click en "Logs"

### Ejecutar comandos en el servidor:
- Ve a "Shell" en el dashboard
- Ejecuta comandos como:
  ```bash
  npm run prisma:studio
  npx prisma migrate status
  ```

### Reiniciar el servicio:
- Click en "Manual Deploy" → "Clear build cache & deploy"

---

## 🔒 Seguridad

### Recomendaciones para producción:

1. **Cambia el JWT_SECRET:**
   ```bash
   # Genera un secreto seguro:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Actualiza CORS_ORIGIN:**
   - Cambia de `http://localhost:5173` a la URL real de tu frontend
   - Ejemplo: `https://flova-app.vercel.app`

3. **Habilita HTTPS:**
   - Render proporciona HTTPS automáticamente

4. **Variables de entorno sensibles:**
   - Nunca las subas al repositorio
   - Usa las variables de entorno de Render

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que incluya `?sslmode=require` al final

### Error: "Prisma Client not generated"
- Verifica que el build command incluya `npx prisma generate`
- Revisa los logs de build en Render

### Error: "Port already in use"
- Render asigna el puerto automáticamente
- No uses `PORT=3000` fijo, usa `process.env.PORT || 3000`

### El servicio se duerme (Free plan)
- Los servicios gratuitos se duermen después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar 30-60 segundos
- Considera el plan Starter ($7/mes) para mantenerlo activo

---

## 📊 Monitoreo

### Métricas disponibles en Render:
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

### Logs:
- Todos los `console.log()` aparecen en los logs de Render
- Útil para debugging

---

## 🔄 Actualizaciones

### Deploy automático:
- Cada push a la rama `main` desplegará automáticamente
- Render ejecutará el build y reiniciará el servicio

### Deploy manual:
- Click en "Manual Deploy" en el dashboard
- Útil para desplegar sin hacer push

---

## 📞 Soporte

- [Documentación de Render](https://render.com/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Comunidad de Render](https://community.render.com)

---

## ✅ Checklist de Deploy

- [ ] Repositorio conectado a Render
- [ ] Variables de entorno configuradas
- [ ] Build command configurado: `npm install && npm run build && npx prisma migrate deploy`
- [ ] Start command configurado: `npm start`
- [ ] Base de datos en Neon conectada
- [ ] Migraciones aplicadas
- [ ] Health check funcionando
- [ ] Login de prueba funcionando
- [ ] CORS configurado con la URL del frontend
- [ ] JWT_SECRET cambiado (para producción)

---

## 🎉 ¡Listo!

Tu backend de Flova está desplegado en Render y listo para usar.

**URL del backend:** `https://tu-app.onrender.com`

**Endpoints disponibles:** 24 endpoints (ver `COLECCION_INSOMNIA_COMPLETA.md`)

**Credenciales de prueba:**
- Admin: `admin` / `admin123`
- Paciente: `1234567890` / `password123`
- Médico: `1111111111` / `password123`
