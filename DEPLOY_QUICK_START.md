# 🚀 Deploy Rápido en Render - Flova Backend

## ⚠️ ADVERTENCIA DE SEGURIDAD

**ANTES DE HACER PUSH:**
- ✅ Verifica que `.env` esté en `.gitignore`
- ✅ Verifica que `.env.example` NO contenga credenciales reales
- ✅ Lee `SECURITY.md` para mejores prácticas

---

## ✅ Pre-requisitos Completados

- ✅ Base de datos PostgreSQL en Neon configurada
- ✅ Migraciones aplicadas
- ✅ Datos de prueba cargados
- ✅ Build de TypeScript funcionando
- ✅ Archivos de configuración creados

---

## 📝 Pasos para Deploy (5 minutos)

### 1. Sube el código a GitHub

```bash
git add .
git commit -m "Preparado para deploy en Render"
git push origin main
```

### 2. Crea el servicio en Render

1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `Flova_back`

### 3. Configura el servicio

**Configuración básica:**
- **Name:** `flova-backend` (o el nombre que prefieras)
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** (déjalo vacío si Flova_back está en la raíz, o pon `Flova_back` si está en una subcarpeta)
- **Runtime:** Node
- **Build Command:**
  ```
  npm install && npm run build && npx prisma migrate deploy
  ```
- **Start Command:**
  ```
  npm start
  ```

### 4. Agrega Variables de Entorno

Click en **"Advanced"** y agrega estas variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_iEA9wDrd5qCv@ep-spring-cell-an5iknyh.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=flova_secret_key_super_segura_2026_medical_system

JWT_EXPIRES_IN=7d

NODE_ENV=production

CORS_ORIGIN=https://tu-frontend.vercel.app
```

**⚠️ IMPORTANTE:** Actualiza `CORS_ORIGIN` con la URL real de tu frontend cuando lo despliegues.

### 5. Selecciona el Plan

- **Free** (para pruebas) - Se duerme después de 15 min de inactividad
- **Starter** ($7/mes) - Recomendado para producción

### 6. Deploy

Click en **"Create Web Service"**

Render automáticamente:
1. Clonará tu repositorio
2. Instalará dependencias
3. Ejecutará las migraciones de Prisma
4. Compilará TypeScript
5. Iniciará el servidor

⏱️ El primer deploy toma ~3-5 minutos.

---

## 🔍 Verificación

Una vez desplegado, tu URL será algo como:
```
https://flova-backend.onrender.com
```

### Prueba el Health Check:

```bash
curl https://tu-app.onrender.com/api/health
```

### Prueba el Login:

```bash
curl -X POST https://tu-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"admin","password":"admin123"}'
```

---

## 🔑 Credenciales de Prueba

Ya están cargadas en la base de datos:

- **Admin:** `admin` / `admin123`
- **Paciente:** `1234567890` / `password123`
- **Médico:** `1111111111` / `password123`

---

## 📊 Endpoints Disponibles

24 endpoints listos para usar. Ver `COLECCION_INSOMNIA_COMPLETA.md` para detalles.

---

## 🐛 Problemas Comunes

### El servicio se duerme (Plan Free)
- Normal en el plan gratuito
- Primera petición después de dormir tarda 30-60 segundos
- Solución: Upgrade a plan Starter ($7/mes)

### Error de conexión a base de datos
- Verifica que `DATABASE_URL` esté correcta
- Debe incluir `?sslmode=require` al final

### CORS Error en el frontend
- Actualiza `CORS_ORIGIN` con la URL real de tu frontend
- Redeploy después de cambiar la variable

---

## 🎉 ¡Listo!

Tu backend está desplegado y listo para conectar con el frontend.

**Siguiente paso:** Actualiza la URL del backend en tu frontend (Flova_front).
