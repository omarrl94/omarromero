// Nombre fijo de la cookie de sesión, usado tanto por NextAuth (Node) como por
// el middleware (Edge), para que ambos busquen exactamente la misma cookie y no
// se produzca un bucle de redirecciones en producción (https).
export const SESSION_COOKIE = "__Secure-next-auth.session-token";
