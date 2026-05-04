# 🔥 EJEMPLOS PARA INSOMNIA/POSTMAN

Copia y pega estos ejemplos directamente en Insomnia o Postman.

---

## 1️⃣ HEALTH CHECK

```http
GET http://localhost:3000/api/health
```

---

## 2️⃣ REGISTRO DE USUARIO

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "cedula": "1726543210",
  "fullName": "Pedro Sánchez Morales",
  "email": "pedro.sanchez@email.com",
  "telefono": "0987654325",
  "tipoSeguro": "iess",
  "password": "password123"
}
```

---

## 3️⃣ LOGIN (PACIENTE)

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "1234567890",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**⚠️ IMPORTANTE:** Guarda el `token` para usarlo en las siguientes peticiones.

---

## 4️⃣ LOGIN (ADMIN)

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "admin",
  "password": "admin123"
}
```

---

## 5️⃣ LOGIN (MÉDICO)

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "1111111111",
  "password": "password123"
}
```

---

## 6️⃣ OBTENER USUARIO ACTUAL

```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer <TU_TOKEN_AQUI>
```

---

## 7️⃣ OBTENER TODAS LAS TERAPIAS

```http
GET http://localhost:3000/api/terapias
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "nombre": "Fisioterapia Deportiva",
    "descripcion": "Tratamiento especializado para lesiones deportivas...",
    "especialidad": "Fisioterapia",
    "duracion": 60,
    "precio": "45.00",
    "imagen": "https://picsum.photos/seed/fisio1/400/300",
    "activa": true
  }
]
```

---

## 8️⃣ OBTENER TERAPIA POR ID

```http
GET http://localhost:3000/api/terapias/1
```

---

## 9️⃣ CREAR TERAPIA (ADMIN)

```http
POST http://localhost:3000/api/terapias
Authorization: Bearer <TOKEN_DE_ADMIN>
Content-Type: application/json

{
  "nombre": "Masaje Terapéutico",
  "descripcion": "Masaje especializado para aliviar tensiones musculares y mejorar la circulación",
  "especialidad": "Fisioterapia",
  "duracion": 45,
  "precio": 40.00,
  "imagen": "https://picsum.photos/seed/masaje/400/300"
}
```

---

## 🔟 OBTENER TODOS LOS MÉDICOS

```http
GET http://localhost:3000/api/medicos
```

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
      }
    ]
  }
]
```

---

## 1️⃣1️⃣ OBTENER MÉDICOS POR ESPECIALIDAD

```http
GET http://localhost:3000/api/medicos/especialidad/Fisioterapia
```

---

## 1️⃣2️⃣ OBTENER HORARIOS DISPONIBLES

```http
GET http://localhost:3000/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-10
Authorization: Bearer <TU_TOKEN>
```

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

## 1️⃣3️⃣ CREAR CITA (PACIENTE)

```http
POST http://localhost:3000/api/citas
Authorization: Bearer <TOKEN_DE_PACIENTE>
Content-Type: application/json

{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-10",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla derecha después de correr. Necesito evaluación para continuar entrenamiento.",
  "tieneExamenes": false
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

## 1️⃣4️⃣ OBTENER MIS CITAS (PACIENTE)

```http
GET http://localhost:3000/api/citas
Authorization: Bearer <TOKEN_DE_PACIENTE>
```

---

## 1️⃣5️⃣ OBTENER CITA POR ID

```http
GET http://localhost:3000/api/citas/1
Authorization: Bearer <TU_TOKEN>
```

---

## 1️⃣6️⃣ ACTUALIZAR CITA (MÉDICO)

```http
PUT http://localhost:3000/api/citas/1
Authorization: Bearer <TOKEN_DE_MEDICO>
Content-Type: application/json

{
  "estado": "completada",
  "notasMedico": "Paciente presenta mejoría significativa. Se recomienda continuar con ejercicios en casa."
}
```

---

## 1️⃣7️⃣ CANCELAR CITA (PACIENTE)

```http
DELETE http://localhost:3000/api/citas/1
Authorization: Bearer <TOKEN_DE_PACIENTE>
Content-Type: application/json

{
  "motivo": "Tengo un compromiso urgente de trabajo"
}
```

---

## 1️⃣8️⃣ OBTENER TODOS LOS USUARIOS (ADMIN)

```http
GET http://localhost:3000/api/users
Authorization: Bearer <TOKEN_DE_ADMIN>
```

---

## 1️⃣9️⃣ ACTUALIZAR USUARIO

```http
PUT http://localhost:3000/api/users/2
Authorization: Bearer <TU_TOKEN>
Content-Type: application/json

{
  "fullName": "Juan Pérez García Actualizado",
  "email": "juan.nuevo@email.com",
  "telefono": "0987654399"
}
```

---

## 2️⃣0️⃣ CAMBIAR ROL DE USUARIO (ADMIN)

```http
PUT http://localhost:3000/api/users/2
Authorization: Bearer <TOKEN_DE_ADMIN>
Content-Type: application/json

{
  "role": "medico"
}
```

---

## 📝 NOTAS IMPORTANTES

### Headers Requeridos

Para endpoints protegidos, siempre incluir:
```
Authorization: Bearer <tu_token_aqui>
Content-Type: application/json
```

### Formato de Fechas y Horas

- **Fecha:** `YYYY-MM-DD` (ejemplo: `2026-05-10`)
- **Hora:** `HH:mm` (ejemplo: `10:00`)

### Tipos de Seguro Válidos

- `ninguno`
- `iess`
- `ejercito`
- `policia`
- `issfa`
- `isspol`
- `privado`

### Estados de Cita

- `pendiente` - Cita creada, esperando confirmación
- `confirmada` - Cita confirmada por el médico
- `completada` - Cita realizada
- `cancelada` - Cita cancelada

### Roles de Usuario

- `paciente` - Usuario normal que reserva citas
- `medico` - Médico que atiende citas
- `admin` - Administrador del sistema

---

## 🔥 FLUJO COMPLETO DE PRUEBA

### 1. Login como Paciente
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "1234567890",
  "password": "password123"
}
```

### 2. Ver Terapias Disponibles
```http
GET http://localhost:3000/api/terapias
```

### 3. Ver Médicos de Fisioterapia
```http
GET http://localhost:3000/api/medicos/especialidad/Fisioterapia
```

### 4. Ver Horarios Disponibles
```http
GET http://localhost:3000/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-10
Authorization: Bearer <tu_token>
```

### 5. Crear Cita
```http
POST http://localhost:3000/api/citas
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-10",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla derecha",
  "tieneExamenes": false
}
```

### 6. Ver Mis Citas
```http
GET http://localhost:3000/api/citas
Authorization: Bearer <tu_token>
```

---

## ✅ VERIFICACIÓN DE REGLAS DE NEGOCIO

### Probar Anticipación Mínima (12 horas)

❌ **Debe fallar:**
```http
POST http://localhost:3000/api/citas
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-02",
  "hora": "16:00",
  "sintomas": "Dolor en rodilla",
  "tieneExamenes": false
}
```

✅ **Debe funcionar:**
```http
POST http://localhost:3000/api/citas
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "medicoId": 1,
  "terapiaId": 1,
  "fecha": "2026-05-10",
  "hora": "10:00",
  "sintomas": "Dolor en rodilla",
  "tieneExamenes": false
}
```

---

**¡Listo para probar todos los endpoints! 🚀**
