# 🏥 Flova Backend - Sistema de Gestión de Citas Médicas

Backend completo desarrollado con Express + TypeScript + Prisma + PostgreSQL

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Migraciones y Seed](#migraciones-y-seed)
5. [Ejecución](#ejecución)
6. [Endpoints de la API](#endpoints-de-la-api)
7. [Credenciales de Prueba](#credenciales-de-prueba)
8. [Reglas de Negocio](#reglas-de-negocio)

---

## 🔧 REQUISITOS PREVIOS

- **Node.js** 18+ 
- **PostgreSQL** 14+ instalado y corriendo
- **npm** o **yarn**

---

## 📦 INSTALACIÓN

```bash
# 1. Navegar a la carpeta del backend
cd Flova_back

# 2. Instalar dependencias
npm install
```

---

## ⚙️ CONFIGURACIÓN

### 1. Base de Datos PostgreSQL

Asegúrate de tener PostgreSQL corriendo en tu máquina local con estas credenciales:

```
Usuario: postgres
Contraseña: bpg2000
Puerto: 5432
Base de datos: flova
```

**Crear la base de datos:**

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE flova;

# Salir
\q
```

### 2. Variables de Entorno

El archivo `.env` ya está configurado con:

```env
DATABASE_URL=postgresql://postgres:bpg2000@localhost:5432/flova
JWT_SECRET=flova_secret_key_super_segura_2026_medical_system
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 🗄️ MIGRACIONES Y SEED

### 1. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 2. Ejecutar Migraciones

```bash
npx prisma migrate dev --name init
```

Esto creará todas las tablas en la base de datos.

### 3. Poblar con Datos de Prueba (Seed)

```bash
npm run prisma:seed
```

Esto creará:
- ✅ 1 Administrador
- ✅ 3 Pacientes
- ✅ 4 Médicos (con horarios de atención)
- ✅ 6 Terapias
- ✅ 3 Citas de ejemplo

---

## 🚀 EJECUCIÓN

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

El servidor estará corriendo en: **http://localhost:3000**

### Modo Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar
npm start
```

---

## 📡 ENDPOINTS DE LA API

### Health Check

```
GET /api/health
```

### Autenticación

```
POST /api/auth/register    # Registrar nuevo usuario (paciente)
POST /api/auth/login       # Iniciar sesión
GET  /api/auth/me          # Obtener usuario actual (requiere token)
```

### Terapias

```
GET    /api/therapies         # Listar terapias activas (público)
GET    /api/therapies/:id     # Obtener terapia por ID (público)
POST   /api/therapies         # Crear terapia (Admin)
PUT    /api/therapies/:id     # Actualizar terapia (Admin)
DELETE /api/therapies/:id     # Desactivar terapia (Admin)
```

Las mismas rutas están disponibles bajo el alias `/api/terapias`. El listado
acepta `specialty` (o `especialidad`) y `active` (o `activa`); por defecto solo
devuelve terapias activas. Una terapia inactiva no se puede asociar a una cita
nueva. La eliminación es lógica para conservar las citas relacionadas.

### Médicos

```
GET /api/medicos                          # Obtener todos los médicos
GET /api/medicos/:id                      # Obtener médico por ID
GET /api/medicos/especialidad/:especialidad  # Filtrar por especialidad
```

### Citas

```
GET    /api/citas                      # Obtener citas (filtradas por rol)
GET    /api/citas/:id                  # Obtener cita por ID
POST   /api/citas                      # Crear cita (Paciente)
PUT    /api/citas/:id                  # Actualizar cita (Médico/Admin)
DELETE /api/citas/:id                  # Cancelar cita (Paciente)
GET    /api/citas/horarios-disponibles # Obtener horarios disponibles
```

**Query params para horarios disponibles:**
```
?medicoId=1&fecha=2026-05-05
```

### Usuarios

```
GET    /api/users          # Obtener todos los usuarios (Admin)
GET    /api/users/:id      # Obtener usuario por ID
PUT    /api/users/:id      # Actualizar usuario
DELETE /api/users/:id      # Eliminar usuario (Admin)
```

---

## 🔑 CREDENCIALES DE PRUEBA

### Administrador
```
Cédula: admin
Contraseña: admin123
```

### Paciente
```
Cédula: 1234567890
Contraseña: password123
Nombre: Juan Pérez García
```

### Médicos

**Dr. Carlos Mendoza (Fisioterapia)**
```
Cédula: 1111111111
Contraseña: password123
Horario: Lunes a Viernes, 08:00 - 16:00
```

**Dra. María González (Terapia Ocupacional)**
```
Cédula: 2222222222
Contraseña: password123
Horario: Lunes a Viernes, 09:00 - 17:00
```

**Dr. Roberto Silva (Psicología)**
```
Cédula: 3333333333
Contraseña: password123
Horario: Lunes a Viernes, 10:00 - 18:00
```

**Dra. Ana Martínez (Fisioterapia)**
```
Cédula: 4444444444
Contraseña: password123
Horario: Lunes a Viernes, 14:00 - 20:00
```

---

## 📋 REGLAS DE NEGOCIO

### Reserva de Citas

1. **Anticipación mínima: 12 horas** (AJUSTADO desde 24h)
   - ❌ No se puede reservar para mañana si son las 18:00 de hoy
   - ✅ Se puede reservar si hay más de 12 horas de diferencia

2. **Sin doble reserva**
   - Un paciente no puede tener dos citas en la misma fecha y hora
   - Aplica aunque sean diferentes terapias o médicos

3. **Horarios disponibles**
   - Solo se muestran horarios dentro del horario de atención del médico
   - Solo horarios que cumplen con >12 horas de anticipación
   - Solo horarios no ocupados por otra cita

### Cancelación de Citas

1. **Anticipación mínima: 24 horas**
   - ❌ No se puede cancelar una cita de mañana
   - ✅ Se puede cancelar una cita de pasado mañana

2. **Estados cancelables**
   - Solo citas con estado "pendiente" o "confirmada"
   - No se pueden cancelar citas "completadas" o ya "canceladas"

3. **Motivo obligatorio**
   - Se debe proporcionar un motivo de cancelación

---

## 🧪 PROBAR CON INSOMNIA/POSTMAN

### 1. Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "1234567890",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "cedula": "1234567890",
    "fullName": "Juan Pérez García",
    "role": "paciente"
  }
}
```

### 2. Obtener Terapias

```http
GET http://localhost:3000/api/terapias
```

### 3. Obtener Médicos por Especialidad

```http
GET http://localhost:3000/api/medicos/especialidad/Fisioterapia
```

### 4. Obtener Horarios Disponibles

```http
GET http://localhost:3000/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-05
```

### 5. Crear Cita

```http
POST http://localhost:3000/api/citas
Authorization: Bearer <tu_token_aqui>
Content-Type: application/json

{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-05",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla derecha después de correr",
  "tieneExamenes": false
}
```

### 6. Obtener Mis Citas

```http
GET http://localhost:3000/api/citas
Authorization: Bearer <tu_token_aqui>
```

### 7. Cancelar Cita

```http
DELETE http://localhost:3000/api/citas/1
Authorization: Bearer <tu_token_aqui>
Content-Type: application/json

{
  "motivo": "Tengo un compromiso urgente"
}
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Ver base de datos con Prisma Studio
npm run prisma:studio

# Regenerar cliente de Prisma
npm run prisma:generate

# Crear nueva migración
npm run prisma:migrate

# Resetear base de datos (CUIDADO: borra todo)
npx prisma migrate reset

# Ver logs de desarrollo
npm run dev
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
Flova_back/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── seed.ts             # Datos de prueba
├── src/
│   ├── controllers/        # Lógica de negocio
│   │   ├── auth.controller.ts
│   │   ├── citas.controller.ts
│   │   ├── medicos.controller.ts
│   │   └── terapias.controller.ts
│   ├── middlewares/        # Middlewares
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── roleGuard.ts
│   ├── routes/             # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── citas.routes.ts
│   │   ├── medicos.routes.ts
│   │   ├── terapias.routes.ts
│   │   └── users.routes.ts
│   ├── utils/              # Utilidades
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── validators.ts
│   ├── prisma.ts           # Cliente de Prisma
│   └── index.ts            # Punto de entrada
├── .env                    # Variables de entorno
├── .env.example            # Ejemplo de variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔗 CONECTAR CON EL FRONTEND

El frontend debe configurar la URL del backend en su archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

El backend ya está configurado para aceptar peticiones desde `http://localhost:5173` (puerto por defecto de Vite).

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `flova` creada
- [ ] Dependencias instaladas (`npm install`)
- [ ] Cliente de Prisma generado (`npx prisma generate`)
- [ ] Migraciones ejecutadas (`npx prisma migrate dev`)
- [ ] Seed ejecutado (`npm run prisma:seed`)
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Health check funcionando (http://localhost:3000/api/health)
- [ ] Login funcionando con credenciales de prueba

---

## 🐛 TROUBLESHOOTING

### Error: "Can't reach database server"

```bash
# Verificar que PostgreSQL esté corriendo
# Windows:
services.msc  # Buscar PostgreSQL

# Linux/Mac:
sudo service postgresql status
```

### Error: "Database 'flova' does not exist"

```bash
# Crear la base de datos manualmente
psql -U postgres
CREATE DATABASE flova;
\q
```

### Error: "Port 3000 already in use"

```bash
# Cambiar el puerto en .env
PORT=3001
```

### Error en migraciones

```bash
# Resetear y volver a migrar
npx prisma migrate reset
npx prisma migrate dev --name init
npm run prisma:seed
```

---

## 📞 SOPORTE

Para problemas o preguntas, revisar:
- `BACKEND_TECHNICAL_SPECIFICATION.md`
- `GUIA_COMPLETA_SISTEMA.md`
- Logs del servidor en la consola

---

**Versión:** 1.0  
**Última actualización:** Mayo 2026  
**Estado:** ✅ Producción Ready
