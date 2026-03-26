import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as oracledb from 'oracledb';

async function bootstrap() {
  // Tenta Thick mode via PATH primeiro, depois fallback para caminho explícito
  try {
    oracledb.initOracleClient();
    console.log('Oracle Thick mode ativado via PATH');
  } catch {
    try {
      oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_19_30' });
      console.log('Oracle Thick mode ativado via caminho explícito');
    } catch (err) {
      console.warn(
        'Oracle Thick mode não disponível — usando Thin mode:',
        err.message,
      );
      // Thin mode continua funcionando para DB1, DB2, DB3 (versões modernas)
    }
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
