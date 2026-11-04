// Utilidades criptográficas síncronas (sin dependencias) para el laboratorio:
// MD5, SHA-1, SHA-256, Base64 UTF-8, hexadecimal y ROT13/César.
// Son implementaciones didácticas pero correctas: md5sum o sha256sum dan el mismo
// resultado que en un Linux real.

const utf8 = (s) => new TextEncoder().encode(s);

export function md5(str) {
  const bytes = utf8(str);
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const len = bytes.length;
  const nBlocks = ((len + 8) >> 6) + 1;
  const words = new Uint32Array(nBlocks * 16);
  for (let i = 0; i < len; i++) words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  words[nBlocks * 16 - 2] = (len * 8) >>> 0;
  words[nBlocks * 16 - 1] = Math.floor((len * 8) / 2 ** 32);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let blk = 0; blk < nBlocks; blk++) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i % 4)];
      F = (F + A + K[i] + words[blk * 16 + g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map((v) => [0, 8, 16, 24].map((sh) => ((v >>> sh) & 0xff).toString(16).padStart(2, '0')).join('')).join('');
}

function padMessage(bytes) {
  const len = bytes.length;
  const total = (((len + 9) >> 6) + 1) * 64;
  const out = new Uint8Array(total);
  out.set(bytes);
  out[len] = 0x80;
  const bits = len * 8;
  const view = new DataView(out.buffer);
  view.setUint32(total - 8, Math.floor(bits / 2 ** 32));
  view.setUint32(total - 4, bits >>> 0);
  return view;
}

export function sha256(str) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const view = padMessage(utf8(str));
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < view.byteLength; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((v) => v.toString(16).padStart(8, '0')).join('');
}

export function sha1(str) {
  const view = padMessage(utf8(str));
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const W = new Uint32Array(80);
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  for (let off = 0; off < view.byteLength; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) W[i] = rotl(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = (rotl(a, 5) + f + e + k + W[i]) >>> 0;
      e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map((v) => v.toString(16).padStart(8, '0')).join('');
}

export function b64encode(str) {
  const bytes = utf8(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function b64decode(str) {
  const clean = String(str).replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error('entrada no válida');
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const toHex = (str) => [...utf8(str)].map((b) => b.toString(16).padStart(2, '0')).join('');
export function fromHex(hex) {
  const clean = String(hex).replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length >> 1);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  return new TextDecoder().decode(bytes);
}

export function caesar(str, shift) {
  const s = ((shift % 26) + 26) % 26;
  return String(str).replace(/[a-z]/gi, (ch) => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + s) % 26) + base);
  });
}
export const rot13 = (s) => caesar(s, 13);

/** Identifica el tipo probable de un hash por su longitud y alfabeto (como hashid). */
export function identifyHash(h) {
  const v = String(h).trim();
  if (/^\$2[aby]\$\d\d\$/.test(v)) return ['bcrypt'];
  if (/^\$6\$/.test(v)) return ['SHA-512 Crypt (Linux /etc/shadow)'];
  if (/^\$1\$/.test(v)) return ['MD5 Crypt'];
  if (!/^[0-9a-f]+$/i.test(v)) return [];
  if (v.length === 32) return ['MD5', 'NTLM', 'MD4'];
  if (v.length === 40) return ['SHA-1', 'RIPEMD-160'];
  if (v.length === 64) return ['SHA-256', 'SHA3-256'];
  if (v.length === 128) return ['SHA-512', 'Whirlpool'];
  return [];
}

export function hashWith(alg, text) {
  if (alg === 'md5') return md5(text);
  if (alg === 'sha1') return sha1(text);
  if (alg === 'sha256') return sha256(text);
  return null;
}

/** Puntúa la robustez de una contraseña (0-4) con una explicación. */
export function passwordStrength(pw, wordlist = []) {
  const reasons = [];
  if (!pw) return { score: 0, reasons: ['Vacía.'] };
  const lower = pw.toLowerCase();
  if (wordlist.includes(lower)) return { score: 0, reasons: ['Aparece en diccionarios de contraseñas filtradas: se crackea en milisegundos.'] };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const entropy = Math.round(pw.length * Math.log2(pool || 1));
  if (pw.length < 8) reasons.push('Menos de 8 caracteres.');
  if (/^(.)\1+$/.test(pw)) reasons.push('Un solo carácter repetido.');
  if (/(1234|abcd|qwer|asdf|0000)/i.test(pw)) reasons.push('Contiene una secuencia de teclado.');
  if (/(19|20)\d\d$/.test(pw)) reasons.push('Termina en un año: patrón muy usado.');
  let score = entropy < 28 ? 0 : entropy < 40 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
  if (reasons.length && score > 1) score -= 1;
  return { score, entropy, reasons };
}
