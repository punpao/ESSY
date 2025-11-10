import { FastifyReply } from 'fastify';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const handleApiError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof ApiError) {
    return reply.code(error.status).send({ message: error.message });
  }
  return reply.code(500).send({ message: 'เกิดข้อผิดพลาดในระบบ' });
};
