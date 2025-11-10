import fp from "fastify-plugin";
import { EmailOtpService } from "../services/emailOtpService";

declare module "fastify" {
  interface FastifyInstance {
    emailOtp: EmailOtpService;
  }
}

export default fp(async (fastify) => {
  const emailOtp = new EmailOtpService(fastify.prisma);
  fastify.decorate("emailOtp", emailOtp);
});
