-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "cedula" VARCHAR(10) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(10),
    "tipo_seguro" VARCHAR(20) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'paciente',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicos" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "especialidad" VARCHAR(100) NOT NULL,
    "numero_licencia" VARCHAR(50) NOT NULL,
    "calificacion" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "pacientes_atendidos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_atencion" (
    "id" SERIAL NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terapias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "especialidad" VARCHAR(100) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "imagen" VARCHAR(255),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terapias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "terapia_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" VARCHAR(5) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "sintomas" TEXT NOT NULL,
    "tiene_examenes" BOOLEAN NOT NULL DEFAULT false,
    "examenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motivo_cancelacion" TEXT,
    "notas_medico" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cedula_key" ON "users"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_cedula_idx" ON "users"("cedula");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "medicos_user_id_key" ON "medicos"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicos_numero_licencia_key" ON "medicos"("numero_licencia");

-- CreateIndex
CREATE INDEX "medicos_especialidad_idx" ON "medicos"("especialidad");

-- CreateIndex
CREATE INDEX "medicos_activo_idx" ON "medicos"("activo");

-- CreateIndex
CREATE INDEX "horarios_atencion_medico_id_idx" ON "horarios_atencion"("medico_id");

-- CreateIndex
CREATE INDEX "horarios_atencion_dia_semana_idx" ON "horarios_atencion"("dia_semana");

-- CreateIndex
CREATE INDEX "terapias_especialidad_idx" ON "terapias"("especialidad");

-- CreateIndex
CREATE INDEX "terapias_activa_idx" ON "terapias"("activa");

-- CreateIndex
CREATE INDEX "citas_paciente_id_idx" ON "citas"("paciente_id");

-- CreateIndex
CREATE INDEX "citas_medico_id_idx" ON "citas"("medico_id");

-- CreateIndex
CREATE INDEX "citas_fecha_idx" ON "citas"("fecha");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE INDEX "citas_created_at_idx" ON "citas"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "citas_medico_id_fecha_hora_key" ON "citas"("medico_id", "fecha", "hora");

-- AddForeignKey
ALTER TABLE "medicos" ADD CONSTRAINT "medicos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_atencion" ADD CONSTRAINT "horarios_atencion_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_terapia_id_fkey" FOREIGN KEY ("terapia_id") REFERENCES "terapias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
