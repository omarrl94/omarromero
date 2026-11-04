// Escenario ficticio común a toda la campaña: la empresa cliente «Nébula Logística».
// Dominio .lab (no existe en Internet) e IPs de los rangos reservados para documentación
// (RFC 5737: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) y redes privadas.

export const DOMAIN = 'nebula-logistica.lab';

export const WHOIS = {
  'nebula-logistica.lab': `Domain Name: NEBULA-LOGISTICA.LAB
Registrar: Registrador Ficticio de Laboratorio S.L.
Creation Date: 2014-03-11
Registry Expiry Date: 2027-03-11
Registrant Organization: Nebula Logistica S.L.
Registrant Name: Marta Quintana (Dpto. Sistemas)
Registrant Email: sistemas@nebula-logistica.lab
Registrant Phone: +34 900 000 000
Name Server: ns1.nebula-logistica.lab
Name Server: ns2.proveedor-dns.lab
DNSSEC: unsigned`,
  'nebu1a-logistica.lab': `Domain Name: NEBU1A-LOGISTICA.LAB
Registrar: Registros Baratos Anonimos
Creation Date: 2026-10-30
Registrant Organization: REDACTED FOR PRIVACY
Name Server: ns.hosting-dudoso.lab`,
};

export const DNS = {
  'nebula-logistica.lab': {
    A: ['203.0.113.10'],
    MX: ['10 correo.nebula-logistica.lab.'],
    NS: ['ns1.nebula-logistica.lab.', 'ns2.proveedor-dns.lab.'],
    TXT: ['"v=spf1 ip4:203.0.113.20 -all"', '"google-site-verification=lab-ficticio-123"'],
  },
  'www.nebula-logistica.lab': { A: ['203.0.113.10'] },
  'correo.nebula-logistica.lab': { A: ['203.0.113.20'] },
  'vpn.nebula-logistica.lab': { A: ['203.0.113.30'] },
  'intranet-pruebas.nebula-logistica.lab': { A: ['203.0.113.44'] },
  '_dmarc.nebula-logistica.lab': { TXT: [] },
  'nebu1a-logistica.lab': { A: ['198.51.100.66'], MX: [] },
};

export const NETWORK_SCOPE = ['203.0.113.10', '203.0.113.20', '203.0.113.30', '203.0.113.44'];
