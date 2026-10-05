import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './apps/api/src/app.module';
import { AllExceptionsFilter } from './apps/api/src/common/filters/all-exceptions.filter';
import { setupSwagger } from './apps/api/src/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global prefix for API
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/docs'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger docs
  setupSwagger(app);

  // Mount Vite middleware for React Frontend
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use((req: any, res: any, next: any) => {
      const url = req.originalUrl || req.url || '';
      console.log(`[HTTP] ${req.method} ${url}`);
      if (
        url.startsWith('/api') ||
        url.startsWith('/health') ||
        url.startsWith('/webhooks')
      ) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  }

  const port = 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`\n======================================================`);
  console.log(`  BAO BAO Platform running on http://localhost:${port}`);
  console.log(`  - Web App:      http://localhost:${port}/`);
  console.log(`  - API Base:     http://localhost:${port}/api/v1`);
  console.log(`  - Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(`  - Health Check: http://localhost:${port}/health`);
  console.log(`======================================================\n`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
