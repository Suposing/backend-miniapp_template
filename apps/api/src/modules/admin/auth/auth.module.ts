import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { RefreshTokenCleanupService } from './refresh-token-cleanup.service';
import { getJwtExpiresIn, getJwtSecret } from '../../../config/env';

@Module({
    imports: [
        PassportModule,
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
        JwtModule.register({
            secret: getJwtSecret(),
            signOptions: {
                expiresIn: getJwtExpiresIn(),
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        PermissionsGuard,
        RefreshTokenCleanupService,
    ],
    exports: [AuthService, PermissionsGuard, JwtModule],
})
export class AuthModule {}
