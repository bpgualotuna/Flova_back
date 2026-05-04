# 📘 GUÍA COMPLETA - SISTEMA DE GESTIÓN DE CITAS MÉDICAS

## 📋 ÍNDICE

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Flujo de Usuario](#2-flujo-de-usuario)
3. [Roles y Permisos](#3-roles-y-permisos)
4. [Reglas de Negocio](#4-reglas-de-negocio)
5. [Estructura del Frontend](#5-estructura-del-frontend)
6. [Credenciales de Prueba](#6-credenciales-de-prueba)
7. [Instalación y Ejecución](#7-instalación-y-ejecución)

---

## 1. RESUMEN DEL SISTEMA

Sistema web para gestión de citas médicas con tres tipos de usuarios: Pacientes, Médicos y Administradores.

### Tecnologías Frontend
- **Framework:** React 18 + TypeScript
- **UI:** Material-UI (MUI) v7
- **Estado:** Redux Toolkit + RTK Query
- **Routing:** React Router v6
- **Validación:** Zod + React Hook Form
- **Alertas:** SweetAlert2

### Funcionalidades Principales
- ✅ Registro y autenticación de usuarios
- ✅ Gestión de roles (Admin, Médico, Paciente)
- ✅ Reserva de citas con selección de terapia y médico
- ✅ Validación de anticipación mínima (>24 horas)
- ✅ Gestión de terapias (Admin)
- ✅ Gestión de usuarios (Admin)
- ✅ Visualización de citas (Médico)
- ✅ Historial de citas (Paciente)

---

## 2. FLUJO DE USUARIO

### 2.1 Flujo de Registro

```
1. Usuario accede a /register
2. Completa formulario:
   - Nombre completo
   - Cédula (único)
   - Email (único)
   - Teléfono
   - Tipo de seguro (dropdown: ninguno, IESS, ejército, policía, ISSFA, ISSPOL, privado)
   - Contraseña
3. Sistema valida datos
4. Crea usuario con rol "paciente" por defecto
5. Redirige a /login
```

### 2.2 Flujo de Login

```
1. Usuario accede a /login
2. Ingresa cédula y contraseña
3. Sistema valida credenciales
4. Genera token de sesión
5. Redirige según rol:
   - Admin → /dashboard
   - Médico → /medico/citas
   - Paciente → /dashboard
```

### 2.3 Flujo de Reserva de Cita (Paciente)

```
PASO 1: Selección de Terapia (/terapias)
├─ Muestra grid de terapias disponibles
├─ Cada card muestra: nombre, descripción, especialidad, duración, precio
├─ Usuario selecciona una terapia
└─ Guarda en sessionStorage: selectedTerapia

PASO 2: Selección de Médico (/seleccion-medico)
├─ Filtra médicos por especialidad de la terapia
├─ Muestra cards con: nombre, especialidad, calificación, horarios
├─ Usuario selecciona un médico
└─ Guarda en sessionStorage: selectedMedico

PASO 3: Selección de Fecha y Hora (/calendario)
├─ Muestra próximos 7 días
├─ Usuario selecciona una fecha
├─ Sistema consulta horarios disponibles del médico
├─ Filtra horarios con >24 horas de anticipación
├─ Usuario selecciona hora
└─ Guarda en sessionStorage: appointmentData (fecha, hora, medicoId, terapiaId)

PASO 4: Información Médica (/formulario-cita)
├─ Usuario describe síntomas (mínimo 10 caracteres)
├─ Indica si tiene exámenes médicos
├─ Opcionalmente sube archivos de exámenes
└─ Actualiza sessionStorage: appointmentData (síntomas, tieneExamenes)

PASO 5: Confirmación (/confirmacion)
├─ Muestra resumen completo:
│  ├─ Datos del paciente
│  ├─ Terapia seleccionada
│  ├─ Médico seleccionado
│  ├─ Fecha y hora
│  └─ Información médica
├─ Usuario confirma
├─ Sistema valida reglas de negocio
├─ Crea la cita
├─ Limpia sessionStorage
└─ Redirige a /mis-citas
```

### 2.4 Flujo de Gestión de Citas (Paciente)

```
1. Usuario accede a /mis-citas
2. Sistema muestra:
   - Próximas citas (pendientes/confirmadas)
   - Historial de citas (completadas/canceladas)
3. Para cada cita puede:
   - Ver detalles
   - Cancelar (si >24 horas de anticipación)
```

### 2.5 Flujo de Gestión de Citas (Médico)

```
1. Médico accede a /medico/citas
2. Sistema muestra:
   - Citas del día
   - Próximas citas
   - Historial
3. Para cada cita puede:
   - Ver detalles del paciente
   - Ver síntomas y exámenes
   - Marcar como completada
   - Agregar notas
```

### 2.6 Flujo de Administración (Admin)

```
GESTIÓN DE USUARIOS (/admin/usuarios)
├─ Ver lista de todos los usuarios
├─ Filtrar por rol
├─ Buscar por nombre, cédula o email
├─ Editar usuario (cambiar rol, datos)
└─ Eliminar usuario

GESTIÓN DE TERAPIAS (/admin/terapias)
├─ Ver lista de terapias
├─ Crear nueva terapia
├─ Editar terapia existente
├─ Activar/Desactivar terapia
└─ Eliminar terapia
```

---

## 3. ROLES Y PERMISOS

### 3.1 Paciente

**Permisos:**
- ✅ Ver y editar su perfil
- ✅ Reservar citas
- ✅ Ver sus citas
- ✅ Cancelar sus citas (>24h anticipación)
- ❌ No puede acceder a rutas de admin o médico

**Rutas Permitidas:**
- `/dashboard`
- `/terapias`
- `/seleccion-medico`
- `/calendario`
- `/formulario-cita`
- `/confirmacion`
- `/mis-citas`
- `/perfil`

### 3.2 Médico

**Permisos:**
- ✅ Ver y editar su perfil
- ✅ Ver sus citas asignadas
- ✅ Ver detalles de pacientes (solo de sus citas)
- ✅ Marcar citas como completadas
- ✅ Agregar notas a citas
- ❌ No puede reservar citas
- ❌ No puede acceder a rutas de admin

**Rutas Permitidas:**
- `/dashboard`
- `/medico/citas`
- `/perfil`

### 3.3 Admin

**Permisos:**
- ✅ Gestión completa de usuarios
- ✅ Gestión completa de terapias
- ✅ Ver todas las citas del sistema
- ✅ Ver estadísticas generales
- ✅ Cambiar roles de usuarios
- ✅ Activar/Desactivar terapias

**Rutas Permitidas:**
- `/dashboard`
- `/admin/usuarios`
- `/admin/terapias`
- `/perfil`

---

## 4. REGLAS DE NEGOCIO

### 4.1 Registro de Usuario

1. **Cédula única:** No puede haber dos usuarios con la misma cédula
2. **Email único:** No puede haber dos usuarios con el mismo email
3. **Contraseña:** Mínimo 6 caracteres
4. **Rol por defecto:** Todos los nuevos usuarios son "paciente"
5. **Tipo de seguro:** Obligatorio seleccionar una opción

### 4.2 Reserva de Citas

1. **Anticipación mínima:** >24 horas
   - ❌ No se puede reservar para mañana si son las 18:00 de hoy
   - ✅ Se puede reservar para pasado mañana
   - **Nota:** Exactamente 24 horas NO es válido, debe ser MÁS de 24 horas

2. **Sin doble reserva:** Un paciente no puede tener dos citas en la misma fecha y hora
   - Aplica aunque sean diferentes terapias o médicos

3. **Médico por especialidad:** Solo se muestran médicos que pueden realizar la terapia seleccionada
   - Relación: `terapia.especialidad === medico.especialidad`

4. **Horarios disponibles:** Solo se muestran horarios que:
   - Cumplen con >24 horas de anticipación
   - No están ocupados por otra cita
   - Están dentro del horario de atención del médico

### 4.3 Cancelación de Citas

1. **Anticipación mínima:** >24 horas
   - ❌ No se puede cancelar una cita de mañana
   - ✅ Se puede cancelar una cita de pasado mañana

2. **Estados cancelables:** Solo citas con estado "pendiente" o "confirmada"
   - No se pueden cancelar citas "completadas" o ya "canceladas"

3. **Motivo obligatorio:** Se debe proporcionar un motivo de cancelación

### 4.4 Validaciones de Formularios

**Registro:**
- Nombre completo: Requerido, mínimo 3 caracteres
- Cédula: Requerido, 10 dígitos, único
- Email: Requerido, formato válido, único
- Teléfono: Requerido, 10 dígitos
- Tipo de seguro: Requerido
- Contraseña: Requerido, mínimo 6 caracteres

**Reserva de Cita:**
- Terapia: Requerida
- Médico: Requerido
- Fecha: Requerida, >24 horas
- Hora: Requerida, disponible
- Síntomas: Requerido, mínimo 10 caracteres

**Terapia (Admin):**
- Nombre: Requerido, mínimo 3 caracteres
- Descripción: Requerido, mínimo 10 caracteres
- Especialidad: Requerida
- Duración: Requerida, número positivo
- Precio: Requerido, número positivo

---

## 5. ESTRUCTURA DEL FRONTEND

### 5.1 Arquitectura de Carpetas

```
src/
├── app/
│   ├── router.tsx          # Configuración de rutas
│   ├── store.ts            # Store de Redux
│   ├── axiosClient.ts      # Cliente HTTP
│   └── theme/              # Tema de MUI
│       ├── index.ts
│       ├── colors.ts
│       └── typography.ts
│
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx    # HOC para rutas protegidas
│   │   └── RoleGuard.tsx         # HOC para validación de roles
│   └── layout/
│       └── MainLayout.tsx        # Layout principal con menú
│
├── contexts/
│   └── AuthContext.tsx     # Context de autenticación
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── therapies/
│   │   └── TherapySelectionPage.tsx
│   ├── appointments/
│   │   ├── DoctorSelectionPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── AppointmentFormPage.tsx
│   │   └── ConfirmationPage.tsx
│   ├── citas/
│   │   └── MyCitasPage.tsx
│   ├── medico/
│   │   └── MedicoCitasPage.tsx
│   ├── admin/
│   │   ├── UsersManagementPage.tsx
│   │   └── TherapiesManagementPage.tsx
│   └── profile/
│       └── ProfilePage.tsx
│
├── services/
│   ├── authService.ts      # API de autenticación
│   ├── citasApi.ts         # API de citas (RTK Query)
│   ├── medicosApi.ts       # API de médicos (RTK Query)
│   ├── terapiasApi.ts      # API de terapias (RTK Query)
│   └── mocks/              # Datos mock para desarrollo
│       ├── usuariosMock.ts
│       ├── medicosMock.ts
│       ├── terapiasMock.ts
│       └── citasMock.ts
│
├── types/
│   └── index.ts            # Tipos TypeScript
│
├── utils/
│   └── citasValidations.ts # Validaciones de reglas de negocio
│
├── App.tsx
└── main.tsx
```

### 5.2 Tipos Principales

```typescript
// Usuario
interface User {
  id: number | string;
  cedula: string;
  fullName: string;
  email: string;
  telefono: string;
  tipoSeguro: TipoSeguro;
  role: 'admin' | 'medico' | 'paciente';
}

// Terapia
interface Terapia {
  id: number | string;
  nombre: string;
  descripcion: string;
  especialidad: string;
  duracion: number;  // minutos
  precio: number;
  imagen: string;
  activa: boolean;
}

// Médico
interface Medico {
  id: number | string;
  userId: number | string;
  fullName: string;
  especialidad: string;
  numeroLicencia: string;
  calificacion: number;
  pacientesAtendidos: number;
  horarioAtencion: HorarioAtencion[];
}

// Cita
interface Cita {
  id: number | string;
  pacienteId: number | string;
  medicoId: number | string;
  terapiaId: number | string;
  fecha: string;  // YYYY-MM-DD
  hora: string;   // HH:mm
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  sintomas: string;
  tieneExamenes: boolean;
  examenes?: string[];
  motivoCancelacion?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 5.3 Gestión de Estado

**Redux Store:**
```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean
  },
  citasApi: {
    // Cache de RTK Query
  },
  medicosApi: {
    // Cache de RTK Query
  },
  terapiasApi: {
    // Cache de RTK Query
  }
}
```

**SessionStorage (flujo de reserva):**
```typescript
{
  selectedTerapia: Terapia,
  selectedMedico: Medico,
  appointmentData: {
    terapiaId: number,
    medicoId: number,
    fecha: string,
    hora: string,
    sintomas: string,
    tieneExamenes: boolean,
    examenes: string[]
  }
}
```

---

## 6. CREDENCIALES DE PRUEBA

### 6.1 Usuarios de Prueba

**Paciente:**
- Cédula: `1234567890`
- Contraseña: `password123`
- Nombre: Juan Pérez

**Médicos:**

1. Dr. Carlos Mendoza (Fisioterapia)
   - Cédula: `1111111111`
   - Contraseña: `medico123`

2. Dra. María González (Terapia Ocupacional)
   - Cédula: `0987654321`
   - Contraseña: `medico123`

3. Dr. Roberto Silva (Psicología)
   - Cédula: `1122334455`
   - Contraseña: `medico123`

**Administrador:**
- Cédula: `admin`
- Contraseña: `admin123`
- Nombre: Administrador del Sistema

### 6.2 Terapias de Ejemplo

1. **Fisioterapia Deportiva**
   - Especialidad: Fisioterapia
   - Duración: 60 min
   - Precio: $45.00

2. **Rehabilitación Post-Quirúrgica**
   - Especialidad: Fisioterapia
   - Duración: 75 min
   - Precio: $65.00

3. **Terapia Ocupacional Pediátrica**
   - Especialidad: Terapia Ocupacional
   - Duración: 45 min
   - Precio: $50.00

4. **Terapia Cognitivo-Conductual**
   - Especialidad: Psicología
   - Duración: 60 min
   - Precio: $55.00

---

## 7. INSTALACIÓN Y EJECUCIÓN

### 7.1 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git

### 7.2 Instalación

```bash
# Clonar repositorio
git clone <url-repositorio>
cd flova_front

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 7.3 Variables de Entorno

```env
# .env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Ser Salud
```

### 7.4 Ejecución en Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:5173
```

### 7.5 Compilación para Producción

```bash
# Compilar
npm run build

# Vista previa de producción
npm run preview
```

### 7.6 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo
  "build": "tsc && vite build",     // Compilar
  "preview": "vite preview",        // Vista previa
  "lint": "eslint .",               // Linter
  "type-check": "tsc --noEmit"      // Verificar tipos
}
```

---

## 📝 NOTAS IMPORTANTES

### Limitaciones Actuales (Mocks)

1. **Horarios disponibles:** Se generan aleatoriamente con `Math.random()`
2. **Persistencia:** Los datos se pierden al recargar (no hay backend)
3. **Validación de 24 horas:** Funciona correctamente en lógica, pero puede tener problemas de caché en UI
4. **Imágenes:** URLs de placeholder (picsum.photos)

### Pendiente para Backend

1. ✅ Implementar validación de >24 horas en servidor
2. ✅ Implementar gestión real de horarios disponibles
3. ✅ Implementar subida de archivos de exámenes
4. ✅ Implementar notificaciones por email/SMS
5. ✅ Implementar sistema de recordatorios

### Recomendaciones

1. **Seguridad:** Implementar JWT en backend
2. **Validación:** Validar en servidor todas las reglas de negocio
3. **Zona horaria:** Considerar zona horaria del usuario
4. **Escalabilidad:** Usar base de datos con índices apropiados
5. **Testing:** Implementar tests unitarios y de integración

---

**Versión:** 2.0  
**Última actualización:** Mayo 2026  
**Estado:** Frontend completo, Backend pendiente
