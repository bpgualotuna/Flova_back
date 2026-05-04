# 🔥 COLECCIÓN COMPLETA DE ENDPOINTS - INSOMNIA

**24 Endpoints listos para copiar y pegar en Insomnia o Postman**

---

## 📌 CONFIGURACIÓN INICIAL

**Base URL:** `http://localhost:3000`

**Variables de entorno sugeridas:**
- `base_url`: `http://localhost:3000`
- `token_paciente`: (guardar después del login)
- `token_medico`: (guardar después del login)
- `token_admin`: (guardar después del login)

---

## 🔐 AUTENTICACIÓN (4 endpoints)

### 1. Health Check
```
GET {{base_url}}/api/health
```
**Sin body**

---

### 2. Registrar Usuario (Paciente)
```
POST {{base_url}}/api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "cedula": "1726543210",
  "fullName": "Pedro Sánchez Morales",
  "email": "pedro.sanchez@email.com",
  "telefono": "0987654325",
  "tipoSeguro": "iess",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 9,
    "cedula": "1726543210",
    "fullName": "Pedro Sánchez Morales",
    "email": "pedro.sanchez@email.com",
    "telefono": "0987654325",
    "tipoSeguro": "iess",
    "role": "paciente",
    "createdAt": "2026-05-02T04:00:00.000Z"
  }
}
```

---

### 3. Login
```
POST {{base_url}}/api/auth/login
Content-Type: application/json
```

**Body (Paciente):**
```json
{
  "cedula": "1234567890",
  "password": "password123"
}
```

**Body (Admin):**
```json
{
  "cedula": "admin",
  "password": "admin123"
}
```

**Body (Médico):**
```json
{
  "cedula": "1111111111",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNlZHVsYSI6IjEyMzQ1Njc4OTAiLCJyb2xlIjoicGFjaWVudGUiLCJmdWxsTmFtZSI6Ikp1YW4gUMOpcmV6IEdhcmPDrWEiLCJpYXQiOjE3MTQ2MjQ4MDAsImV4cCI6MTcxNTIyOTYwMH0.xxxxx",
  "user": {
    "id": 2,
    "cedula": "1234567890",
    "username": "1234567890",
    "fullName": "Juan Pérez García",
    "email": "juan.perez@email.com",
    "telefono": "0987654321",
    "tipoSeguro": "iess",
    "role": "paciente"
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `token` para usarlo en los siguientes endpoints.

---

### 4. Obtener Usuario Actual
```
GET {{base_url}}/api/auth/me
Authorization: Bearer {{token_paciente}}
```
**Sin body**

**Respuesta esperada:**
```json
{
  "id": 2,
  "cedula": "1234567890",
  "username": "1234567890",
  "fullName": "Juan Pérez García",
  "email": "juan.perez@email.com",
  "telefono": "0987654321",
  "tipoSeguro": "iess",
  "role": "paciente",
  "createdAt": "2026-05-02T03:00:00.000Z",
  "updatedAt": "2026-05-02T03:00:00.000Z",
  "medico": null
}
```

---

### 5. Cerrar Sesión (Logout)
```
POST {{base_url}}/api/auth/logout
Authorization: Bearer {{token_paciente}}
```
**Sin body**

**Respuesta esperada:**
```json
{
  "message": "Sesión cerrada exitosamente",
  "timestamp": "2026-05-04T04:35:00.000Z"
}
```

**Nota:** En una arquitectura JWT stateless, el logout se maneja principalmente en el frontend eliminando el token del almacenamiento local. Este endpoint sirve para:
- Registrar auditoría de cierre de sesión
- Invalidar tokens si se implementa una blacklist en el futuro
- Limpiar datos de sesión del servidor si existen

**Después del logout, debes:**
1. Eliminar el token del almacenamiento local en el frontend
2. Redirigir al usuario a la página de login
3. No usar más ese token para futuras peticiones

---

## 💊 TERAPIAS (5 endpoints)

### 6. Obtener Todas las Terapias
```
GET {{base_url}}/api/terapias
```
**Sin body**

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "nombre": "Fisioterapia Deportiva",
    "descripcion": "Tratamiento especializado para lesiones deportivas y recuperación de atletas. Incluye técnicas de rehabilitación avanzadas.",
    "especialidad": "Fisioterapia",
    "duracion": 60,
    "precio": "45.00",
    "imagen": "https://picsum.photos/seed/fisio1/400/300",
    "activa": true,
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T03:43:01.000Z"
  }
]
```

---

### 7. Obtener Terapias por Especialidad
```
GET {{base_url}}/api/terapias?especialidad=Fisioterapia
```
**Sin body**

---

### 8. Obtener Terapia por ID
```
GET {{base_url}}/api/terapias/1
```
**Sin body**

---

### 9. Crear Terapia (Admin)
```
POST {{base_url}}/api/terapias
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Masaje Terapéutico",
  "descripcion": "Masaje especializado para aliviar tensiones musculares y mejorar la circulación sanguínea",
  "especialidad": "Fisioterapia",
  "duracion": 45,
  "precio": 40.00,
  "imagen": "https://picsum.photos/seed/masaje/400/300"
}
```

**Respuesta esperada:**
```json
{
  "message": "Terapia creada exitosamente",
  "terapia": {
    "id": 7,
    "nombre": "Masaje Terapéutico",
    "descripcion": "Masaje especializado para aliviar tensiones musculares y mejorar la circulación sanguínea",
    "especialidad": "Fisioterapia",
    "duracion": 45,
    "precio": "40.00",
    "imagen": "https://picsum.photos/seed/masaje/400/300",
    "activa": true,
    "createdAt": "2026-05-02T04:00:00.000Z",
    "updatedAt": "2026-05-02T04:00:00.000Z"
  }
}
```

---

### 10. Actualizar Terapia (Admin)
```
PUT {{base_url}}/api/terapias/1
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Fisioterapia Deportiva Avanzada",
  "precio": 50.00,
  "activa": true
}
```

**Respuesta esperada:**
```json
{
  "message": "Terapia actualizada exitosamente",
  "terapia": {
    "id": 1,
    "nombre": "Fisioterapia Deportiva Avanzada",
    "descripcion": "Tratamiento especializado para lesiones deportivas...",
    "especialidad": "Fisioterapia",
    "duracion": 60,
    "precio": "50.00",
    "imagen": "https://picsum.photos/seed/fisio1/400/300",
    "activa": true,
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T04:05:00.000Z"
  }
}
```

---

### 11. Eliminar Terapia (Admin)
```
DELETE {{base_url}}/api/terapias/7
Authorization: Bearer {{token_admin}}
```
**Sin body**

**Respuesta esperada:**
```json
{
  "message": "Terapia eliminada exitosamente"
}
```

---

## 👨‍⚕️ MÉDICOS (3 endpoints)

### 12. Obtener Todos los Médicos
```
GET {{base_url}}/api/medicos
```
**Sin body**

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "userId": 5,
    "fullName": "Dr. Carlos Mendoza Silva",
    "cedula": "1111111111",
    "email": "carlos.mendoza@flova.com",
    "telefono": "0991111111",
    "especialidad": "Fisioterapia",
    "numeroLicencia": "MED-FIS-001",
    "calificacion": 4.8,
    "pacientesAtendidos": 245,
    "horarioAtencion": [
      {
        "diaSemana": 1,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      },
      {
        "diaSemana": 2,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      },
      {
        "diaSemana": 3,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      },
      {
        "diaSemana": 4,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      },
      {
        "diaSemana": 5,
        "horaInicio": "08:00",
        "horaFin": "16:00"
      }
    ]
  }
]
```

---

### 13. Obtener Médico por ID
```
GET {{base_url}}/api/medicos/1
```
**Sin body**

---

### 14. Obtener Médicos por Especialidad
```
GET {{base_url}}/api/medicos/especialidad/Fisioterapia
```
**Sin body**

**Otras especialidades disponibles:**
- `Fisioterapia`
- `Terapia Ocupacional`
- `Psicología`

---

## 📅 CITAS (6 endpoints)

### 15. Obtener Horarios Disponibles
```
GET {{base_url}}/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-10
Authorization: Bearer {{token_paciente}}
```
**Sin body**

**Query params:**
- `medicoId`: ID del médico (requerido)
- `fecha`: Fecha en formato YYYY-MM-DD (requerido)

**Respuesta esperada:**
```json
[
  {
    "fecha": "2026-05-10",
    "hora": "08:00",
    "disponible": true,
    "medicoId": 1
  },
  {
    "fecha": "2026-05-10",
    "hora": "08:30",
    "disponible": true,
    "medicoId": 1
  },
  {
    "fecha": "2026-05-10",
    "hora": "09:00",
    "disponible": false,
    "medicoId": 1
  }
]
```

---

### 16. Crear Cita (Paciente)
```
POST {{base_url}}/api/citas
Authorization: Bearer {{token_paciente}}
Content-Type: application/json
```

**Body:**
```json
{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-10",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla derecha después de correr. Necesito evaluación para continuar con mi entrenamiento deportivo.",
  "tieneExamenes": false
}
```

**Body con exámenes:**
```json
{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-10",
  "hora": "14:00",
  "sintomas": "Dolor crónico en espalda baja. Tengo radiografías recientes.",
  "tieneExamenes": true,
  "examenes": ["radiografia_lumbar.pdf", "resonancia_magnetica.pdf"]
}
```

**Respuesta esperada:**
```json
{
  "message": "Cita creada exitosamente",
  "cita": {
    "id": 4,
    "fecha": "2026-05-10",
    "hora": "10:00",
    "estado": "pendiente",
    "paciente": {
      "fullName": "Juan Pérez García",
      "cedula": "1234567890",
      "email": "juan.perez@email.com"
    },
    "medico": {
      "fullName": "Dr. Carlos Mendoza Silva",
      "especialidad": "Fisioterapia"
    },
    "terapia": {
      "nombre": "Fisioterapia Deportiva",
      "duracion": 60,
      "precio": 45
    }
  }
}
```

---

### 17. Obtener Mis Citas
```
GET {{base_url}}/api/citas
Authorization: Bearer {{token_paciente}}
```
**Sin body**

**Query params opcionales:**
- `estado`: Filtrar por estado (pendiente, confirmada, completada, cancelada)
- `fecha`: Filtrar por fecha (YYYY-MM-DD)

**Ejemplos:**
```
GET {{base_url}}/api/citas?estado=pendiente
GET {{base_url}}/api/citas?fecha=2026-05-10
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "pacienteId": 2,
    "medicoId": 1,
    "terapiaId": 1,
    "fecha": "2026-05-05",
    "hora": "10:00",
    "estado": "pendiente",
    "sintomas": "Dolor en rodilla derecha después de correr. Necesito evaluación para continuar entrenamiento.",
    "tieneExamenes": false,
    "examenes": [],
    "motivoCancelacion": null,
    "notasMedico": null,
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T03:43:01.000Z",
    "paciente": {
      "id": 2,
      "fullName": "Juan Pérez García",
      "cedula": "1234567890",
      "email": "juan.perez@email.com",
      "telefono": "0987654321",
      "tipoSeguro": "iess"
    },
    "medico": {
      "id": 1,
      "fullName": "Dr. Carlos Mendoza Silva",
      "especialidad": "Fisioterapia",
      "numeroLicencia": "MED-FIS-001",
      "calificacion": 4.8
    },
    "terapia": {
      "id": 1,
      "nombre": "Fisioterapia Deportiva",
      "descripcion": "Tratamiento especializado para lesiones deportivas...",
      "especialidad": "Fisioterapia",
      "duracion": 60,
      "precio": 45
    }
  }
]
```

---

### 18. Obtener Cita por ID
```
GET {{base_url}}/api/citas/1
Authorization: Bearer {{token_paciente}}
```
**Sin body**

---

### 19. Actualizar Cita (Médico/Admin)
```
PUT {{base_url}}/api/citas/1
Authorization: Bearer {{token_medico}}
Content-Type: application/json
```

**Body (Médico agrega notas):**
```json
{
  "notasMedico": "Paciente presenta mejoría significativa en la movilidad de la rodilla. Se recomienda continuar con ejercicios de fortalecimiento en casa y regresar en 2 semanas para evaluación."
}
```

**Body (Cambiar estado):**
```json
{
  "estado": "completada",
  "notasMedico": "Sesión completada exitosamente. Paciente responde bien al tratamiento."
}
```

**Respuesta esperada:**
```json
{
  "message": "Cita actualizada exitosamente",
  "cita": {
    "id": 1,
    "pacienteId": 2,
    "medicoId": 1,
    "terapiaId": 1,
    "fecha": "2026-05-05T00:00:00.000Z",
    "hora": "10:00",
    "estado": "completada",
    "sintomas": "Dolor en rodilla derecha...",
    "tieneExamenes": false,
    "examenes": [],
    "motivoCancelacion": null,
    "notasMedico": "Sesión completada exitosamente. Paciente responde bien al tratamiento.",
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T04:10:00.000Z"
  }
}
```

---

### 20. Cancelar Cita (Paciente)
```
DELETE {{base_url}}/api/citas/1
Authorization: Bearer {{token_paciente}}
Content-Type: application/json
```

**Body:**
```json
{
  "motivo": "Tengo un compromiso urgente de trabajo que no puedo posponer"
}
```

**Respuesta esperada:**
```json
{
  "message": "Cita cancelada exitosamente",
  "cita": {
    "id": 1,
    "pacienteId": 2,
    "medicoId": 1,
    "terapiaId": 1,
    "fecha": "2026-05-05T00:00:00.000Z",
    "hora": "10:00",
    "estado": "cancelada",
    "sintomas": "Dolor en rodilla derecha...",
    "tieneExamenes": false,
    "examenes": [],
    "motivoCancelacion": "Tengo un compromiso urgente de trabajo que no puedo posponer",
    "notasMedico": null,
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T04:15:00.000Z"
  }
}
```

---

## 👥 USUARIOS (4 endpoints)

### 21. Obtener Todos los Usuarios (Admin)
```
GET {{base_url}}/api/users
Authorization: Bearer {{token_admin}}
```
**Sin body**

**Query params opcionales:**
- `role`: Filtrar por rol (paciente, medico, admin)

**Ejemplo:**
```
GET {{base_url}}/api/users?role=medico
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "cedula": "admin",
    "username": "admin",
    "fullName": "Administrador del Sistema",
    "email": "admin@flova.com",
    "telefono": "0999999999",
    "tipoSeguro": "ninguno",
    "role": "admin",
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T03:43:01.000Z",
    "medico": null
  },
  {
    "id": 2,
    "cedula": "1234567890",
    "username": "1234567890",
    "fullName": "Juan Pérez García",
    "email": "juan.perez@email.com",
    "telefono": "0987654321",
    "tipoSeguro": "iess",
    "role": "paciente",
    "createdAt": "2026-05-02T03:43:01.000Z",
    "updatedAt": "2026-05-02T03:43:01.000Z",
    "medico": null
  }
]
```

---

### 22. Obtener Usuario por ID
```
GET {{base_url}}/api/users/2
Authorization: Bearer {{token_paciente}}
```
**Sin body**

**Nota:** Un usuario puede ver su propio perfil, o un admin puede ver cualquier usuario.

---

### 23. Actualizar Usuario
```
PUT {{base_url}}/api/users/2
Authorization: Bearer {{token_paciente}}
Content-Type: application/json
```

**Body (Usuario actualiza su perfil):**
```json
{
  "fullName": "Juan Pérez García Actualizado",
  "email": "juan.nuevo@email.com",
  "telefono": "0987654399",
  "tipoSeguro": "privado"
}
```

**Body (Admin cambia rol):**
```json
{
  "role": "medico"
}
```

**Body (Cambiar contraseña):**
```json
{
  "password": "nueva_password_segura_123"
}
```

**Respuesta esperada:**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": 2,
    "cedula": "1234567890",
    "username": "1234567890",
    "fullName": "Juan Pérez García Actualizado",
    "email": "juan.nuevo@email.com",
    "telefono": "0987654399",
    "tipoSeguro": "privado",
    "role": "paciente",
    "updatedAt": "2026-05-02T04:20:00.000Z"
  }
}
```

---

### 24. Eliminar Usuario (Admin)
```
DELETE {{base_url}}/api/users/9
Authorization: Bearer {{token_admin}}
```
**Sin body**

**Respuesta esperada:**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

---

## 📝 NOTAS IMPORTANTES

### **Headers Requeridos**

Para endpoints protegidos:
```
Authorization: Bearer <tu_token_aqui>
Content-Type: application/json
```

### **Formato de Datos**

- **Fecha:** `YYYY-MM-DD` (ejemplo: `2026-05-10`)
- **Hora:** `HH:mm` (ejemplo: `10:00`)
- **Cédula:** 10 dígitos o "admin"

### **Tipos de Seguro Válidos**

- `ninguno`
- `iess`
- `ejercito`
- `policia`
- `issfa`
- `isspol`
- `privado`

### **Estados de Cita**

- `pendiente` - Cita creada
- `confirmada` - Confirmada por médico
- `completada` - Cita realizada
- `cancelada` - Cita cancelada

### **Roles de Usuario**

- `paciente` - Usuario normal
- `medico` - Médico
- `admin` - Administrador

### **Especialidades Disponibles**

- `Fisioterapia`
- `Terapia Ocupacional`
- `Psicología`

---

## 🔥 FLUJO COMPLETO DE PRUEBA

### **1. Login como Paciente**
```
POST {{base_url}}/api/auth/login
Body: { "cedula": "1234567890", "password": "password123" }
```
→ Guardar el `token`

### **2. Ver Terapias**
```
GET {{base_url}}/api/terapias
```

### **3. Ver Médicos de Fisioterapia**
```
GET {{base_url}}/api/medicos/especialidad/Fisioterapia
```

### **4. Ver Horarios Disponibles**
```
GET {{base_url}}/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-10
Authorization: Bearer {{token}}
```

### **5. Crear Cita**
```
POST {{base_url}}/api/citas
Authorization: Bearer {{token}}
Body: { "medicoId": 1, "terapiaId": 1, "fecha": "2026-05-10", "hora": "10:00", "sintomas": "...", "tieneExamenes": false }
```

### **6. Ver Mis Citas**
```
GET {{base_url}}/api/citas
Authorization: Bearer {{token}}
```

### **7. Cancelar Cita**
```
DELETE {{base_url}}/api/citas/1
Authorization: Bearer {{token}}
Body: { "motivo": "..." }
```

---

## ✅ RESUMEN DE ENDPOINTS

| # | Método | Endpoint | Requiere Auth | Rol |
|---|--------|----------|---------------|-----|
| 1 | GET | `/api/health` | ❌ | - |
| 2 | POST | `/api/auth/register` | ❌ | - |
| 3 | POST | `/api/auth/login` | ❌ | - |
| 4 | GET | `/api/auth/me` | ✅ | Todos |
| 5 | POST | `/api/auth/logout` | ✅ | Todos |
| 6 | GET | `/api/terapias` | ❌ | - |
| 7 | GET | `/api/terapias?especialidad=X` | ❌ | - |
| 8 | GET | `/api/terapias/:id` | ❌ | - |
| 9 | POST | `/api/terapias` | ✅ | Admin |
| 10 | PUT | `/api/terapias/:id` | ✅ | Admin |
| 11 | DELETE | `/api/terapias/:id` | ✅ | Admin |
| 12 | GET | `/api/medicos` | ❌ | - |
| 13 | GET | `/api/medicos/:id` | ❌ | - |
| 14 | GET | `/api/medicos/especialidad/:esp` | ❌ | - |
| 15 | GET | `/api/citas/horarios-disponibles` | ✅ | Todos |
| 16 | POST | `/api/citas` | ✅ | Paciente |
| 17 | GET | `/api/citas` | ✅ | Todos |
| 18 | GET | `/api/citas/:id` | ✅ | Todos |
| 19 | PUT | `/api/citas/:id` | ✅ | Médico/Admin |
| 20 | DELETE | `/api/citas/:id` | ✅ | Paciente |
| 21 | GET | `/api/users` | ✅ | Admin |
| 22 | GET | `/api/users/:id` | ✅ | Usuario/Admin |
| 23 | PUT | `/api/users/:id` | ✅ | Usuario/Admin |
| 24 | DELETE | `/api/users/:id` | ✅ | Admin |

---

**Total: 24 endpoints**

**¡Listo para copiar y pegar en Insomnia! 🚀**
