import { Module } from '@nestjs/common';
import { TestDbService } from './test-db.service';
import { TestDbController } from './test-db.controller';
 
@Module({
  providers: [TestDbService],
  controllers: [TestDbController],
})
export class TestDbModule {}