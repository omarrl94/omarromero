-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('PERRO', 'GATO', 'OTRO');

-- CreateEnum
CREATE TYPE "Tamano" AS ENUM ('PEQUENO', 'MEDIANO', 'GRANDE');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'HEMBRA');

-- CreateEnum
CREATE TYPE "TipoVivienda" AS ENUM ('PISO', 'CASA');

-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO');

-- CreateEnum
CREATE TYPE "Accion" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "EstadoMatch" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'ADOPTADO', 'DEVUELTO');

-- CreateTable
CREATE TABLE "shelters" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "ciudad" TEXT NOT NULL,
    "descripcion" TEXT,
    "web" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adopters" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "tipo_vivienda" "TipoVivienda",
    "bio" TEXT,
    "horas_fuera" INTEGER NOT NULL,
    "tiene_jardin" BOOLEAN NOT NULL,
    "otros_animales" BOOLEAN NOT NULL,
    "tiene_ninos" BOOLEAN NOT NULL,
    "nivel_actividad" "Nivel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adopters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie" "Especie" NOT NULL,
    "raza" TEXT,
    "edad_meses" INTEGER NOT NULL,
    "tamano" "Tamano" NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "descripcion" TEXT,
    "fotos" TEXT[],
    "estado" "EstadoAnimal" NOT NULL DEFAULT 'DISPONIBLE',
    "requiere_jardin" BOOLEAN NOT NULL,
    "nivel_energia" "Nivel" NOT NULL,
    "sociable_animales" BOOLEAN,
    "sociable_ninos" BOOLEAN,
    "nivel_ansiedad" "Nivel" NOT NULL,
    "horas_max_solo" INTEGER,
    "shelter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "adopter_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "accion" "Accion" NOT NULL,
    "compatibilidad" INTEGER NOT NULL,
    "desglose" JSONB,
    "estado" "EstadoMatch",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shelters_email_key" ON "shelters"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adopters_email_key" ON "adopters"("email");

-- CreateIndex
CREATE INDEX "animals_shelter_id_idx" ON "animals"("shelter_id");

-- CreateIndex
CREATE INDEX "animals_estado_idx" ON "animals"("estado");

-- CreateIndex
CREATE INDEX "matches_animal_id_accion_idx" ON "matches"("animal_id", "accion");

-- CreateIndex
CREATE UNIQUE INDEX "matches_adopter_id_animal_id_key" ON "matches"("adopter_id", "animal_id");

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_adopter_id_fkey" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
