# ESPECIFICACIONES TÉCNICAS DEL BACKEND - SISTEMA DE GESTIÓN DE RIESGOS

## 1. ARQUITECTURA Y TECNOLOGÍAS

### 1.1. Stack Tecnológico
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js con TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Cache**: Redis para optimización de rendimiento
- **Autenticación**: JWT + Autenticación de Dos Factores (2FA)
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Documentación**: OpenAPI/Swagger (implícito en estructura de rutas)

### 1.2. Estructura del Proyecto
```
gestion_riesgos_backend/
├── src/
│   ├── app.ts                    # Configuración principal de Express
│   ├── index.ts                  # Punto de entrada
│   ├── prisma.ts                 # Configuración de Prisma Client
│   ├── redisClient.ts           # Cliente Redis
│   ├── controllers/             # Controladores (lógica de negocio)
│   ├── middleware/              # Middleware (auth, audit, etc.)
│   ├── routes/                  # Definición de rutas
│   ├── services/                # Servicios (lógica reutilizable)
│   ├── utils/                   # Utilidades (jwt, password, azure, etc.)
│   └── scripts/                 # Scripts de mantenimiento
├── prisma/
│   ├── schema.prisma            # Esquema completo de la base de datos (~962 líneas)
│   └── seed.ts                  # Datos iniciales
├── package.json                 # Dependencias y scripts
└── .env                         # Variables de entorno
```

## 2. MODELO DE DATOS (PRISMA SCHEMA)

### 2.1. Modelos Principales

#### 2.1.1. Autenticación y Usuarios
```prisma
model Role {
  id          Int       @id @default(autoincrement())
  codigo      String    @unique
  nombre      String
  descripcion String?
  permisos    Json?     # Permisos personalizados por rol
  activo      Boolean?  @default(true)
  ambito      String    @default("OPERATIVO") @db.VarChar(20)
  usuarios    Usuario[]
}

model Usuario {
  id                    Int                       @id @default(autoincrement())
  nombre                String
  email                 String                    @unique
  password              String
  cargoId               Int?
  activo                Boolean                   @default(true)
  roleId                Int
  fotoPerfil            String?
  twoFactorEnabled      Boolean                   @default(false)
  twoFactorSecret       String?
  recoveryCodes         String[]                  # Códigos de respaldo hasheados
  twoFactorBackupUsed   Int                       @default(0)
  
  # Relaciones
  roleRelacion          Role                      @relation(fields: [roleId], references: [id])
  cargo                 Cargo?                    @relation(fields: [cargoId], references: [id])
  dispositivosConfiables DispositivoConfiable[]   @relation("UsuarioDispositivos")
  auditoriaAutenticacion AuditoriaAutenticacion[] @relation("UsuarioAuditoria")
}
```

#### 2.1.2. Gestión de Riesgos (Core Business)
```prisma
model Proceso {
  id                             Int                  @id @default(autoincrement())
  nombre                         String               @unique
  descripcion                    String?
  objetivo                       String?
  tipo                           String?
  responsableId                  Int?
  areaId                         Int?
  estado                         String               @default("borrador")
  activo                         Boolean              @default(true)
  residualModo                   String               @default("ESTANDAR") @db.VarChar(20)
  
  # Relaciones
  area                           Area?                @relation(fields: [areaId], references: [id])
  responsable                    Usuario?             @relation("ResponsableProceso", fields: [responsableId], references: [id])
  riesgos                        Riesgo[]
  responsables                   ProcesoResponsable[]
  participantes                  Usuario[]            @relation("Participantes")
}
```

#### 2.1.3. Riesgos y Evaluación
```prisma
model Riesgo {
  id                          Int                       @id @default(autoincrement())
  procesoId                   Int
  numero                      Int
  descripcion                 String
  clasificacion               String?                   # Consecuencia (positiva/negativa)
  numeroIdentificacion        String?
  
  # Tipologías jerárquicas
  tipologiaTipo1Id            Int?                     # Tipo principal
  tipologiaTipo2Id            Int?                     # Subtipo
  tipologiaTipo3Id            Int?                     # Tipología extendida nivel 3
  tipologiaTipo4Id            Int?                     # Tipología extendida nivel 4
  
  # Relaciones
  proceso                     Proceso                   @relation(fields: [procesoId], references: [id])
  evaluacion                  EvaluacionRiesgo?
  causas                      CausaRiesgo[]
  controles                   Control[]
  planesAccion                PlanAccion[]
  priorizacion                PriorizacionRiesgo?
}
```

#### 2.1.4. Evaluación de Riesgos
```prisma
model EvaluacionRiesgo {
  id                   Int      @id @default(autoincrement())
  riesgoId             Int      @unique
  
  # Impactos (1-5)
  impactoPersonas      Int
  impactoLegal         Int
  impactoAmbiental     Int
  impactoProcesos      Int
  impactoReputacion    Int
  impactoEconomico     Int
  impactoTecnologico   Int
  
  # Evaluación
  probabilidad         Int
  impactoGlobal        Int
  impactoMaximo        Int
  riesgoInherente      Int
  nivelRiesgo          String
  
  # Residual
  probabilidadResidual Int?
  impactoResidual      Int?
  riesgoResidual       Float?
  nivelRiesgoResidual  String?
}
```

#### 2.1.5. Causas y Controles
```prisma
model CausaRiesgo {
  id                 Int                   @id @default(autoincrement())
  riesgoId           Int
  descripcion        String
  fuenteCausa        String?
  frecuencia         String?
  seleccionada       Boolean               @default(false)
  
  # Relaciones
  riesgo             Riesgo                @relation(fields: [riesgoId], references: [id])
  controles          ControlRiesgo[]       # Controles normalizados
  planesAccion       PlanAccion[]
  alertas            AlertaVencimiento[]
}

model ControlRiesgo {
  id                                  Int          @id @default(autoincrement())
  causaRiesgoId                       Int
  descripcion                         String
  
  # Evaluación del control
  aplicabilidad                       Int?
  cobertura                           Int?
  facilidadUso                        Int?
  segregacion                         Int?
  naturaleza                          Int?
  desviaciones                        Int?
  puntajeControl                      Int?
  
  # Modo estratégico (CWR)
  tipoMitigacionAnexo                 String?      @db.VarChar(20)
  maPresupuesto                       String?      @db.VarChar(20)
  maActitud                           String?      @db.VarChar(20)
  maCapacitacion                      String?      @db.VarChar(20)
  maDocumentacion                     String?      @db.VarChar(20)
  maMonitoreo                         String?      @db.VarChar(20)
  maPuntajeAy                         Float?
  maEvaluacionAz                      String?      @db.VarChar(64)
  maPorcentajeBa                      Float?
  
  # Relaciones
  causaRiesgo                         CausaRiesgo  @relation(fields: [causaRiesgoId], references: [id])
  planAccionVinculado                 PlanAccion?  @relation("ControlVinculadoPlan")
}
```

### 2.2. Modelos de Configuración

#### 2.2.1. Configuración de Calificación
```prisma
model CalificacionInherenteConfig {
  id              Int                           @id @default(autoincrement())
  nombre          String                        @unique @default("Configuración Principal")
  activa          Boolean                       @default(true)
  
  # Componentes
  excepciones     ExcepcionCalificacion[]
  formulaBase     FormulaCalificacionInherente?
  rangos          RangoCalificacion[]
  reglaAgregacion ReglaAgregacionCalificacion?
}

model ConfiguracionResidual {
  id                                  Int                        @id @default(autoincrement())
  nombre                              String                     @unique
  activa                              Boolean                    @default(true)
  
  # Componentes
  opcionesCriterios                   OpcionCriterioResidual[]
  pesosCriterios                     PesoCriterioResidual[]
  rangosEvaluacion                    RangoEvaluacionResidual[]
  rangosNivelRiesgo                   RangoNivelRiesgoResidual[]
  tablaMitigacion                     TablaMitigacionResidual[]
}
```

#### 2.2.2. Catálogos y Tipologías
```prisma
model TipoRiesgo {
  id          Int             @id @default(autoincrement())
  nombre      String          @unique
  descripcion String?
  riesgos     Riesgo[]
  subtipos    SubtipoRiesgo[]
}

model SubtipoRiesgo {
  id                   Int                        @id @default(autoincrement())
  nombre               String
  descripcion          String?
  tipoRiesgoId         Int
  riesgos              Riesgo[]
  tipoRiesgo           TipoRiesgo                 @relation(fields: [tipoRiesgoId], references: [id])
  tipologiasExtendidas TipologiaRiesgoExtendida[]
}

model TipologiaRiesgoExtendida {
  id          Int            @id @default(autoincrement())
  subtipoId   Int?
  nivel       Int
  nombre      String
  descripcion String?
  activo      Boolean        @default(true)
  riesgos3    Riesgo[]       @relation("Tipologia3")
  riesgos4    Riesgo[]       @relation("Tipologia4")
  subtipo     SubtipoRiesgo? @relation(fields: [subtipoId], references: [id])
}
```

### 2.3. Modelos de Auditoría y Seguridad

#### 2.3.1. Autenticación de Dos Factores
```prisma
model DispositivoConfiable {
  id                Int      @id @default(autoincrement())
  usuarioId         Int
  deviceFingerprint String
  deviceName        String?
  ipAddress         String?
  userAgent         String?
  navegador         String?
  sistemaOperativo  String?
  activo            Boolean  @default(true)
  createdAt         DateTime @default(now())
  expiresAt         DateTime
  lastUsedAt        DateTime @default(now())
  
  @@unique([usuarioId, deviceFingerprint])
  @@map("DispositivosConfiables")
}

model AuditoriaAutenticacion {
  id        Int      @id @default(autoincrement())
  usuarioId Int?
  email     String
  evento    String
  exitoso   Boolean
  metodo    String?
  ipAddress String?
  userAgent String?
  detalles  Json?
  createdAt DateTime @default(now())
}
```

#### 2.3.2. Auditoría de Operaciones
```prisma
model HistorialEvento {
  id                Int      @id @default(autoincrement())
  fecha             DateTime @default(now())
  usuarioId         Int?
  usuarioEmail      String?  @db.VarChar(255)
  usuarioNombre     String?  @db.VarChar(255)
  procesoId         Int?
  procesoNombre     String?  @db.VarChar(255)
  modulo            String   @db.VarChar(100)
  pagina            String   @db.VarChar(150)
  seccion           String?  @db.VarChar(150)
  entidadTipo       String   @db.VarChar(100)
  entidadId         Int?
  accion            String   @db.VarChar(50)
  descripcion       String?
  valoresAnteriores Json?
  valoresNuevos     Json?
}

model AuditLog {
  id              Int      @id @default(autoincrement())
  usuarioId       Int
  usuarioNombre   String
  usuarioEmail    String
  usuarioRole     String
  accion          String   @db.VarChar(20)
  tabla           String   @db.VarChar(100)
  registroId      Int?
  registroDesc    String?
  cambios         Json?
  datosAnteriores Json?
  datosNuevos     Json?
  ipAddress       String?  @db.VarChar(50)
  userAgent       String?
  createdAt       DateTime @default(now())
}
```

## 3. SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN

### 3.1. Roles y Permisos

#### 3.1.1. Roles Definidos
- **admin**: Acceso completo al sistema
- **dueño_procesos**: Dueño de procesos específicos
- **gerente**: Gerente de área/departamento
- **supervisor**: Supervisor de equipos
- **gerente_general**: Gerente general (acceso similar a admin)
- **manager**: Manager con permisos extendidos
- **usuario**: Usuario básico (rol por defecto)

#### 3.1.2. Ámbitos de Rol
- **SISTEMA**: Roles administrativos (admin, gerente_general)
- **OPERATIVO**: Roles operativos (dueño_procesos, gerente, supervisor, manager)
- **USUARIO**: Rol básico

### 3.2. Autenticación de Dos Factores (2FA)

#### 3.2.1. Componentes del Sistema 2FA
1. **TOTP (Time-based One-Time Password)**: Compatible con Google Authenticator
2. **Dispositivos Confiables**: Registro de dispositivos para evitar 2FA repetido
3. **Códigos de Respaldo**: 10 códigos de respaldo hasheados
4. **Auditoría**: Registro completo de eventos de autenticación

#### 3.2.2. Flujo de Autenticación
```
1. Login con usuario/contraseña
2. Verificar si usuario tiene 2FA habilitado
3. Si 2FA habilitado:
   a. Verificar si dispositivo es confiable
   b. Si dispositivo confiable → Login directo
   c. Si dispositivo no confiable → Solicitar código 2FA
4. Si 2FA no habilitado pero requerido globalmente → Forzar configuración
5. Generar token JWT con información de rol
```

#### 3.2.3. Configuración Global 2FA
```typescript
{
  habilitado: boolean,      // 2FA habilitado globalmente
  obligatorio: boolean,      // 2FA obligatorio para todos
  ventanaTiempo: number,    // Ventana de tiempo para TOTP (segundos)
  maxIntentos: number,      // Máximo de intentos fallidos
  diasDispositivos: number  // Días de validez de dispositivos confiables
}
```

### 3.3. Middleware de Seguridad

#### 3.3.1. Auth Middleware
```typescript
// Verificación JWT obligatoria en todas las rutas excepto públicas
app.use(authMiddleware({ 
  required: true, 
  publicPaths: ['/api/health', '/api/auth/login'] 
}));

// Middleware por roles
export function requireRoles(allowedRoles: string[]) {
  // Verifica que el usuario tenga uno de los roles permitidos
  // Admins, gerente_general y manager siempre tienen acceso
}
```

#### 3.3.2. Headers de Seguridad
```typescript
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api-erm.comware.com.ec']
    }
  }
}));
```

## 4. ARQUITECTURA DE LA API

### 4.1. Estructura de Rutas
```
/api
├── /auth                    # Autenticación
│   ├── /login              # Login básico
│   ├── /2fa                # Endpoints 2FA
│   └── /me                 # Información del usuario actual
├── /usuarios               # Gestión de usuarios
├── /procesos               # Gestión de procesos
├── /riesgos                # Gestión de riesgos
├── /evaluaciones           # Evaluación de riesgos
├── /catalogos              # Catálogos (tipologías, objetivos, etc.)
├── /controles-riesgo       # Controles normalizados
├── /incidencias            # Gestión de incidencias
├── /planes-accion          # Planes de acción
├── /calificacion-inherente # Configuración de calificación
├── /configuracion-residual # Configuración residual
├── /ia                     # Integración con IA
├── /audit                  # Auditoría del sistema
└── /utilidades            # Utilidades varias
```

### 4.2. Controladores Principales

#### 4.2.1. Auth Controller (`auth.controller.ts`)
- `login()`: Autenticación básica con soporte para 2FA
- `getMe()`: Información del usuario actual (con cache Redis)
- `updateMe()`: Actualización de perfil de usuario
- `complete2FALogin()`: Login completo después de verificar 2FA

#### 4.2.2. Riesgos Controller (`riesgos.controller.ts`) - ~1400 líneas
- `getRiesgos()`: Listado paginado con filtros avanzados
- `getRiesgoById()`: Detalle de riesgo individual
- `createRiesgo()`: Creación con validación de número único
- `updateRiesgo()`: Actualización con recálculo automático
- `deleteRiesgo()`: Eliminación con invalidación de cache
- `getPuntosMapa()`: Datos para mapa de calor de riesgos
- `recalcularRiesgoInherenteDesdeCausas()`: Recalculo automático

#### 4.2.3. Otros Controladores Relevantes
- `auth-2fa.controller.ts`: Gestión completa de 2FA
- `procesos.controller.ts`: Gestión de procesos
- `incidencias.controller.ts`: Gestión de incidencias
- `planes-accion.controller.ts`: Gestión de planes de acción
- `control-riesgo.controller.ts`: Controles normalizados

### 4.3. Servicios Especializados

#### 4.3.1. TwoFactor Service (`twoFactor.service.ts`)
```typescript
class TwoFactorService {
  static generateSecret(email: string): Promise<{ secret: string; qrCodeUrl: string }>
  static verifyToken(secret: string, token: string): boolean
  static generateRecoveryCodes(count: number): { plain: string[]; hashed: string[] }
  static verifyRecoveryCode(hashedCodes: string[], inputCode: string): number
  static generateDeviceFingerprint(req: Request): string
  static isDeviceTrusted(usuarioId: number, fingerprint: string): Promise<boolean>
  static trustDevice(usuarioId: number, req: Request, dias: number): Promise<void>
  static logAuthEvent(data: AuthEventData): Promise<void>
}
```

#### 4.3.2. Servicios de Cálculo
- `recalculoResidual.service.ts`: Recalculo de riesgo residual
- `estrategicoResidual.engine.ts`: Motor de cálculo estratégico (CWR)
- `configuracionResidual.service.ts`: Gestión de configuración residual
- `alertas-vencimiento.service.ts`: Gestión de alertas de vencimiento

## 5. OPTIMIZACIÓN Y PERFORMANCE

### 5.1. Sistema de Cache con Redis

#### 5.1.1. Estrategias de Cache
```typescript
// Cache de listados paginados
const cacheKey = `riesgos:proceso:${procesoId}:page:${pageNum}:size:${take}:causas:${includeCausasFlag}:clas:${clasificacion}`;

// Cache de usuario actual (60 segundos)
const cacheKey = `auth:me:${userId}`;

// Cache de puntos del mapa (90 segundos)
const cacheKey = `mapa:puntos:${procesoId}:clas:${clasificacion}`;
```

#### 5.1.2. Invalidación de Cache
- Al crear/actualizar/eliminar riesgos → Invalidar cache del proceso
- Al actualizar perfil de usuario → Invalidar cache del usuario
- Al cambiar configuración → Invalidar cache relevante

### 5.2. Optimizaciones de Base de Datos

#### 5.2.1. Índices en Modelos Críticos
```prisma
model Riesgo {
  // ...
  @@index([procesoId])
  @@index([createdAt])
  @@index([procesoId, createdAt(sort: Desc)])
  @@index([clasificacion])
  @@index([tipologiaTipo1Id])
  @@index([tipologiaTipo2Id])
  @@index([objetivoId])
  @@index([procesoId, clasificacion])
  @@index([updatedAt])
}
```

#### 5.2.2. Queries Optimizadas
- Uso de `take` y `skip` para paginación eficiente
- Selección explícita de campos necesarios (`select`)
- Queries paralelas con `Promise.all()` cuando es posible
- Limitación de relaciones anidadas para evitar N+1

### 5.3. Compresión y Headers HTTP
```typescript
app.use(compression({
  filter: (req, res) => !req.headers['x-no-compression'],
  level: 6
}));

// Headers de seguridad y performance
res.setHeader('Cache-Control', 'private, max-age=60');
res.setHeader('Content-Type', 'application/json; charset=utf-8');
```

## 6. SISTEMA DE AUDITORÍA

### 6.1. Tipos de Auditoría

#### 6.1.1. Auditoría de Autenticación
- Login exitoso/fallido
- Eventos de 2FA
- Uso de códigos de respaldo
- Registro de dispositivos confiables

#### 6.1.2. Auditoría de Operaciones
- Creación/actualización/eliminación de entidades
- Cambios en configuración del sistema
- Acciones administrativas
- Exportación de datos

#### 6.1.3. Auditoría de Negocio
- Cambios en evaluación de riesgos
- Modificación de controles
- Actualización de planes de acción
- Cambios en priorización

### 6.2. Middleware de Auditoría Automática
```typescript
// Middleware que captura automáticamente cambios en entidades
app.use(auditMiddleware());

// Registro manual en controladores
await prisma.historialEvento.create({
  data: {
    usuarioId: userId,
    usuarioEmail: userEmail,
    procesoId: procesoId,
    modulo: 'riesgos',
    pagina: 'edicion',
    seccion: 'evaluacion',
    entidadTipo: 'Riesgo',
    entidadId: riesgoId,
    accion: 'update',
    descripcion: 'Actualización de evaluación de riesgo',
    valoresAnteriores: oldValues,
    valoresNuevos: newValues
  }
});
```

## 7. CONFIGURACIÓN Y DEPLOYMENT

### 7.1. Variables de Entorno Requeridas
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://frontend-domain.com
CORS_ORIGINS=https://domain1.com,https://domain2.com

# Azure Storage (opcional)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...
AZURE_STORAGE_CONTAINER_NAME=uploads

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
```

### 7.2. Scripts de NPM
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "npx prisma generate && tsc",
    "postinstall": "npx prisma generate && tsc",
    "seed": "npx tsx prisma/seed-completo.ts",
    "lint": "eslint src/**/*.ts",
    "test": "jest"
  }
}
```

### 7.3. Dependencias Principales
```json
{
  "dependencies": {
    "@prisma/client": "7.4.0",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.3",
    "bcryptjs": "^3.0.3",
    "redis": "^5.11.0",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.4",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.8.1",
    "mongodb": "^6.12.0",      // Para IA/chat history
    "openai": "^6.27.0"        // Integración con OpenAI
  }
}
```

## 8. CONSIDERACIONES DE DISEÑO

### 8.1. Patrones Implementados

#### 8.1.1. Separación de Responsabilidades
- **Controllers**: Manejo de requests/responses
- **Services**: Lógica de negocio reutilizable
- **Middleware**: Cross-cutting concerns (auth, audit, logging)
- **Utils**: Funciones helper genéricas

#### 8.1.2. Cache Strategy
- Cache de lectura intensiva (listados, datos estáticos)
- Invalidación agresiva en escritura
- TTLs cortos para datos dinámicos
- Fallback a DB si Redis falla

#### 8.1.3. Error Handling
- Middleware global de errores
- Respuestas de error estandarizadas
- Logging detallado en desarrollo
- Mensajes amigables en producción

### 8.2. Extensiones y Personalizaciones

#### 8.2.1. Módulos de Configuración
- Calificación inherente (fórmulas, excepciones, rangos)
- Configuración residual (pesos, tablas, criterios)
- Configuración estratégica (CWR, Anexo 6)

#### 8.2.2. Integraciones
- **Azure Blob Storage**: Almacenamiento de documentos
- **OpenAI API**: Asistente virtual y análisis de texto
- **MongoDB**: Historial de conversaciones con IA
- **Cloudinary**: Manejo de imágenes (opcional)

### 8.3. Consideraciones de Escalabilidad

#### 8.3.1. Base de Datos
- Índices en campos de filtrado frecuente
- Particionamiento por proceso/área (futuro)
- Archivo de datos históricos (políticas de retención)

#### 8.3.2. API
- Paginación en todos los listados
- Rate limiting por usuario/IP
- Compresión GZIP para respuestas grandes
- Cache HTTP para recursos estáticos

#### 8.3.3. Background Jobs
- Recalculo masivo de riesgos (off-peak)
- Generación de reportes (async)
- Envío de notificaciones (queue)
- Limpieza de datos temporales

## 9. REPLICACIÓN DEL SISTEMA

### 9.1. Pasos para Implementar desde Cero

#### 9.1.1. Configuración Inicial
1. Clonar estructura de proyecto
2. Configurar variables de entorno
3. Instalar dependencias (`npm install`)
4. Generar cliente Prisma (`npx prisma generate`)
5. Ejecutar migraciones de base de datos
6. Poblar datos iniciales (`npm run seed`)

#### 9.1.2. Personalización
1. Modificar modelos Prisma según necesidades
2. Ajustar controladores para nuevos flujos de negocio
3. Configurar roles y permisos específicos
4. Personalizar cálculos de evaluación
5. Adaptar integraciones externas

#### 9.1.3. Pruebas y Validación
1. Probar endpoints críticos (auth, riesgos, procesos)
2. Validar cálculos de evaluación
3. Verificar sistema de auditoría
4. Probar flujos de 2FA
5. Validar performance con carga simulada

### 9.2. Puntos de Atención Clave

#### 9.2.1. Seguridad
- Rotar JWT_SECRET en producción
- Configurar CORS adecuadamente
- Habilitar 2FA para usuarios administrativos
- Revisar logs de auditoría regularmente

#### 9.2.2. Performance
- Monitorear queries lentas
- Ajustar TTLs de cache según uso
- Optimizar índices de base de datos
- Implementar CDN para archivos estáticos

#### 9.2.3. Mantenimiento
- Backup regular de base de datos
- Limpieza de logs antiguos
- Actualización de dependencias
- Revisiones de seguridad periódicas

---

**Nota**: Este documento técnico proporciona una visión completa del backend del Sistema de Gestión de Riesgos. Para replicar el sistema, se recomienda seguir la estructura presentada y adaptar los modelos de datos, lógica de negocio y configuraciones según los requisitos específicos de la nueva implementación.