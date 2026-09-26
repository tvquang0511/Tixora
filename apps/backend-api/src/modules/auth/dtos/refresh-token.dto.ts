import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIs...",
    description: "Mã Refresh Token dài hạn được cấp khi đăng nhập",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
