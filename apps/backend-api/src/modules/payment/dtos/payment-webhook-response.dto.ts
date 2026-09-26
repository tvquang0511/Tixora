import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaymentWebhookResponseDto {
  @ApiProperty({ example: "PAID" })
  order_status!: string;

  @ApiProperty({ example: "SUCCESS" })
  payment_status!: string;

  @ApiProperty({ example: 2 })
  ticket_count!: number;

  @ApiProperty({ example: "payment webhook processed" })
  message!: string;

  @ApiPropertyOptional({ example: ["ticket_uuid_1", "ticket_uuid_2"] })
  ticket_ids?: string[];

  constructor(partial: Partial<PaymentWebhookResponseDto> = {}) {
    Object.assign(this, partial);
  }
}
