import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SuggestedTicketTierDto {
  @ApiProperty({ example: "VIP 1" })
  name!: string;

  @ApiPropertyOptional({ example: 1500000 })
  estimated_price?: number;
}

export class EventDraftDto {
  @ApiProperty({
    example: "Live Concert Chillies - Trên Những Đám Mây",
    description: "Tên sự kiện trích xuất từ tài liệu",
  })
  name!: string;

  @ApiProperty({
    example:
      "Đêm nhạc kỷ niệm chặng đường âm nhạc với sân khấu chuẩn quốc tế...",
    description: "Mô tả chi tiết sự kiện do AI soạn thảo chuyên nghiệp",
  })
  description!: string;

  @ApiProperty({
    example: "CONCERT",
    description:
      "Thể loại sự kiện: CONCERT, FESTIVAL, ACOUSTIC, WORKSHOP, OTHER",
  })
  category!: string;

  @ApiPropertyOptional({
    example: "Sân vận động Quân khu 7, TP.HCM",
    description: "Địa điểm hoặc khán phòng gợi ý",
  })
  suggested_location?: string;

  @ApiProperty({
    example: ["Chillies", "Vũ", "Trang"],
    description: "Danh sách nghệ sĩ/ban nhạc tham gia trích xuất từ tài liệu",
    type: [String],
  })
  performers!: string[];

  @ApiProperty({
    example:
      "Đêm nhạc bùng nổ quy tụ những bản hit được phối lại hoàn toàn mới...",
    description:
      "Tóm tắt điểm nhấn đêm nhạc để hiển thị cho khán giả (lưu vào ai_bio)",
  })
  ai_bio!: string;

  @ApiPropertyOptional({
    example: "Độ tuổi 12+. Không mang đồ uống có cồn, máy ảnh chuyên nghiệp.",
    description: "Quy định vào cổng và lưu ý tham dự",
  })
  house_rules?: string;

  @ApiPropertyOptional({
    type: [SuggestedTicketTierDto],
    description: "Danh sách các hạng vé phát hiện trong kế hoạch",
  })
  suggested_ticket_tiers?: SuggestedTicketTierDto[];
}
