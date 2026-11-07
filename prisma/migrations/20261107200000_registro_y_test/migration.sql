-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADOPTER', 'SHELTER');

-- CreateEnum
CREATE TYPE "Experiencia" AS ENUM ('NINGUNA', 'ALGUNA', 'MUCHA');

-- CreateEnum
CREATE TYPE "PreferenciaEspecie" AS ENUM ('PERRO', 'GATO', 'INDIFERENTE');

-- CreateEnum
CREATE TYPE "EdadRango" AS ENUM ('CACHORRO', 'JOVEN', 'ADULTO', 'SENIOR');

-- AlterTable
ALTER TABLE "adopters" ADD COLUMN     "acepta_necesidades_especiales" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "edades_preferidas" "EdadRango"[],
ADD COLUMN     "especie_preferida" "PreferenciaEspecie" NOT NULL DEFAULT 'INDIFERENTE',
ADD COLUMN     "experiencia" "Experiencia" NOT NULL DEFAULT 'NINGUNA',
ADD COLUMN     "tamanos_preferidos" "Tamano"[],
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "necesidades_especiales" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiere_experiencia" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'ADOPTER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adopters_user_id_key" ON "adopters"("user_id");

-- AddForeignKey
ALTER TABLE "adopters" ADD CONSTRAINT "adopters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
