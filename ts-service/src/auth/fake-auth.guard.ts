import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { Recruiter } from '../entities/recruiter.entity';
import { AuthUser } from './auth.types';

@Injectable()
export class FakeAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Recruiter)
    private recruiterRepository: Repository<Recruiter>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const userIdHeader = request.header('x-user-id');
    const workspaceIdHeader = request.header('x-workspace-id');

    if (!userIdHeader || !workspaceIdHeader) {
      throw new UnauthorizedException(
        'Missing required headers: x-user-id and x-workspace-id',
      );
    }

    const recruiter = await this.recruiterRepository.findOne({
      where: { id: userIdHeader, workspaceId: workspaceIdHeader },
    });

    if (!recruiter) {
      throw new UnauthorizedException(
        'User not assigned to this workspace',
      );
    }

    const user: AuthUser = {
      userId: userIdHeader,
      workspaceId: workspaceIdHeader,
    };

    request.user = user;
    return true;
  }
}
