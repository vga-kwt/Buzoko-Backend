import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');

  // Register a simple root GET route to verify the server is running (http://localhost:3000/)
  const httpAdapter: any = app.getHttpAdapter();
  const instance = httpAdapter?.getInstance?.();
  if (instance && typeof instance.get === 'function') {
    instance.get('/', (_req: any, res: any) => res.send('Server is running'));
  }

  const config = new DocumentBuilder()
    .setTitle('Buzoku API')
    .setDescription('Buzoku backend APIs')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
