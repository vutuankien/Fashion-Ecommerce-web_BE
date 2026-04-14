import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RolesGuard } from './roles.guard';
import { UserCache } from '../user/user.cache';
import { UserRepository } from '../user/user.repository';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'default-secret-key',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, TokenService, PasswordService, PrismaService, RolesGuard, UserCache, UserRepository],
    exports: [TokenService, AuthService, RolesGuard],
    controllers: [AuthController],
})
export class AuthModule {}
