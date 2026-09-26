import { Module } from '@nestjs/common';
import { ConcertRepository } from './repositories/concert.repository';
import { VenueRepository } from './repositories/venue.repository';
import { PrismaService } from '../../shared/prisma.service';
import { ConcertService } from './services/concert.service';
import { VenueService } from './services/venue.service';
import { ConcertController } from './controllers/concert.controller';
import { VenueController } from './controllers/venue.controller';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RedisModule } from '../../shared/redis/redis.module';
import { TicketingModule } from '../ticketing/ticketing.module';
import { ConcertDetailRateLimitGuard } from './guards/concert-detail-rate-limit.guard';

@Module({
  imports: [RedisModule, TicketingModule],
  providers: [
    PrismaService,
    ConcertRepository,
    VenueRepository,
    ConcertService,
    VenueService,
    RolesGuard,
    ConcertDetailRateLimitGuard,
  ],
  controllers: [ConcertController, VenueController],
  exports: [ConcertRepository, VenueRepository, ConcertService, VenueService],
})
export class CatalogModule { }
