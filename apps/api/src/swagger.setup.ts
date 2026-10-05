import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BAO BAO — API')
    .setDescription(
      'Community transportation platform for Talibon, Bohol. Unified API serving Passenger, App Driver, SMS Driver, and Terminal Dispatcher channels.',
    )
    .setVersion('1.0.0-mvp')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BAO BAO API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
