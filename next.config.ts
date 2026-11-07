import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El cliente de Prisma usa el driver `pg`; no lo empaquetamos en el bundle del servidor.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
