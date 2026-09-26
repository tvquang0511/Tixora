import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from, of, switchMap } from "rxjs";
import { RedisService } from "../../../shared/redis";
import { PaymentProcessResponseDto } from "../dtos/payment-process-response.dto";

type IdempotencyCacheEntry = {
  state: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response?: PaymentProcessResponseDto;
  created_at?: string;
  updated_at?: string;
  error?: string;
};

@Injectable()
export class PaymentIdempotencyInterceptor implements NestInterceptor {
  private readonly idempotencyCachePrefix = "payments:idempotency:";

  constructor(private readonly redisService: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const normalizedKey = this.normalizeIdempotencyKey(
      request.headers["idempotency-key"],
    );

    if (!normalizedKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }

    request.paymentTracking = {
      ...(request.paymentTracking ?? {}),
      idempotencyKey: normalizedKey,
    };

    const cacheKey = `${this.idempotencyCachePrefix}${normalizedKey}`;
    return from(
      this.redisService.getJson<
        IdempotencyCacheEntry | PaymentProcessResponseDto
      >(cacheKey),
    ).pipe(
      switchMap((cached) => {
        const completed = this.extractCompletedResponse(cached);
        if (completed) {
          return of(completed);
        }

        return next.handle();
      }),
    );
  }

  private normalizeIdempotencyKey(value: unknown): string {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") {
      return "";
    }

    const normalized = raw.trim();
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4.test(normalized) ? normalized : "";
  }

  private extractCompletedResponse(
    value: IdempotencyCacheEntry | PaymentProcessResponseDto | null,
  ): PaymentProcessResponseDto | null {
    if (!value) {
      return null;
    }

    if (value instanceof PaymentProcessResponseDto) {
      return value;
    }

    if ("state" in value && value.state === "COMPLETED" && value.response) {
      return new PaymentProcessResponseDto(
        value.response as unknown as PaymentProcessResponseDto,
      );
    }

    if ("payment_transaction_id" in value) {
      return new PaymentProcessResponseDto(
        value as unknown as PaymentProcessResponseDto,
      );
    }

    return null;
  }
}
