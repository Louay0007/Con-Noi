import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe' })
  check() {
    // 1 = connected. Report it so a container orchestrator can restart us
    // when the database goes away, instead of serving 500s silently.
    const dbUp = this.connection.readyState === 1;
    return {
      status: dbUp ? 'ok' : 'degraded',
      database: dbUp ? 'connected' : 'disconnected',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
