/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La app es una sola pantalla sin render en servidor: se exporta como
  // estático y se publica en Firebase Hosting (plan gratuito, sin
  // funciones de por medio).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
