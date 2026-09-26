import { ConcertEntity } from "./concert.entity";
import { TicketTierDto } from "./ticket-tier.dto";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO returned by catalog queries for a concert
 */
export class ConcertResponseDto extends ConcertEntity {
  @ApiProperty({ type: [TicketTierDto] })
  ticketTiers: TicketTierDto[] = [];

  constructor(partial: Partial<ConcertResponseDto> = {}) {
    super(partial);
    Object.assign(this, partial);
  }
}
