import { ApiProperty } from "@nestjs/swagger";

export class UserProfileDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Nguyen Van A" })
  fullName!: string;

  @ApiProperty({ example: ["Audience"] })
  roles!: string[];

  @ApiProperty({ example: ["CREATE_CONCERT", "UPDATE_CONCERT"] })
  permissions!: string[];
}

export class LoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIs..." })
  accessToken!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}

export class RegisterResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Nguyen Van A" })
  fullName!: string;

  @ApiProperty({ example: "ACTIVE" })
  status!: string;

  @ApiProperty({ example: ["Audience"] })
  roles!: string[];
}
