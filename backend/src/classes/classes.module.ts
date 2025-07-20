import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, PrismaService],
})
export class ClassesModule {}
