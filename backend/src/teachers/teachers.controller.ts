import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<any> {
    return await this.teachersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id) as Promise<any>;
  }

  @Post()
  @Roles('admin')
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.teachersService.create(body);
  }
}
