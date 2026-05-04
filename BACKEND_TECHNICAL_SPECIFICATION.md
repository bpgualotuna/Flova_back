# 🔧 ESPECIFICACIONES TÉCNICAS DEL BACKEND

## Sistema de Gestión de Citas Médicas - API REST con Express

---

## 📋 ÍNDICE

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Base de Datos](#3-base-de-datos)
4. [Endpoints de la API](#4-endpoints-de-la-api)
5. [Autenticación y Seguridad](#5-autenticación-y-seguridad)
6. [Reglas de Negocio](#6-reglas-de-negocio)
7. [Validaciones](#7-validaciones)
8. [Instalación y Configuración](#8-instalación-y-configuración)

---

## 1. STACK TECNOLÓGICO

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Base de Datos:** PostgreSQL 14+ o MySQL 8+
- **ORM:** Prisma o Sequelize
- **Autenticación:** JWT (jsonwebtoken)
- **Validación:** Joi o Zod
- **Hash de contraseñas:** bcrypt
- **CORS:** cors
- **Variables de entorno:** dotenv

### Dependencias Recomendadas

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",              // PostgreSQL
    "mysql2": "^3.3.0",           // MySQL (alternativa)
    "@prisma/client": "^5.0.0",   // ORM
    "jsonwebtoken": "^9.0.0",     // JWT
    "bcrypt": "^5.1.0",           // Hash
    "joi": "^17.9.0",             // Validación
    "cors": "^2.8.5",             // CORS
    "dotenv": "^16.0.3",          // Variables de entorno
    "morgan": "^1.10.0",          // Logger
    "helmet": "^7.0.0"            // Seguridad
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "nodemon": "^2.0.22",
    "typescript": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0"
  }
}
```

---

## 2. ESTRUCTURA DEL PROYECTO

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de BD
│   │   └── jwt.js               # Configuración JWT
│   ├── controllers/
│   │   ├── authController.js    # Login, registro
│   │   ├── citasController.js   # CRUD de citas
│   │   ├── medicosController.js # Gestión de médicos
│   │   ├── terapiasController.js # Gestión de terapias
│   │   └── usersController.js   # Gestión de usuarios
│   ├── middlewares/
│   │   ├── auth.js              # Verificación JWT
│   │   ├── roleGuard.js         # Verificación de roles
│   │   ├── validator.js         # Validación de datos
│   │   └── errorHandler.js      # Manejo de errores
│   ├── models/
│   │   ├── User.js
│   │   ├── Medico.js
│   │   ├── Terapia.js
│   │   ├── Cita.js
│   │   └── HorarioAtencion.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── citas.routes.js
│   │   ├── medicos.routes.js
│   │   ├── terapias.routes.js
│   │   └── users.routes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── citasService.js
│   │   └── emailService.js
│   ├── utils/
│   │   ├── validators.js        # Validaciones de negocio
│   │   └── helpers.js
│   ├── app.js                   # Configuración de Express
│   └── server.js                # Punto de entrada
├── prisma/
│   └── schema.prisma            # Schema de Prisma
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. BASE DE DATOS

### 3.1 Diagrama de Relaciones

```
users (1) ──────< (N) citas
  │                    │
  │                    │
  └─> (1:1) medicos    │
        │              │
        │              │
        └──────────────┘
        
terapias (1) ──────< (N) citas

medicos (1) ──────< (N) horarios_atencion
```

### 3.2 Tablas SQL

#### Tabla: users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  cedula VARCHAR(10) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  telefono VARCHAR(10),
  tipo_seguro VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'paciente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CHECK (role IN ('paciente', 'medico', 'admin')),
  CHECK (tipo_seguro IN ('ninguno', 'iess', 'ejercito', 'policia', 'issfa', 'isspol', 'privado'))
);

CREATE INDEX idx_users_cedula ON users(cedula);
CREATE INDEX idx_users_role ON users(role);
```

#### Tabla: medicos

```sql
CREATE TABLE medicos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  numero_licencia VARCHAR(50) UNIQUE NOT NULL,
  calificacion DECIMAL(2,1) DEFAULT 0.0,
  pacientes_atendidos INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (calificacion >= 0 AND calificacion <= 5)
);

CREATE INDEX idx_medicos_especialidad ON medicos(especialidad);
```

#### Tabla: horarios_atencion

```sql
CREATE TABLE horarios_atencion (
  id SERIAL PRIMARY KEY,
  medico_id INTEGER NOT NULL,
  dia_semana INTEGER NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
  CHECK (dia_semana >= 0 AND dia_semana <= 6),
  CHECK (hora_inicio < hora_fin)
);

CREATE INDEX idx_horarios_medico ON horarios_atencion(medico_id);
```

#### Tabla: terapias

```sql
CREATE TABLE terapias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  duracion INTEGER NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  imagen VARCHAR(255),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CHECK (duracion > 0),
  CHECK (precio >= 0)
);

CREATE INDEX idx_terapias_especialidad ON terapias(especialidad);
CREATE INDEX idx_terapias_activa ON terapias(activa);
```

#### Tabla: citas

```sql
CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL,
  medico_id INTEGER NOT NULL,
  terapia_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  sintomas TEXT NOT NULL,
  tiene_examenes BOOLEAN DEFAULT FALSE,
  examenes TEXT[],
  motivo_cancelacion TEXT,
  notas_medico TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (paciente_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
  FOREIGN KEY (terapia_id) REFERENCES terapias(id) ON DELETE CASCADE,
  CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  UNIQUE (medico_id, fecha, hora)
);

CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_medico ON citas(medico_id);
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);
```

### 3.3 Schema de Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          Int      @id @default(autoincrement())
  cedula      String   @unique @db.VarChar(10)
  username    String   @unique @db.VarChar(50)
  password    String   @db.VarChar(255)
  fullName    String   @map("full_name") @db.VarChar(100)
  email       String?  @unique @db.VarChar(100)
  telefono    String?  @db.VarChar(10)
  tipoSeguro  String   @map("tipo_seguro") @db.VarChar(20)
  role        String   @default("paciente") @db.VarChar(20)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  medico      Medico?
  citas       Cita[]   @relation("PacienteCitas")
  
  @@index([cedula])
  @@index([role])
  @@map("users")
}

model Medico {
  id                  Int                 @id @default(autoincrement())
  userId              Int                 @unique @map("user_id")
  especialidad        String              @db.VarChar(100)
  numeroLicencia      String              @unique @map("numero_licencia") @db.VarChar(50)
  calificacion        Decimal             @default(0.0) @db.Decimal(2, 1)
  pacientesAtendidos  Int                 @default(0) @map("pacientes_atendidos")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  horariosAtencion    HorarioAtencion[]
  citas               Cita[]
  
  @@index([especialidad])
  @@map("medicos")
}

model HorarioAtencion {
  id          Int      @id @default(autoincrement())
  medicoId    Int      @map("medico_id")
  diaSemana   Int      @map("dia_semana")
  horaInicio  String   @map("hora_inicio") @db.Time
  horaFin     String   @map("hora_fin") @db.Time
  createdAt   DateTime @default(now()) @map("created_at")
  
  medico      Medico   @relation(fields: [medicoId], references: [id], onDelete: Cascade)
  
  @@index([medicoId])
  @@map("horarios_atencion")
}

model Terapia {
  id            Int      @id @default(autoincrement())
  nombre        String   @db.VarChar(100)
  descripcion   Text
  especialidad  String   @db.VarChar(100)
  duracion      Int
  precio        Decimal  @db.Decimal(10, 2)
  imagen        String?  @db.VarChar(255)
  activa        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  citas         Cita[]
  
  @@index([especialidad])
  @@index([activa])
  @@map("terapias")
}

model Cita {
  id                  Int       @id @default(autoincrement())
  pacienteId          Int       @map("paciente_id")
  medicoId            Int       @map("medico_id")
  terapiaId           Int       @map("terapia_id")
  fecha               DateTime  @db.Date
  hora                String    @db.Time
  estado              String    @default("pendiente") @db.VarChar(20)
  sintomas            Text
  tieneExamenes       Boolean   @default(false) @map("tiene_examenes")
  examenes            String[]
  motivoCancelacion   String?   @map("motivo_cancelacion") @db.Text
  notasMedico         String?   @map("notas_medico") @db.Text
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  paciente            User      @relation("PacienteCitas", fields: [pacienteId], references: [id], onDelete: Cascade)
  medico              Medico    @relation(fields: [medicoId], references: [id], onDelete: Cascade)
  terapia             Terapia   @relation(fields: [terapiaId], references: [id], onDelete: Cascade)
  
  @@unique([medicoId, fecha, hora])
  @@index([pacienteId])
  @@index([medicoId])
  @@index([fecha])
  @@index([estado])
  @@map("citas")
}
```

---

## 4. ENDPOINTS DE LA API

### 4.1 Autenticación

#### POST /api/auth/register
Registrar nuevo usuario (paciente).

**Request:**
```json
{
  "cedula": "1234567890",
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "0987654321",
  "tipoSeguro": "iess",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "cedula": "1234567890",
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "role": "paciente"
  }
}
```

**Validaciones:**
- Cédula única
- Email único (si se proporciona)
- Contraseña mínimo 6 caracteres
- Tipo de seguro válido

---

#### POST /api/auth/login
Iniciar sesión.

**Request:**
```json
{
  "cedula": "1234567890",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "cedula": "1234567890",
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "role": "paciente"
  }
}
```

**Errores:**
- 401: Credenciales inválidas
- 404: Usuario no encontrado

---

### 4.2 Terapias

#### GET /api/terapias
Obtener todas las terapias activas.

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "Fisioterapia Deportiva",
    "descripcion": "Tratamiento especializado...",
    "especialidad": "Fisioterapia",
    "duracion": 60,
    "precio": 45.00,
    "imagen": "https://...",
    "activa": true
  }
]
```

---

#### POST /api/terapias
Crear nueva terapia (Admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "nombre": "Terapia Ocupacional",
  "descripcion": "Descripción...",
  "especialidad": "Terapia Ocupacional",
  "duracion": 45,
  "precio": 50.00,
  "imagen": "https://..."
}
```

**Response (201):**
```json
{
  "message": "Terapia creada exitosamente",
  "terapia": { ... }
}
```

---

### 4.3 Médicos

#### GET /api/medicos/especialidad/:especialidad
Obtener médicos por especialidad.

**Response (200):**
```json
[
  {
    "id": 1,
    "fullName": "Dr. Carlos Mendoza",
    "especialidad": "Fisioterapia",
    "numeroLicencia": "MED-12345",
    "calificacion": 4.8,
    "pacientesAtendidos": 245,
    "horarioAtencion": [
      {
        "diaSemana": 1,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      }
    ]
  }
]
```

---

### 4.4 Citas

#### GET /api/horarios-disponibles
Obtener horarios disponibles.

**Query Params:**
- `medicoId`: ID del médico
- `fecha`: Fecha en formato YYYY-MM-DD

**Response (200):**
```json
[
  {
    "fecha": "2026-05-03",
    "hora": "08:00",
    "disponible": true,
    "medicoId": 1
  },
  {
    "fecha": "2026-05-03",
    "hora": "09:00",
    "disponible": true,
    "medicoId": 1
  }
]
```

**Lógica:**
```sql
SELECT 
  h.fecha,
  h.hora,
  CASE 
    WHEN CONCAT(h.fecha, ' ', h.hora) > DATE_ADD(NOW(), INTERVAL 24 HOUR)
      AND NOT EXISTS (
        SELECT 1 FROM citas c 
        WHERE c.medico_id = h.medico_id 
          AND c.fecha = h.fecha 
          AND c.hora = h.hora
          AND c.estado IN ('pendiente', 'confirmada')
      )
    THEN TRUE
    ELSE FALSE
  END AS disponible
FROM horarios h
WHERE h.medico_id = ? AND h.fecha = ?
```

---

#### POST /api/citas
Crear nueva cita (Paciente).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-03",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla derecha",
  "tieneExamenes": false
}
```

**Validaciones:**
1. Anticipación >24 horas
2. Sin doble reserva
3. Horario disponible
4. Médico y terapia existen

**Response (201):**
```json
{
  "message": "Cita creada exitosamente",
  "cita": {
    "id": 1,
    "pacienteId": 1,
    "medicoId": 1,
    "terapiaId": 1,
    "fecha": "2026-05-03",
    "hora": "10:00",
    "estado": "pendiente"
  }
}
```

**Errores:**
- 400: Validación fallida
- 401: No autenticado
- 409: Conflicto (doble reserva)

---

#### GET /api/citas/paciente/:id
Obtener citas de un paciente.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "fecha": "2026-05-03",
    "hora": "10:00",
    "estado": "pendiente",
    "terapia": {
      "nombre": "Fisioterapia Deportiva",
      "duracion": 60,
      "precio": 45.00
    },
    "medico": {
      "fullName": "Dr. Carlos Mendoza",
      "especialidad": "Fisioterapia"
    }
  }
]
```

---

#### DELETE /api/citas/:id
Cancelar cita (Paciente).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "motivo": "Tengo un compromiso urgente"
}
```

**Validaciones:**
1. Anticipación >24 horas
2. Estado: pendiente o confirmada
3. Usuario es el paciente de la cita

**Response (200):**
```json
{
  "message": "Cita cancelada exitosamente"
}
```

**Errores:**
- 400: No se puede cancelar (< 24 horas)
- 403: No autorizado
- 404: Cita no encontrada

---

## 5. AUTENTICACIÓN Y SEGURIDAD

### 5.1 JWT

**Configuración:**
```javascript
// src/config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '7d'
};
```

**Middleware de Autenticación:**
```javascript
// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
```

**Middleware de Roles:**
```javascript
// src/middlewares/roleGuard.js
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    next();
  };
};

module.exports = roleGuard;
```

### 5.2 Hash de Contraseñas

```javascript
const bcrypt = require('bcrypt');

// Al registrar
const hashedPassword = await bcrypt.hash(password, 10);

// Al login
const isValid = await bcrypt.compare(password, user.password);
```

---

## 6. REGLAS DE NEGOCIO

### 6.1 Validación de Anticipación Mínima

```javascript
// src/utils/validators.js
const validarAnticipacionMinima = (fecha, hora) => {
  const ahora = new Date();
  const fechaCita = new Date(`${fecha}T${hora}:00`);
  const diferenciaHoras = (fechaCita - ahora) / (1000 * 60 * 60);
  
  if (diferenciaHoras <= 24) {
    throw new Error('Las citas deben reservarse con más de 24 horas de anticipación');
  }
};
```

### 6.2 Validación de Doble Reserva

```javascript
const validarDobleReserva = async (pacienteId, fecha, hora) => {
  const citaExistente = await prisma.cita.findFirst({
    where: {
      pacienteId,
      fecha,
      hora,
      estado: { in: ['pendiente', 'confirmada'] }
    }
  });
  
  if (citaExistente) {
    throw new Error('Ya tienes una cita reservada en esta fecha y hora');
  }
};
```

---

## 7. VALIDACIONES

### 7.1 Schema de Validación (Joi)

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  cedula: Joi.string().length(10).required(),
  fullName: Joi.string().min(3).required(),
  email: Joi.string().email().optional(),
  telefono: Joi.string().length(10).required(),
  tipoSeguro: Joi.string().valid('ninguno', 'iess', 'ejercito', 'policia', 'issfa', 'isspol', 'privado').required(),
  password: Joi.string().min(6).required()
});

const citaSchema = Joi.object({
  medicoId: Joi.number().required(),
  terapiaId: Joi.number().required(),
  fecha: Joi.date().required(),
  hora: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  sintomas: Joi.string().min(10).required(),
  tieneExamenes: Joi.boolean().required()
});
```

---

## 8. INSTALACIÓN Y CONFIGURACIÓN

### 8.1 Inicializar Proyecto

```bash
# Crear directorio
mkdir backend
cd backend

# Inicializar npm
npm init -y

# Instalar dependencias
npm install express pg @prisma/client jsonwebtoken bcrypt joi cors dotenv morgan helmet

# Instalar dev dependencies
npm install -D prisma nodemon typescript @types/express @types/node

# Inicializar Prisma
npx prisma init
```

### 8.2 Variables de Entorno

```env
# .env
NODE_ENV=development
PORT=3000

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/gestion_citas"

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 8.3 Scripts de package.json

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### 8.4 Configuración de Express

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const citasRoutes = require('./routes/citas.routes');
const medicosRoutes = require('./routes/medicos.routes');
const terapiasRoutes = require('./routes/terapias.routes');
const usersRoutes = require('./routes/users.routes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/terapias', terapiasRoutes);
app.use('/api/users', usersRoutes);

// Manejo de errores
app.use(errorHandler);

module.exports = app;
```

```javascript
// src/server.js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
```

### 8.5 Migrar Base de Datos

```bash
# Generar migración
npx prisma migrate dev --name init

# Generar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio (GUI)
npx prisma studio
```

---

## 📝 NOTAS FINALES

### Prioridades de Implementación

1. ✅ **Fase 1:** Autenticación y usuarios
2. ✅ **Fase 2:** Terapias y médicos
3. ✅ **Fase 3:** Citas y horarios
4. ✅ **Fase 4:** Validaciones de negocio
5. ✅ **Fase 5:** Notificaciones y extras

### Consideraciones de Seguridad

- Usar HTTPS en producción
- Implementar rate limiting
- Validar todos los inputs
- Sanitizar datos de usuario
- Implementar CSRF protection
- Logs de auditoría

### Testing

- Tests unitarios con Jest
- Tests de integración
- Tests de endpoints con Supertest

---

**Versión:** 1.0  
**Última actualización:** Mayo 2026  
**Estado:** Especificaciones completas para implementación
