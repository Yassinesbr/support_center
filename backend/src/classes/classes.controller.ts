import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AddTeacherDto } from './dto/add-teacher.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.classesService.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() body: CreateClassDto) {
    return this.classesService.create(body);
  }

  @Post(':id/add-student')
  @Roles('admin')
  addStudent(@Param('id') classId: string, @Body() body: AddStudentDto) {
    return this.classesService.addStudent(classId, body.studentId);
  }

  @Post(':id/add-teacher')
  @Roles('admin')
  addTeacher(@Param('id') classId: string, @Body() body: AddTeacherDto) {
    return this.classesService.addTeacher(classId, body.teacherId);
  }
}
