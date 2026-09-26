import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, randomUUID } from "crypto";

export abstract class AbstractPaymentStrategy {
  protected createProviderTransactionId(): string {
    return randomUUID();
  }

  protected ensureEnvironment(variableName: string, fallback?: string): string {
    const value = process.env[variableName] ?? fallback;
    if (!value) {
      throw new ServiceUnavailableException(
        `${variableName} is not configured`,
      );
    }

    return value;
  }

  protected stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entry]) =>
          `${JSON.stringify(key)}:${this.stableStringify(entry)}`,
      );

    return `{${entries.join(",")}}`;
  }

  protected signPayload(
    payload: unknown,
    secret: string,
    algorithm: "sha256" | "sha512" = "sha256",
  ): string {
    return createHmac(algorithm, secret)
      .update(this.stableStringify(payload))
      .digest("hex");
  }

  protected assertSignature(
    payload: unknown,
    signature: string | undefined,
    secret: string,
  ): void {
    if (!signature) {
      throw new BadRequestException("Missing payment signature");
    }

    const expected = this.signPayload(payload, secret);
    if (expected !== signature) {
      throw new UnauthorizedException("Invalid payment signature");
    }
  }
}
