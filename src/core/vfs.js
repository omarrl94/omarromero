// Sistema de ficheros virtual del laboratorio.
// Se construye a partir de un mapa plano { '/ruta/fichero': 'contenido' | { content, mode, owner } }.

export function buildFs(flat = {}) {
  const root = { type: 'dir', children: {}, mode: 'rwxr-xr-x', owner: 'root' };
  for (const [path, spec] of Object.entries(flat)) {
    const isDir = path.endsWith('/');
    const parts = path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      if (last && !isDir) {
        const s = typeof spec === 'string' ? { content: spec } : spec;
        node.children[part] = { type: 'file', content: s.content || '', mode: s.mode || 'rw-r--r--', owner: s.owner || 'root' };
      } else {
        if (!node.children[part]) node.children[part] = { type: 'dir', children: {}, mode: 'rwxr-xr-x', owner: (typeof spec === 'object' && spec && spec.owner) || 'root' };
        node = node.children[part];
      }
    });
  }
  return root;
}

export function normalize(cwd, path, home = '/') {
  let p = path || '';
  if (p === '~' || p.startsWith('~/')) p = home + p.slice(1);
  const abs = p.startsWith('/') ? p : `${cwd}/${p}`;
  const out = [];
  for (const seg of abs.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return `/${out.join('/')}`;
}

export function lookup(root, abs) {
  if (abs === '/') return root;
  let node = root;
  for (const part of abs.split('/').filter(Boolean)) {
    if (!node || node.type !== 'dir') return null;
    node = node.children[part];
  }
  return node || null;
}

export function parentOf(root, abs) {
  const parts = abs.split('/').filter(Boolean);
  const name = parts.pop();
  return { dir: lookup(root, `/${parts.join('/')}`), name };
}

export function writeFile(root, abs, content, append = false, owner = 'root') {
  const { dir, name } = parentOf(root, abs);
  if (!dir || dir.type !== 'dir') return false;
  const cur = dir.children[name];
  if (cur && cur.type === 'dir') return false;
  if (cur) cur.content = append ? cur.content + content : content;
  else dir.children[name] = { type: 'file', content, mode: 'rw-r--r--', owner };
  return true;
}

export function removeNode(root, abs) {
  const { dir, name } = parentOf(root, abs);
  if (!dir || !dir.children[name]) return false;
  delete dir.children[name];
  return true;
}

/** Recorre el árbol y devuelve todas las rutas absolutas. */
export function walk(root, base = '/') {
  const out = [];
  const rec = (node, path) => {
    out.push({ path, node });
    if (node.type === 'dir') {
      for (const [name, child] of Object.entries(node.children)) rec(child, path === '/' ? `/${name}` : `${path}/${name}`);
    }
  };
  rec(lookup(root, base) || root, base);
  return out;
}

/** Convierte 'rwxr-xr--' ⇄ '754'. */
export function modeToOctal(mode) {
  return [0, 3, 6].map((i) => (mode[i] === 'r' ? 4 : 0) + (mode[i + 1] === 'w' ? 2 : 0) + (mode[i + 2] === 'x' ? 1 : 0)).join('');
}
export function octalToMode(oct) {
  return String(oct).split('').map((d) => {
    const n = Number(d);
    return `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`;
  }).join('');
}
