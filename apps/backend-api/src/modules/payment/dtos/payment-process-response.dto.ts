import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentProcessResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    payment_transaction_id!: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    order_id!: string;

    @ApiProperty({ example: 'VNPAY' })
    payment_method!: string;

    @ApiProperty({ example: 'INIT' })
    status!: string;

    @ApiProperty({ example: 'SUCCESS' })
    gateway_status!: string;

    @ApiPropertyOptional({ example: 'https://payments.tixora.local/checkout/...' })
    checkout_url?: string | null;

    @ApiPropertyOptional({ example: '00020101021238580010A000000727012800069704070114...6304D1B5' })
    qr_code?: string | null;

    @ApiPropertyOptional({ example: 'TICKET BOX VN' })
    account_name?: string | null;

    @ApiProperty({ example: '8a0d2b4e-3d1e-4b89-a9ff-65de6f7ccabc' })
    idempotency_key!: string;

    @ApiProperty({ example: 'CLOSED' })
    circuit_breaker_state!: string;

    constructor(partial: Partial<PaymentProcessResponseDto> = {}) {
        Object.assign(this, partial);
    }
}