import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OrderPaymentTransactionDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "VNPAY" })
  payment_method!: string;

  @ApiPropertyOptional({ example: "SUCCESS" })
  status?: string | null;

  @ApiPropertyOptional({ example: "txn_3rd_party_123" })
  transaction_id_3rd_party?: string | null;

  @ApiProperty({ example: "100000.00" })
  amount!: string;

  @ApiProperty({ example: "idempotency-key-uuid" })
  idempotency_key!: string;

  @ApiPropertyOptional({ type: Object })
  raw_response?: Record<string, unknown> | null;

  @ApiProperty({ format: "date-time" })
  created_at!: Date;

  @ApiProperty({ format: "date-time" })
  updated_at!: Date;

  constructor(partial: Partial<OrderPaymentTransactionDto> = {}) {
    Object.assign(this, partial);
  }
}
