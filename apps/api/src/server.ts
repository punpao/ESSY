import { buildApp } from './app';
import { env } from './env';

const port = Number(process.env.PORT ?? 4000);

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`API listening on http://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
