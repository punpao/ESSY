import { buildServer } from './app'
import { env } from './env'
import { initJobRunner } from './jobs/queue'

const start = async () => {
  const app = buildServer()

  await app.ready()

  const jobs = initJobRunner(app.prisma)

  const close = async () => {
    await jobs.close()
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', close)
  process.on('SIGTERM', close)

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    app.log.info(`API started on http://localhost:${env.PORT}`)
  } catch (error) {
    app.log.error(error)
    await close()
  }
}

void start()
