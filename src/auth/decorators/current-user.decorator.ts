import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ValidRoles } from '../enums/valid-roles.enum';

export const CurrentUser = createParamDecorator(
  (roles: ValidRoles[] = [], context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    if (!user) {
      throw new InternalServerErrorException(
        'No user inside the request - make sure thet we used the authGuard',
      );
    }

    if (roles.length === 0) return user;

    for (const role of user.roles) {
      // todo: Eliminar Valid roles
      if (roles.includes(role)) {
        return user;
      }
    }

    throw new ForbiddenException(
      `User ${user.fullName} nedd a valid [${roles}]`,
    );
  },
);
