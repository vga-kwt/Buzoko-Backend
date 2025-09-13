import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as os from 'os';

dotenv.config();

function getLanIPv4Addresses(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    })
  );

  // Global response wrapper
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());

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
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Server listening on http://${host}:${port}`);
  console.log(`Swagger docs available at http://${host}:${port}/api/docs`);

  // Helpful LAN URLs for access from other devices on the same network
  const lanIps = getLanIPv4Addresses();
  if (lanIps.length) {
    console.log('You can access this server from another device on your LAN at:');
    lanIps.forEach((ip) => {
      console.log(`  - http://${ip}:${port}`);
      console.log(`    Swagger: http://${ip}:${port}/api/docs`);
    });
  }
}
bootstrap();
