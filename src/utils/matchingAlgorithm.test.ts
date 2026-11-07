import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeCompatibility,
  calculateCompatibility,
  DEALBREAKER_CAP,
  WEIGHTS,
  type AdopterProfile,
  type AnimalProfile,
} from "./matchingAlgorithm";

const adopterBase: AdopterProfile = {
  horasFuera: 4,
  tieneJardin: true,
  otrosAnimales: false,
  tieneNinos: false,
  nivelActividad: "MEDIO",
};
const animalBase: AnimalProfile = {
  requiereJardin: false,
  nivelEnergia: "MEDIO",
  sociableAnimales: true,
  sociableNinos: true,
  nivelAnsiedad: "BAJO",
  horasMaxSolo: null,
};

test("los pesos suman 100", () => {
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 100);
});

test("encaje perfecto = 100%", () => {
  assert.equal(computeCompatibility(adopterBase, animalBase).percentage, 100);
});

test("las horas fuera por encima de la tolerancia restan de forma lineal", () => {
  // ALTO tolera 3 h; 5 h → 2 h de exceso → 0.5 × 30 = 15 → 85 %
  const r = computeCompatibility({ ...adopterBase, horasFuera: 5 }, { ...animalBase, nivelAnsiedad: "ALTO" });
  assert.equal(r.percentage, 85);
});

test("horasMaxSolo explícito tiene prioridad sobre la ansiedad", () => {
  const r = computeCompatibility({ ...adopterBase, horasFuera: 5 }, { ...animalBase, nivelAnsiedad: "ALTO", horasMaxSolo: 5 });
  assert.equal(r.percentage, 100);
});

test("la energía es asimétrica: animal más enérgico penaliza más", () => {
  const animalMas = computeCompatibility({ ...adopterBase, nivelActividad: "BAJO" }, { ...animalBase, nivelEnergia: "MEDIO" });
  const adoptanteMas = computeCompatibility({ ...adopterBase, nivelActividad: "ALTO" }, { ...animalBase, nivelEnergia: "MEDIO" });
  assert.ok(animalMas.percentage < adoptanteMas.percentage);
});

test("niños + animal no apto con niños = dealbreaker con nota limitada", () => {
  const r = computeCompatibility({ ...adopterBase, tieneNinos: true }, { ...animalBase, sociableNinos: false });
  assert.equal(r.dealbreakers.length, 1);
  assert.ok(r.percentage <= DEALBREAKER_CAP);
});

test("dato sin evaluar puntúa la mitad y genera aviso, no dealbreaker", () => {
  const r = computeCompatibility({ ...adopterBase, otrosAnimales: true }, { ...animalBase, sociableAnimales: null });
  assert.equal(r.percentage, Math.round(100 - WEIGHTS.animales / 2));
  assert.equal(r.warnings.length, 1);
  assert.equal(r.dealbreakers.length, 0);
});

test("jardín requerido: actividad alta compensa en parte", () => {
  const sinJardin = { ...adopterBase, tieneJardin: false };
  const animal = { ...animalBase, requiereJardin: true };
  const bajo = computeCompatibility({ ...sinJardin, nivelActividad: "MEDIO" }, animal).breakdown.find((c) => c.key === "jardin")!;
  const alto = computeCompatibility({ ...sinJardin, nivelActividad: "ALTO" }, { ...animal, nivelEnergia: "ALTO" }).breakdown.find((c) => c.key === "jardin")!;
  assert.equal(bajo.score, 0);
  assert.equal(alto.score, 0.3);
});

test("calculateCompatibility(adopterId, animalId) carga por ID", async () => {
  const db = {
    adopter: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "a1" ? adopterBase : null) },
    animal: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "x1" ? animalBase : null) },
  };
  assert.equal(await calculateCompatibility("a1", "x1", db), 100);
  await assert.rejects(() => calculateCompatibility("nope", "x1", db), /Adopter no encontrado/);
});
