# 🚀 INSTRUCCIONES RÁPIDAS - FLOVA BACKEND

## ✅ ESTADO ACTUAL

El backend está **100% funcional** y listo para usar.

---

## 📋 COMANDOS ESENCIALES

### 1. Iniciar el Servidor

```bash
cd Flova_back
npm run dev
```

El servidor estará en: **http://localhost:3000**

### 2. Ver Base de Datos (Prisma Studio)

```bash
npm run prisma:studio
```

Abre una interfaz visual en: **http://localhost:5555**

### 3. Resetear Base de Datos (si es necesario)

```bash
npx prisma migrate reset
npm run prisma:seed
```

---

## 🔑 CREDENCIALES DE PRUEBA

### Admin
- **Cédula:** `admin`
- **Contraseña:** `admin123`

### Paciente
- **Cédula:** `1234567890`
- **Contraseña:** `password123`

### Médico (Fisioterapia)
- **Cédula:** `1111111111`
- **Contraseña:** `password123`

---

## 📡 ENDPOINTS PRINCIPALES

### Health Check
```
GET http://localhost:3000/api/health
```

### Login
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "cedula": "1234567890",
  "password": "password123"
}
```

### Obtener Terapias
```http
GET http://localhost:3000/api/terapias
```

### Obtener Médicos por Especialidad
```http
GET http://localhost:3000/api/medicos/especialidad/Fisioterapia
```

### Crear Cita (requiere token)
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

### Obtener Horarios Disponibles
```http
GET http://localhost:3000/api/citas/horarios-disponibles?medicoId=1&fecha=2026-05-10
```

---

## 🔗 CONECTAR CON EL FRONTEND

En el frontend (Flova_front), asegúrate de tener en el archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📊 DATOS DISPONIBLES

El seed creó:
- ✅ 1 Administrador
- ✅ 3 Pacientes
- ✅ 4 Médicos (Fisioterapia, Terapia Ocupacional, Psicología)
- ✅ 6 Terapias
- ✅ 3 Citas de ejemplo
- ✅ Horarios de atención configurados

---

## ⚠️ REGLAS DE NEGOCIO IMPORTANTES

### Reserva de Citas
- **Anticipación mínima:** 12 horas (AJUSTADO desde 24h)
- **Sin doble reserva:** Un paciente no puede tener dos citas en la misma fecha/hora
- **Horarios disponibles:** Solo se muestran horarios dentro del horario de atención del médico

### Cancelación de Citas
- **Anticipación mínima:** 24 horas
- **Estados cancelables:** Solo "pendiente" o "confirmada"
- **Motivo obligatorio:** Se debe proporcionar un motivo

---

## 🛠️ TROUBLESHOOTING

### El servidor no inicia
```bash
# Verificar que PostgreSQL esté corriendo
# Verificar que la base de datos 'flova' exista
# Reinstalar dependencias
npm install
```

### Error de conexión a la base de datos
```bash
# Verificar el archivo .env
DATABASE_URL=postgresql://postgres:bpg2000@localhost:5432/flova
```

### Resetear todo
```bash
npx prisma migrate reset
npm run prisma:seed
npm run dev
```

---

## 📁 ARCHIVOS IMPORTANTES

- `src/index.ts` - Punto de entrada del servidor
- `prisma/schema.prisma` - Esquema de base de datos
- `prisma/seed.ts` - Datos de prueba
- `.env` - Variables de entorno
- `README.md` - Documentación completa

---

## ✨ PRÓXIMOS PASOS

1. ✅ Backend funcionando
2. ⏭️ Conectar el frontend
3. ⏭️ Probar flujo completo de reserva de citas
4. ⏭️ Probar con Insomnia/Postman

---

**¡El backend está listo para usar! 🎉**
