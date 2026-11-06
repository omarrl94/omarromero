import { describe, expect, it } from 'vitest';
import { cuentaServicio, idProyecto, limpiarValor } from '../../server/firebase';

describe('cuenta de servicio en tres variables', () => {
  it('limpia comillas y comas copiadas del .json', () => {
    expect(limpiarValor('"conecta-ffe-123",')).toBe('conecta-ffe-123');
    expect(limpiarValor('  firebase-adminsdk@x.iam.gserviceaccount.com ')).toBe('firebase-adminsdk@x.iam.gserviceaccount.com');
  });
  it('acepta la clave con «\\n» literales o con saltos de línea reales', () => {
    process.env.FIREBASE_PROJECT_ID = '"conecta-ffe-123",';
    process.env.FIREBASE_CLIENT_EMAIL = '"firebase-adminsdk-abc@conecta-ffe-123.iam.gserviceaccount.com",';
    process.env.FIREBASE_PRIVATE_KEY = '"-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",';
    const c = cuentaServicio()!;
    expect(c.projectId).toBe('conecta-ffe-123');
    expect(c.clientEmail).toBe('firebase-adminsdk-abc@conecta-ffe-123.iam.gserviceaccount.com');
    expect(c.privateKey).toBe('-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n');
    expect(idProyecto()).toBe('conecta-ffe-123');
    process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----';
    expect(cuentaServicio()!.privateKey).toContain('\nABC\n');
    for (const k of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']) delete process.env[k];
  });
});
