import { ApiProperty } from "@nestjs/swagger";

export class AdminRevenueInsightDto {
  @ApiProperty({
    example:
      "Tổng GMV toàn sàn đạt 1.25 tỷ VND, phí sàn thu về 62.5 triệu VND với mức tăng trưởng 18.4% so với kỳ trước. Dòng tiền duy trì ổn định.",
    description:
      "Đánh giá sức khỏe tài chính toàn sàn, tăng trưởng GMV và doanh thu phí nền tảng",
  })
  platform_financial_health!: string;

  @ApiProperty({
    example:
      "Top 3 đối tác lớn nhất (Spacespeakers, Mây Lang Thang, Chillies Ent) đang chiếm 74% tổng giá trị giao dịch toàn sàn.",
    description:
      "Nhận xét về mức độ tập trung thị phần và hiệu suất hoạt động của các đối tác tổ chức",
  })
  top_organizers_performance!: string;

  @ApiProperty({
    example: [
      "Show 'Acoustic Sunset' sắp diễn ra trong 5 ngày tới nhưng tỷ lệ lấp đầy mới đạt 26%, cần hỗ trợ đẩy banner quảng bá.",
      "Đối tác Indie Records ghi nhận lượng đơn huỷ tăng nhẹ 4.2% trong tuần qua.",
    ],
    description: "Danh sách các cảnh báo rủi ro vận hành cần SuperAdmin lưu ý",
    type: [String],
  })
  risk_alerts!: string[];

  @ApiProperty({
    example: [
      "Mở rộng chính sách ưu đãi phí sàn 3% cho các sự kiện Workshop để đa dạng hóa danh mục sản phẩm.",
      "Tăng cường tính năng gợi ý thông minh trên trang chủ vào dịp cuối tuần để tăng tỷ lệ chuyển đổi vé.",
    ],
    description:
      "Đề xuất chiến lược phát triển sàn và tối ưu doanh thu toàn hệ thống",
    type: [String],
  })
  platform_growth_strategies!: string[];

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
