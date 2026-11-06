import { useEffect } from 'react';
import { Entrar, Puerta } from './components/Cuenta';
import { Layout } from './components/Layout';
import { Vacio } from './components/Estados';
import { useParametros, useRuta } from './lib/ruta';
import { Admin } from './pages/Admin';
import { Empresas } from './pages/Empresas';
import { FichaEmpresa } from './pages/FichaEmpresa';
import { Ofertas } from './pages/Ofertas';
import { Perfil } from './pages/Perfil';
import { Portada } from './pages/Portada';
import { Privacidad } from './pages/Privacidad';
import { Seguimiento } from './pages/Seguimiento';
import { Tutores } from './pages/Tutores';

const TITULOS: Record<string, string> = {
  '': 'Inicio',
  entrar: 'Entrar',
  empresas: 'Empresas',
  ofertas: 'Ofertas',
  seguimiento: 'Seguimiento',
  perfil: 'Mis datos',
  privacidad: 'Privacidad',
  tutores: 'Tutores',
  admin: 'Usuarios y roles',
};

const TODOS = ['alumno', 'tutor', 'superadmin'] as const;

export function App() {
  const [seccion = '', id, subseccion] = useRuta();
  const parametros = useParametros();

  useEffect(() => {
    document.title = `${TITULOS[seccion] ?? 'Página no encontrada'} · Conecta FFE`;
  }, [seccion]);

  let pagina;
  if (seccion === '') pagina = <Portada />;
  else if (seccion === 'entrar') pagina = <Entrar verificado={parametros.get('verificado') === '1'} />;
  else if (seccion === 'empresas' && id) pagina = <Puerta roles={[...TODOS]}><FichaEmpresa id={id} seccion={subseccion} /></Puerta>;
  else if (seccion === 'empresas') pagina = <Puerta roles={[...TODOS]}><Empresas /></Puerta>;
  else if (seccion === 'ofertas') pagina = <Puerta roles={[...TODOS]}><Ofertas /></Puerta>;
  else if (seccion === 'seguimiento') pagina = <Puerta roles={['alumno']}><Seguimiento /></Puerta>;
  else if (seccion === 'perfil') pagina = <Puerta roles={[...TODOS]}><Perfil /></Puerta>;
  else if (seccion === 'tutores') pagina = <Puerta roles={['tutor', 'superadmin']}><Tutores /></Puerta>;
  else if (seccion === 'admin') pagina = <Puerta roles={['superadmin']}><Admin /></Puerta>;
  else if (seccion === 'privacidad') pagina = <Privacidad />;
  else pagina = <Vacio titulo="Página no encontrada"><a className="enlace" href="#/">Volver al inicio</a></Vacio>;

  return <Layout>{pagina}</Layout>;
}
