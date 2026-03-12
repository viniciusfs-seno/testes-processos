import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class TestDbService {
  constructor(private configService: ConfigService) {}

  async testDB1() {
    const dataSource = new DataSource({
      type: 'oracle',
      host: this.configService.get('DB1_HOST'),
      port: this.configService.get('DB1_PORT'),
      username: this.configService.get('DB1_USER'),
      password: this.configService.get('DB1_PASS'),
      sid: this.configService.get('DB1_SID'),
    });

    try {
      const startTime = Date.now();
      await dataSource.initialize();
      const result = await dataSource.query('SELECT 1 AS TEST FROM DUAL');
      const endTime = Date.now();
      await dataSource.destroy();

      return {
        database: 'DB1 - Emporium Lojas (Oracle SID)',
        status: 'success',
        message: 'Conexão criada, testada e encerrada com sucesso',
        responseTime: `${endTime - startTime}ms`,
        connected: true,
        result,
      };
    } catch (error) {
      if (dataSource.isInitialized) await dataSource.destroy();
      return {
        database: 'DB1 - Emporium Lojas',
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }

  async testDB2() {
    const dataSource = new DataSource({
      type: 'oracle',
      host: this.configService.get('DB2_HOST'),
      port: this.configService.get('DB2_PORT'),
      username: this.configService.get('DB2_USER'),
      password: this.configService.get('DB2_PASS'),
      serviceName: this.configService.get('DB2_SERVICE_NAME'),
    });

    try {
      const startTime = Date.now();
      await dataSource.initialize();
      const result = await dataSource.query('SELECT 1 AS TEST FROM DUAL');
      const endTime = Date.now();
      await dataSource.destroy();

      return {
        database: 'DB2 - Emporium Atacado (Oracle ServiceName)',
        status: 'success',
        message: 'Conexão criada, testada e encerrada com sucesso',
        responseTime: `${endTime - startTime}ms`,
        connected: true,
        result,
      };
    } catch (error) {
      if (dataSource.isInitialized) await dataSource.destroy();
      return {
        database: 'DB2 - Emporium Atacado',
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }

  async testDB3() {
    const dataSource = new DataSource({
      type: 'oracle',
      host: this.configService.get('DB3_HOST'),
      port: this.configService.get('DB3_PORT'),
      username: this.configService.get('DB3_USER'),
      password: this.configService.get('DB3_PASS'),
      serviceName: this.configService.get('DB3_SERVICE_NAME'),
    });

    try {
      const startTime = Date.now();
      await dataSource.initialize();
      const result = await dataSource.query('SELECT 1 AS TEST FROM DUAL');
      const endTime = Date.now();
      await dataSource.destroy();

      return {
        database: 'DB3 - CONSINCO (Oracle ServiceName)',
        status: 'success',
        message: 'Conexão criada, testada e encerrada com sucesso',
        responseTime: `${endTime - startTime}ms`,
        connected: true,
        result,
      };
    } catch (error) {
      if (dataSource.isInitialized) await dataSource.destroy();
      return {
        database: 'DB3 - CONSINCO',
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }

  async testDB4() {
    const dataSource = new DataSource({
      type: 'mysql',
      host: this.configService.get('DB4_HOST'),
      port: Number(this.configService.get('DB4_PORT')),
      username: this.configService.get('DB4_USER'),
      password: this.configService.get('DB4_PASS'),
      database: this.configService.get('DB4Context_DB'),
    });

    try {
      const startTime = Date.now();
      await dataSource.initialize();
      const result = await dataSource.query('SELECT 1 AS TEST');
      const endTime = Date.now();
      await dataSource.destroy();

      return {
        database: 'DB4 - Emporium Farmácias (MySQL)',
        status: 'success',
        message: 'Conexão criada, testada e encerrada com sucesso',
        responseTime: `${endTime - startTime}ms`,
        connected: true,
        result,
      };
    } catch (error) {
      if (dataSource.isInitialized) await dataSource.destroy();
      return {
        database: 'DB4 - Emporium Farmácias',
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }

  async testDB5() {
    const dataSource = new DataSource({
      type: 'oracle',
      username: this.configService.get('DB5_USER'),
      password: this.configService.get('DB5_PASS'),
      connectString: this.configService.get('DB5_SERVICE_NAME'), // ← corrigido
    });

    try {
      const startTime = Date.now();
      await dataSource.initialize();
      const result = await dataSource.query('SELECT 1 AS TEST FROM DUAL');
      const endTime = Date.now();
      await dataSource.destroy();

      return {
        database: 'DB5 - MDLog (Oracle connectString)',
        status: 'success',
        message: 'Conexão criada, testada e encerrada com sucesso',
        responseTime: `${endTime - startTime}ms`,
        connected: true,
        result,
      };
    } catch (error) {
      if (dataSource.isInitialized) await dataSource.destroy();
      return {
        database: 'DB5 - MDLog',
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }

  async testAll() {
    const results = {
      db1: await this.testDB1(),
      db2: await this.testDB2(),
      db3: await this.testDB3(),
      db4: await this.testDB4(),
      db5: await this.testDB5(),
    };

    const allSuccess = Object.values(results).every((r) => r.status === 'success');

    return {
      status: allSuccess ? 'all_connected' : 'some_failed',
      timestamp: new Date().toISOString(),
      results,
    };
  }
}
