import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AddTeacherDto } from './dto/add-teacher.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateClassTimeDto } from './dto/create-class-time.dto';
import { UpdateClassTimeDto } from './dto/update-class-time.dto';

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

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateClassDto) {
    return this.classesService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  // ---- times ----
  @Get(':id/times')
  @Roles('admin')
  listTimes(@Param('id') id: string) {
    return this.classesService.listTimes(id);
  }

  @Post(':id/times')
  @Roles('admin')
  addTime(@Param('id') id: string, @Body() dto: CreateClassTimeDto) {
    return this.classesService.addTime(id, dto);
  }

  @Put(':id/times/:timeId')
  @Roles('admin')
  updateTime(
    @Param('id') id: string,
    @Param('timeId') timeId: string,
    @Body() dto: UpdateClassTimeDto,
  ) {
    return this.classesService.updateTime(id, timeId, dto);
  }

  @Delete(':id/times/:timeId')
  @Roles('admin')
  removeTime(@Param('id') id: string, @Param('timeId') timeId: string) {
    return this.classesService.removeTime(id, timeId);
  }
}
