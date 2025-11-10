import Fastify from 'fastify';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const fastify = Fastify({
  logger: true
});

const start = async () => {
  try {
    await buildApp(fastify, config);
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`API listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
