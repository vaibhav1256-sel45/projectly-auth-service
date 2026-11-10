import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger } from 'nestjs-pino';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
async function bootstrap() {
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});

app.useLogger(app.get(Logger));

app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(
        import.meta.dirname,
        './proto/auth.proto',
      ),
      url: app.get(ConfigService).getOrThrow<string>('grpc.url'),
      loader: { keepCase: true },
    },
  });


  await app.startAllMicroservices();
  // Health check: answered by the HTTP adapter itself, so no auth guard or response wrapper is involved.
  app.getHttpAdapter().get('/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok', service: 'auth-service', uptime: Math.round(process.uptime()) }),
  );

  // Graceful shutdown: on SIGTERM / SIGINT the app stops taking requests, closes the gRPC and
  // RabbitMQ listeners, and lets the database / Redis connections close before the process exits.
  app.enableShutdownHooks();

   await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
