// Shell simulada del laboratorio CyberOps.
// Todo ocurre en memoria, sobre un escenario ficticio: no hay red ni sistema real detrás.
// Cada comando devuelve texto y registra eventos en state.log, que las misiones usan
// para comprobar objetivos (p. ej. «has leído auth.log», «has bloqueado la IP»).
import { buildFs, normalize, lookup, writeFile, removeNode, walk, modeToOctal, octalToMode } from './vfs.js';
import { md5, sha1, sha256, b64encode, b64decode, rot13 } from './crypto.js';

/** Crea el estado de una terminal a partir de la definición de escenario de un reto. */
export function createShell(scn = {}) {
  const user = scn.user || 'analista';
  const home = user === 'root' ? '/root' : `/home/${user}`;
  return {
    user,
    host: scn.host || 'soc-lab',
    home,
    cwd: scn.cwd || home,
    fs: buildFs({ [`${home}/`]: { owner: user }, '/tmp/': {}, ...(scn.files || {}) }),
    procs: (scn.procs || []).map((p) => ({ ...p })),
    cron: JSON.parse(JSON.stringify(scn.cron || {})),
    firewall: [],
    services: (scn.services || []).map((s) => ({ ...s })),
    listening: (scn.listening || []).map((l) => ({ ...l })),
    dns: scn.dns || {},
    whois: scn.whois || {},
    history: [],
    log: [],
    answers: {},
  };
}

const HELP = {
  help: 'Muestra esta ayuda. «help <comando>» explica uno en detalle.',
  pwd: 'Muestra la carpeta en la que estás.',
  ls: 'Lista ficheros. -l detalle y permisos · -a incluye ocultos.',
  cd: 'Cambia de carpeta. «cd ..» sube un nivel, «cd ~» vuelve a casa.',
  cat: 'Muestra el contenido de uno o varios ficheros.',
  head: 'Primeras líneas (-n N).',
  tail: 'Últimas líneas (-n N).',
  grep: 'Filtra líneas que contienen un patrón. -i ignora mayúsculas · -v invierte · -c cuenta · -n número de línea · -E expresión regular.',
  wc: 'Cuenta líneas (-l), palabras (-w) o caracteres (-c).',
  sort: 'Ordena líneas. -n numérico · -r inverso.',
  uniq: 'Quita líneas repetidas consecutivas. -c cuenta cuántas veces aparece cada una.',
  cut: 'Corta columnas: cut -d" " -f1',
  awk: "Imprime columnas: awk '{print $1}'",
  echo: 'Escribe un texto.',
  whoami: 'Tu usuario.',
  id: 'Tu usuario y tus grupos.',
  find: 'Busca ficheros: find /ruta -name "*.log"',
  chmod: 'Cambia permisos: chmod 600 fichero',
  ps: 'Procesos en ejecución: ps aux',
  kill: 'Termina un proceso por su PID: kill 4242',
  ss: 'Puertos a la escucha en ESTA máquina: ss -tulpn',
  systemctl: 'Servicios: systemctl status|stop|disable <servicio>',
  crontab: 'Tareas programadas: crontab -l (ver) · crontab -r (borrar todas) · crontab -u usuario -l',
  rm: 'Borra un fichero.',
  iptables: 'Cortafuegos: iptables -L (ver) · iptables -A INPUT -s <IP> -j DROP (bloquear)',
  whois: 'Datos públicos de registro de un dominio (información pasiva).',
  dig: 'Consulta DNS: dig <dominio> [A|MX|TXT|NS]',
  base64: 'Codifica; con -d decodifica. Recuerda: Base64 NO es cifrado.',
  md5sum: 'Calcula el hash MD5 de un fichero.',
  sha256sum: 'Calcula el hash SHA-256 de un fichero.',
  rot13: 'Aplica ROT13 a un texto (cifrado César de 13 posiciones).',
  hashtext: 'hashtext <md5|sha1|sha256> <texto> · hash de un texto (didáctico).',
  history: 'Comandos que has escrito.',
  clear: 'Limpia la pantalla.',
};

// ───────────────────────── Análisis de la línea ─────────────────────────

export function tokenize(line) {
  const out = [];
  let cur = '';
  let quote = null;
  let has = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (/\s/.test(ch)) {
      if (cur || has) out.push(cur);
      cur = '';
      has = false;
      continue;
    }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

/** Divide por un separador fuera de comillas. */
function splitTop(line, seps) {
  const parts = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) { if (ch === quote) quote = null; cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    const sep = seps.find((s) => line.startsWith(s, i));
    if (sep) { parts.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

// ───────────────────────── Comandos ─────────────────────────

function flagsOf(args) {
  const flags = new Set();
  const rest = [];
  for (const a of args) {
    if (/^-[A-Za-z]+$/.test(a)) a.slice(1).split('').forEach((f) => flags.add(f));
    else rest.push(a);
  }
  return { flags, rest };
}

const lines = (s) => (s === '' ? [] : s.replace(/\n$/, '').split('\n'));

function readPath(st, p, ev = true) {
  const abs = normalize(st.cwd, p, st.home);
  const node = lookup(st.fs, abs);
  if (!node) return { err: `${p}: No existe el fichero o el directorio` };
  if (node.type === 'dir') return { err: `${p}: Es un directorio` };
  if (!canRead(st, node)) return { err: `${p}: Permiso denegado` };
  if (ev) st.log.push({ type: 'read', path: abs });
  return { content: node.content, abs };
}

function canRead(st, node) {
  if (st.user === 'root') return true;
  if (node.owner === st.user) return node.mode[0] === 'r';
  return node.mode[6] === 'r';
}

function numFlag(args, def = 10) {
  const i = args.indexOf('-n');
  if (i >= 0 && args[i + 1]) { const n = Number(args[i + 1]); args.splice(i, 2); return n; }
  const m = args.find((a) => /^-\d+$/.test(a));
  if (m) { args.splice(args.indexOf(m), 1); return Number(m.slice(1)); }
  return def;
}

function inputOf(st, files, stdin) {
  if (!files.length) return { text: stdin ?? '' };
  let text = '';
  for (const f of files) {
    const r = readPath(st, f);
    if (r.err) return { err: r.err };
    text += r.content.endsWith('\n') || !r.content ? r.content : `${r.content}\n`;
  }
  return { text };
}

const COMMANDS = {
  help(st, args) {
    if (args[0]) return HELP[args[0]] ? `${args[0]}: ${HELP[args[0]]}` : `No conozco «${args[0]}».`;
    return `Comandos disponibles en este laboratorio:\n${Object.entries(HELP).map(([k, v]) => `  ${k.padEnd(10)} ${v}`).join('\n')}\n\nPuedes encadenar con | (tubería), ; y redirigir con > o >>.`;
  },
  pwd: (st) => st.cwd,
  whoami: (st) => st.user,
  id: (st) => (st.user === 'root' ? 'uid=0(root) gid=0(root) grupos=0(root)' : `uid=1000(${st.user}) gid=1000(${st.user}) grupos=1000(${st.user}),27(sudo),4(adm)`),
  hostname: (st) => st.host,
  date: () => 'mié 04 nov 2026 10:15:00 CET',
  echo: (st, args) => args.join(' '),
  clear(st) { st.log.push({ type: 'clear' }); return ''; },
  history: (st) => st.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'),
  ls(st, args) {
    const { flags, rest } = flagsOf(args);
    const target = rest[0] || '.';
    const abs = normalize(st.cwd, target, st.home);
    const node = lookup(st.fs, abs);
    if (!node) return { err: `ls: no se puede acceder a '${target}': No existe el fichero o el directorio` };
    st.log.push({ type: 'ls', path: abs, flags: [...flags].join('') });
    const entries = node.type === 'dir' ? Object.entries(node.children) : [[target, node]];
    const shown = entries.filter(([n]) => flags.has('a') || !n.startsWith('.')).sort(([a], [b]) => a.localeCompare(b));
    if (!flags.has('l')) return shown.map(([n, c]) => (c.type === 'dir' ? `${n}/` : n)).join('  ');
    return shown.map(([n, c]) => `${c.type === 'dir' ? 'd' : '-'}${c.mode} 1 ${c.owner.padEnd(9)} ${c.owner.padEnd(9)} ${String(c.type === 'dir' ? 4096 : c.content.length).padStart(6)} nov  4 10:00 ${n}`).join('\n');
  },
  cd(st, args) {
    const abs = normalize(st.cwd, args[0] || '~', st.home);
    const node = lookup(st.fs, abs);
    if (!node) return { err: `cd: ${args[0]}: No existe el fichero o el directorio` };
    if (node.type !== 'dir') return { err: `cd: ${args[0]}: No es un directorio` };
    st.cwd = abs;
    st.log.push({ type: 'cd', path: abs });
    return '';
  },
  cat(st, args, stdin) {
    const r = inputOf(st, args, stdin);
    return r.err ? { err: `cat: ${r.err}` } : r.text.replace(/\n$/, '');
  },
  head(st, args, stdin) {
    const a = [...args];
    const n = numFlag(a);
    const r = inputOf(st, a, stdin);
    return r.err ? { err: `head: ${r.err}` } : lines(r.text).slice(0, n).join('\n');
  },
  tail(st, args, stdin) {
    const a = [...args];
    const n = numFlag(a);
    const r = inputOf(st, a, stdin);
    return r.err ? { err: `tail: ${r.err}` } : lines(r.text).slice(-n).join('\n');
  },
  grep(st, args, stdin) {
    const { flags, rest } = flagsOf(args);
    const [pattern, ...files] = rest;
    if (pattern === undefined) return { err: 'uso: grep [-ivcnE] PATRÓN [FICHERO...]' };
    const r = inputOf(st, files, stdin);
    if (r.err) return { err: `grep: ${r.err}` };
    let re;
    try {
      const src = flags.has('E') ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp(src, flags.has('i') ? 'i' : '');
    } catch {
      return { err: 'grep: expresión regular no válida' };
    }
    const out = [];
    lines(r.text).forEach((l, i) => {
      if (re.test(l) !== flags.has('v')) out.push(flags.has('n') ? `${i + 1}:${l}` : l);
    });
    st.log.push({ type: 'grep', pattern, files: files.map((f) => normalize(st.cwd, f, st.home)), matches: out.length });
    return flags.has('c') ? String(out.length) : out.join('\n');
  },
  wc(st, args, stdin) {
    const { flags, rest } = flagsOf(args);
    const r = inputOf(st, rest, stdin);
    if (r.err) return { err: `wc: ${r.err}` };
    const l = lines(r.text).length;
    const w = r.text.split(/\s+/).filter(Boolean).length;
    const c = r.text.length;
    if (flags.has('l')) return String(l);
    if (flags.has('w')) return String(w);
    if (flags.has('c')) return String(c);
    return `${l} ${w} ${c}`;
  },
  sort(st, args, stdin) {
    const { flags, rest } = flagsOf(args);
    const r = inputOf(st, rest, stdin);
    if (r.err) return { err: `sort: ${r.err}` };
    const ls = lines(r.text);
    ls.sort(flags.has('n') ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
    if (flags.has('r')) ls.reverse();
    return ls.join('\n');
  },
  uniq(st, args, stdin) {
    const { flags, rest } = flagsOf(args);
    const r = inputOf(st, rest, stdin);
    if (r.err) return { err: `uniq: ${r.err}` };
    const out = [];
    for (const l of lines(r.text)) {
      const last = out[out.length - 1];
      if (last && last.l === l) last.n++;
      else out.push({ l, n: 1 });
    }
    return out.map((o) => (flags.has('c') ? `${String(o.n).padStart(7)} ${o.l}` : o.l)).join('\n');
  },
  cut(st, args, stdin) {
    let delim = '\t';
    let fields = null;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-d') delim = args[++i];
      else if (a.startsWith('-d')) delim = a.slice(2);
      else if (a === '-f') fields = args[++i];
      else if (a.startsWith('-f')) fields = a.slice(2);
      else files.push(a);
    }
    if (!fields) return { err: 'cut: debes indicar -f' };
    const idx = fields.split(',').map(Number);
    const r = inputOf(st, files, stdin);
    if (r.err) return { err: `cut: ${r.err}` };
    return lines(r.text).map((l) => { const p = l.split(delim); return idx.map((n) => p[n - 1] ?? '').join(delim); }).join('\n');
  },
  awk(st, args, stdin) {
    const prog = args[0] || '';
    const m = prog.match(/^\{\s*print\s+(.+?)\s*\}$/);
    if (!m) return { err: "awk: en este laboratorio solo se admite awk '{print $N, $M}'" };
    const cols = m[1].split(/\s*,\s*/).map((c) => c.trim());
    const r = inputOf(st, args.slice(1), stdin);
    if (r.err) return { err: `awk: ${r.err}` };
    return lines(r.text).map((l) => {
      const p = l.trim().split(/\s+/);
      return cols.map((c) => (c === '$0' ? l : c.startsWith('$') ? (c === '$NF' ? p[p.length - 1] : p[Number(c.slice(1)) - 1] ?? '') : c.replace(/"/g, ''))).join(' ');
    }).join('\n');
  },
  find(st, args) {
    const base = args[0] && !args[0].startsWith('-') ? args[0] : '.';
    const abs = normalize(st.cwd, base, st.home);
    const ni = args.indexOf('-name');
    const pi = args.indexOf('-perm');
    const ti = args.indexOf('-type');
    let re = null;
    if (ni >= 0) re = new RegExp(`^${(args[ni + 1] || '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
    const out = walk(st.fs, abs).filter(({ path, node }) => {
      const name = path.split('/').pop();
      if (re && !re.test(name)) return false;
      if (ti >= 0 && args[ti + 1] === 'f' && node.type !== 'file') return false;
      if (ti >= 0 && args[ti + 1] === 'd' && node.type !== 'dir') return false;
      if (pi >= 0) {
        const want = args[pi + 1] || '';
        if (want === '-o+w' || want === '-002') return node.type === 'file' && node.mode[7] === 'w';
        return modeToOctal(node.mode) === want.replace(/^-/, '');
      }
      return true;
    }).map(({ path }) => path);
    st.log.push({ type: 'find', base: abs, args: args.join(' ') });
    return out.join('\n');
  },
  chmod(st, args) {
    const [mode, file] = args;
    if (!mode || !file || !/^[0-7]{3}$/.test(mode)) return { err: 'uso: chmod NNN fichero  (p. ej. chmod 600 clave.txt)' };
    const abs = normalize(st.cwd, file, st.home);
    const node = lookup(st.fs, abs);
    if (!node) return { err: `chmod: no se puede acceder a '${file}'` };
    if (st.user !== 'root' && node.owner !== st.user) return { err: `chmod: cambiando los permisos de '${file}': Operación no permitida` };
    node.mode = octalToMode(mode);
    st.log.push({ type: 'chmod', path: abs, mode });
    return '';
  },
  rm(st, args) {
    const { rest } = flagsOf(args);
    if (!rest.length) return { err: 'rm: falta un operando' };
    for (const f of rest) {
      const abs = normalize(st.cwd, f, st.home);
      const node = lookup(st.fs, abs);
      if (!node) return { err: `rm: no se puede borrar '${f}': No existe el fichero o el directorio` };
      if (st.user !== 'root' && node.owner !== st.user) return { err: `rm: no se puede borrar '${f}': Permiso denegado` };
      removeNode(st.fs, abs);
      st.log.push({ type: 'rm', path: abs });
    }
    return '';
  },
  ps(st) {
    st.log.push({ type: 'ps' });
    const head = 'USER         PID %CPU %MEM COMMAND';
    return [head, ...st.procs.map((p) => `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${String(p.cpu ?? 0.1).padStart(4)} ${String(p.mem ?? 0.3).padStart(4)} ${p.cmd}`)].join('\n');
  },
  kill(st, args) {
    const pid = Number(args.filter((a) => !a.startsWith('-'))[0]);
    const i = st.procs.findIndex((p) => p.pid === pid);
    if (i < 0) return { err: `kill: (${args[0] || ''}) - No existe el proceso` };
    const [p] = st.procs.splice(i, 1);
    st.log.push({ type: 'kill', pid, cmd: p.cmd });
    return '';
  },
  ss(st) {
    st.log.push({ type: 'ss' });
    const head = 'Netid State  Local Address:Port   Process';
    return [head, ...st.listening.map((l) => `${(l.proto || 'tcp').padEnd(5)} LISTEN ${(`${l.addr || '0.0.0.0'}:${l.port}`).padEnd(20)} users:(("${l.process}"))`)].join('\n');
  },
  systemctl(st, args) {
    const [action, name] = args;
    const svc = st.services.find((s) => s.name === name || `${s.name}.service` === name);
    if (!action) return { err: 'uso: systemctl status|stop|disable|start <servicio>' };
    if (action === 'list-units') return st.services.map((s) => `${`${s.name}.service`.padEnd(26)} ${s.active ? 'active running' : 'inactive dead'}  ${s.desc || ''}`).join('\n');
    if (!svc) return { err: `Unit ${name}.service could not be found.` };
    if (action === 'status') return `● ${svc.name}.service - ${svc.desc || ''}\n   Loaded: loaded (${svc.enabled ? 'enabled' : 'disabled'})\n   Active: ${svc.active ? 'active (running)' : 'inactive (dead)'}`;
    if (st.user !== 'root') return { err: 'Se necesita autenticación: usa una cuenta con privilegios (en este laboratorio, ya lo eres si el reto lo permite).' };
    if (action === 'stop') svc.active = false;
    else if (action === 'start') svc.active = true;
    else if (action === 'disable') svc.enabled = false;
    else if (action === 'enable') svc.enabled = true;
    else return { err: `systemctl: acción desconocida «${action}»` };
    if (action === 'stop' || action === 'disable') st.listening = st.listening.filter((l) => !(l.service === svc.name && !svc.active));
    st.log.push({ type: 'systemctl', action, name: svc.name });
    return '';
  },
  crontab(st, args) {
    const ui = args.indexOf('-u');
    const who = ui >= 0 ? args[ui + 1] : st.user;
    const tab = st.cron[who] || [];
    if (args.includes('-l')) {
      st.log.push({ type: 'cron-list', user: who });
      return tab.length ? tab.join('\n') : `no crontab for ${who}`;
    }
    if (args.includes('-r')) {
      st.cron[who] = [];
      st.log.push({ type: 'cron-clear', user: who });
      return '';
    }
    return { err: 'uso: crontab [-u usuario] -l | -r' };
  },
  iptables(st, args) {
    if (args.includes('-L')) {
      st.log.push({ type: 'fw-list' });
      return `Chain INPUT (policy ACCEPT)\ntarget     prot source               destination\n${st.firewall.map((r) => `DROP       all  ${r.ip.padEnd(20)} 0.0.0.0/0`).join('\n')}`;
    }
    const si = args.indexOf('-s');
    const ji = args.indexOf('-j');
    if ((args.includes('-A') || args.includes('-I')) && si >= 0 && ji >= 0) {
      const ip = args[si + 1];
      const target = args[ji + 1];
      if (!/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(ip || '')) return { err: `iptables: dirección no válida «${ip}»` };
      if (target !== 'DROP' && target !== 'REJECT') return { err: 'En este laboratorio solo se usa -j DROP o -j REJECT.' };
      if (st.user !== 'root') return { err: 'iptables: Permiso denegado (necesitas root).' };
      st.firewall.push({ ip, target });
      st.log.push({ type: 'block', ip });
      return '';
    }
    return { err: 'uso: iptables -L  |  iptables -A INPUT -s <IP> -j DROP' };
  },
  whois(st, args) {
    const d = (args[0] || '').toLowerCase();
    const rec = st.whois[d];
    st.log.push({ type: 'whois', domain: d });
    if (!rec) return `No se encontraron datos para «${d}». (En este laboratorio solo existen los dominios ficticios del escenario.)`;
    return rec;
  },
  dig(st, args) {
    const rest = args.filter((a) => !a.startsWith('+') && !a.startsWith('@'));
    const d = (rest[0] || '').toLowerCase();
    const type = (rest[1] || 'A').toUpperCase();
    st.log.push({ type: 'dig', domain: d, rtype: type });
    const recs = (st.dns[d] || {})[type];
    if (!recs || !recs.length) return `;; ${d} IN ${type}\n;; Sin respuesta (NXDOMAIN o sin registros ${type}).`;
    return `;; ANSWER SECTION:\n${recs.map((r) => `${d}.\t3600\tIN\t${type}\t${r}`).join('\n')}`;
  },
  base64(st, args, stdin) {
    const { flags, rest } = flagsOf(args);
    const r = inputOf(st, rest, stdin);
    if (r.err) return { err: `base64: ${r.err}` };
    if (flags.has('d')) {
      try {
        const out = b64decode(r.text);
        st.log.push({ type: 'b64decode', out });
        return out.replace(/\n$/, '');
      } catch { return { err: 'base64: entrada no válida' }; }
    }
    return b64encode(r.text);
  },
  rot13(st, args, stdin) {
    const out = rot13(args.length ? args.join(' ') : stdin || '');
    st.log.push({ type: 'rot13', out });
    return out;
  },
  md5sum(st, args, stdin) {
    if (!args.length) return `${md5(stdin || '')}  -`;
    return args.map((f) => { const r = readPath(st, f); return r.err ? `md5sum: ${r.err}` : `${md5(r.content)}  ${f}`; }).join('\n');
  },
  sha256sum(st, args, stdin) {
    st.log.push({ type: 'sha256sum', files: args.map((f) => normalize(st.cwd, f, st.home)) });
    if (!args.length) return `${sha256(stdin || '')}  -`;
    return args.map((f) => { const r = readPath(st, f); return r.err ? `sha256sum: ${r.err}` : `${sha256(r.content)}  ${f}`; }).join('\n');
  },
  hashtext(st, args) {
    const [alg, ...words] = args;
    const text = words.join(' ');
    const fn = { md5, sha1, sha256 }[alg];
    if (!fn) return { err: 'uso: hashtext md5|sha1|sha256 <texto>' };
    st.log.push({ type: 'hashtext', alg, text });
    return fn(text);
  },
  file(st, args) {
    return args.map((f) => {
      const r = readPath(st, f, false);
      if (r.err) return `${f}: ${r.err}`;
      const c = r.content;
      const kind = c.startsWith('#!') ? 'script de shell, texto ASCII' : c.startsWith('%PDF') ? 'documento PDF' : /^[A-Za-z0-9+/=\s]+$/.test(c.trim()) && c.trim().length > 16 ? 'texto ASCII (¿Base64?)' : 'texto ASCII';
      return `${f}: ${kind}`;
    }).join('\n');
  },
  exiftool(st, args) {
    const r = readPath(st, args[0] || '');
    if (r.err) return { err: `exiftool: ${r.err}` };
    const meta = r.content.match(/%%META([\s\S]*?)%%/);
    st.log.push({ type: 'exif', path: r.abs });
    return meta ? meta[1].trim() : 'Sin metadatos.';
  },
};

// Alias habituales
COMMANDS.nslookup = (st, args) => COMMANDS.dig(st, [args[0], 'A']);
COMMANDS.host = (st, args) => COMMANDS.dig(st, [args[0], 'A']);
COMMANDS.ll = (st, args) => COMMANDS.ls(st, ['-la', ...args]);

export const commandNames = () => Object.keys(COMMANDS);

function runSimple(st, segment, stdin) {
  let seg = segment.replace(/\s2>\s*\/dev\/null/g, '');
  let redirect = null;
  const m = seg.match(/^(.*?)(>>?)\s*(\S+)\s*$/);
  if (m && !/['"]/.test(m[3])) { seg = m[1]; redirect = { append: m[2] === '>>', file: m[3] }; }
  const tokens = tokenize(seg.trim());
  if (!tokens.length) return { out: '' };
  let [name, ...args] = tokens;
  if (name === 'sudo') {
    if (!args.length) return { err: 'uso: sudo <comando>' };
    if (st.sudo === false) return { err: `${st.user} no está en el fichero sudoers. Este incidente será reportado.` };
    const prev = st.user;
    st.user = 'root';
    st.log.push({ type: 'sudo', cmd: args.join(' ') });
    try { return runSimple(st, args.join(' ').replace(/^/, '') + (redirect ? ` ${redirect.append ? '>>' : '>'} ${redirect.file}` : ''), stdin); } finally { st.user = prev; }
  }
  const fn = COMMANDS[name];
  st.log.push({ type: 'cmd', name, args, raw: segment.trim() });
  if (!fn) return { err: `${name}: orden no encontrada. Escribe «help» para ver los comandos.` };
  let res = fn(st, args, stdin);
  if (typeof res === 'string') res = { out: res };
  if (redirect && !res.err) {
    const abs = normalize(st.cwd, redirect.file, st.home);
    if (!writeFile(st.fs, abs, `${res.out}\n`, redirect.append, st.user)) return { err: `${redirect.file}: No se puede escribir` };
    st.log.push({ type: 'write', path: abs });
    return { out: '' };
  }
  return res;
}

/** Ejecuta una línea completa (con ; && y |) y devuelve el texto a mostrar. */
export function run(st, line) {
  const trimmed = line.trim();
  if (!trimmed) return { out: '' };
  st.history.push(trimmed);
  const outputs = [];
  let ok = true;
  for (const chunk of splitTop(trimmed, [';'])) {
    for (const [i, andPart] of splitTop(chunk, ['&&']).entries()) {
      if (i > 0 && !ok) break;
      let stdin;
      let res = { out: '' };
      for (const pipePart of splitTop(andPart, ['|'])) {
        res = runSimple(st, pipePart, stdin);
        if (res.err) break;
        stdin = res.out ? `${res.out}\n` : '';
      }
      ok = !res.err;
      if (res.err) outputs.push({ text: res.err, err: true });
      else if (res.out) outputs.push({ text: res.out });
    }
  }
  st.log.push({ type: 'line', raw: trimmed });
  return { lines: outputs, clear: trimmed === 'clear' };
}
