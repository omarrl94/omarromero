// Rasteriza un puñado de iconos de react-icons a PNG para insertarlos en el deck.
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import sharp from 'sharp';
import * as Lu from 'react-icons/lu';

const MAPA = {
  brujula: Lu.LuCompass,
  libro: Lu.LuBookOpen,
  lista: Lu.LuClipboardList,
  cerebro: Lu.LuBrain,
  balanza: Lu.LuScale,
  ruta: Lu.LuRoute,
  gema: Lu.LuGem,
  escudo: Lu.LuShieldCheck,
  descarga: Lu.LuDownload,
  codigo: Lu.LuCodeXml,
  catalogo: Lu.LuLayers,
  aviso: Lu.LuTriangleAlert ?? Lu.LuAlertTriangle,
  cohete: Lu.LuRocket,
  diana: Lu.LuTarget,
  personas: Lu.LuUsers,
  refresco: Lu.LuRefreshCw,
};

export async function generarIconos(color = '#1A1A1A') {
  const salida = {};
  for (const [nombre, Componente] of Object.entries(MAPA)) {
    if (!Componente) throw new Error(`Icono no encontrado: ${nombre}`);
    const svg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Componente, { color, size: 256, strokeWidth: 2 }),
    );
    const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
    salida[nombre] = 'image/png;base64,' + png.toString('base64');
  }
  return salida;
}
