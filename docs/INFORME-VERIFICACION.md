# Informe de verificación de empresas

**Todavía no se ha ejecutado.** El entorno de desarrollo no tenía acceso a las webs de las empresas ni a DNS,
y el verificador se negó a ejecutarse para no descartar empresas por un fallo de red:

```
✖ Sin acceso a Internet o DNS (HTTP boe.es: ENOTFOUND; MX gmail.com: null).
  No se ha modificado ningún archivo: verificar sin red descartaría empresas válidas.
```

Candidatas pendientes: 68 (`data/empresas.candidatas.json`). Empresas publicadas: 0.

Para generar este informe: `npm run verificar:empresas` en un equipo con Internet (ver `docs/PENDIENTES.md`).
