import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Recruiter } from '../entities/recruiter.entity';
import { FakeAuthGuard } from './fake-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Recruiter])],
  providers: [FakeAuthGuard],
  exports: [FakeAuthGuard, TypeOrmModule],
})
export class AuthModule {}
