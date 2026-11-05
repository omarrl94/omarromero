import { Layout } from './components/Layout';
import { Vacio } from './components/Estados';
import { useRuta } from './lib/ruta';
import { Empresas } from './pages/Empresas';
import { FichaEmpresa } from './pages/FichaEmpresa';
import { Ofertas } from './pages/Ofertas';
import { Perfil } from './pages/Perfil';
import { Portada } from './pages/Portada';
import { Privacidad } from './pages/Privacidad';
import { Seguimiento } from './pages/Seguimiento';
import { useEffect } from 'react';

const TITULOS: Record<string, string> = {
  '': 'Inicio',
  empresas: 'Empresas',
  ofertas: 'Ofertas',
  seguimiento: 'Seguimiento',
  perfil: 'Mis datos',
  privacidad: 'Privacidad',
};

export function App() {
  const [seccion = '', id] = useRuta();

  useEffect(() => {
    document.title = `${TITULOS[seccion] ?? 'Página no encontrada'} · Conecta FFE`;
  }, [seccion]);

  let pagina;
  if (seccion === '') pagina = <Portada />;
  else if (seccion === 'empresas' && id) pagina = <FichaEmpresa id={id} />;
  else if (seccion === 'empresas') pagina = <Empresas />;
  else if (seccion === 'ofertas') pagina = <Ofertas />;
  else if (seccion === 'seguimiento') pagina = <Seguimiento />;
  else if (seccion === 'perfil') pagina = <Perfil />;
  else if (seccion === 'privacidad') pagina = <Privacidad />;
  else pagina = <Vacio titulo="Página no encontrada"><a className="enlace" href="#/">Volver al inicio</a></Vacio>;

  return <Layout>{pagina}</Layout>;
}
