import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    // Payload we sign in /auth/telegram (tgId stored as string because BigInt isn't JSON-safe)
    payload: { tgId: string };
    // NOTE: we intentionally do NOT declare `user` here.
    // The canonical `request.user` shape ({ tgId: bigint; isAdmin: boolean })
    // is augmented in src/auth/middleware.ts and used across the app.
  }
}
