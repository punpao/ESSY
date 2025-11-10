import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      role: "buyer" | "seller" | "admin";
    };
    user: {
      userId: string;
      role: "buyer" | "seller" | "admin";
    };
  }
}
