import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<any> {
    return await this.studentsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id) as Promise<any>;
  }

  @Post()
  @Roles('admin')
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.studentsService.create(body);
  }
}
