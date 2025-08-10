import { IsArray, IsString } from 'class-validator';

export class SetStudentClassesDto {
  @IsArray()
  @IsString({ each: true })
  classIds!: string[]; // can be [], replace entire set
}
