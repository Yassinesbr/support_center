import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    StudentsModule,
    UsersModule,
    TeachersModule,
    ClassesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
