import { ApiProperty } from "@nestjs/swagger";

export class OrganizerRevenueInsightDto {
  @ApiProperty({
    example:
      "Lượng vé bán tập trung nhiều nhất vào khung giờ 20h00 - 22h30 các ngày thứ Sáu và thứ Bảy.",
    description:
      "Nhận xét về khung giờ vàng và thời điểm khán giả mua vé nhiều nhất",
  })
  peak_purchasing_hours!: string;

  @ApiProperty({
    example:
      "Hạng vé VIP 1 đã bán hết 92% công suất; tuy nhiên hạng vé GA Tầng 2 mới chỉ đạt 28% tỷ lệ lấp đầy.",
    description: "Phân tích tốc độ bán và hiệu suất của từng hạng vé",
  })
  tier_performance_analysis!: string;

  @ApiProperty({
    example: [
      "Kích hoạt chiến dịch Flash Sale 10% cho hạng vé GA trong 48 giờ tới để đẩy nhanh tỷ lệ lấp đầy.",
      "Đẩy mạnh bài đăng truyền thông và quảng cáo vào khung giờ 19h30 tối để đón đầu lượng khách chốt đơn.",
    ],
    description:
      "Danh sách 2-3 đề xuất chiến lược kích cầu cụ thể cho Ban tổ chức",
    type: [String],
  })
  tactical_recommendations!: string[];

  @ApiProperty({
    example:
      "Tổng thể các sự kiện đang đạt tỷ lệ lấp đầy trung bình 68.5%. Có 1 sự kiện chuẩn bị diễn ra trong 7 ngày tới cần tăng tốc bán vé.",
    description:
      "Tóm tắt về tỷ lệ lấp đầy khán phòng (occupancy rate) của các show",
  })
  occupancy_summary!: string;

  @ApiProperty({
    example: "2026-10-08T12:00:00.000Z",
    description: "Thời điểm AI hoàn thành phân tích",
  })
  analyzed_at!: string;

  @ApiProperty({
    example: true,
    description: "Đánh dấu dữ liệu được tải từ bộ nhớ đệm Redis Cache",
  })
  is_cached!: boolean;
}
