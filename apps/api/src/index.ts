import { config } from './config';
import { buildServer } from './server';
import { scheduleRecurringJobs, startWorkers } from './workers/autoReleaseWorker';

async function main() {
  const app = await buildServer();
  await scheduleRecurringJobs();
  startWorkers();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`API running at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
