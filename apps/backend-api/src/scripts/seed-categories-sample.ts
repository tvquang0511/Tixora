import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating categories and seeding sample concerts...');

  // Update existing
  await prisma.concert.updateMany({
    where: { name: { contains: 'Anh Trai' } },
    data: { category: 'CONCERT' },
  });

  await prisma.concert.updateMany({
    where: { name: { contains: 'Mắt Nhắm Mắt Mở' } },
    data: { category: 'LIVE_MUSIC' },
  });

  // Check if we already added other sample categories
  const edm = await prisma.concert.findFirst({ where: { name: { contains: 'Ravolution' } } });
  if (!edm) {
    await prisma.concert.create({
      data: {
        name: 'Ravolution Asia Music Festival 2026',
        description: 'Đại tiệc âm nhạc điện tử bùng nổ quy tụ dàn DJ hàng đầu thế giới và Việt Nam với hệ thống sân khấu laser hoành tráng.',
        location: 'Khu Đô Thị Sala, TP. Thủ Đức, TP. Hồ Chí Minh',
        performers: ['Alan Walker', 'KSHMR', 'Hoaprox', 'Wukong'],
        ai_bio: 'Lễ hội EDM quy mô lớn nhất mùa hè với hàng vạn raver tham dự.',
        start_time: new Date('2026-11-20T17:00:00+07:00'),
        poster_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        category: 'EDM_NIGHTLIFE',
        ticket_categories: {
          create: [
            { name: 'GA Early Bird', price: 650000, total_quantity: 1000, max_per_user: 4, status: 'book_now' },
            { name: 'VIP Lounge', price: 1800000, total_quantity: 300, max_per_user: 4, status: 'book_now' },
          ],
        },
      },
    });
  }

  const festival = await prisma.concert.findFirst({ where: { name: { contains: 'Những Thành Phố Mơ Màng' } } });
  if (!festival) {
    await prisma.concert.create({
      data: {
        name: 'Những Thành Phố Mơ Màng - Year End Tour',
        description: 'Show ca nhạc indie quy tụ những giai điệu êm dịu, lãng mạn dành riêng cho những tâm hồn mộng mơ.',
        location: 'Công Viên Yên Sở, Hoàng Mai, Hà Nội',
        performers: ['Vũ', 'Chillies', 'Ngọt', 'Hoàng Dũng', 'Marzuz'],
        ai_bio: 'Tour diễn indie truyền thống đọng lại nhiều cảm xúc và ký ức thanh xuân.',
        start_time: new Date('2026-12-05T15:30:00+07:00'),
        poster_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        category: 'FESTIVAL',
        ticket_categories: {
          create: [
            { name: 'Vé Phổ Thông', price: 450000, total_quantity: 2000, max_per_user: 6, status: 'book_now' },
            { name: 'Vé Mơ Màng (Kèm quà)', price: 850000, total_quantity: 500, max_per_user: 4, status: 'book_now' },
          ],
        },
      },
    });
  }

  const theater = await prisma.concert.findFirst({ where: { name: { contains: 'Vở Nhạc Kịch Sóng' } } });
  if (!theater) {
    await prisma.concert.create({
      data: {
        name: 'Vở Nhạc Kịch "Sóng" - Chuyện Tình Xuân Quỳnh & Lưu Quang Vũ',
        description: 'Vở nhạc kịch thuần Việt được dàn dựng công phu, kết hợp thơ ca kinh điển với giai điệu dàn nhạc giao hưởng trực tiếp.',
        location: 'Nhà Hát Tuổi Trẻ, 11 Ngô Thì Nhậm, Hai Bà Trưng, Hà Nội',
        performers: ['Dàn nhạc Giao hưởng Trẻ', 'Nhà Hát Tuổi Trẻ Ensemble'],
        ai_bio: 'Tác phẩm nghệ thuật sân khấu đặc sắc được đánh giá cao bởi giới chuyên môn.',
        start_time: new Date('2026-10-18T19:45:00+07:00'),
        poster_url: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        category: 'THEATER_ARTS',
        ticket_categories: {
          create: [
            { name: 'Hạng Tiêu Chuẩn', price: 300000, total_quantity: 400, max_per_user: 4, status: 'book_now' },
            { name: 'Hạng VIP Khán Phòng', price: 700000, total_quantity: 150, max_per_user: 4, status: 'book_now' },
          ],
        },
      },
    });
  }

  const fanmeeting = await prisma.concert.findFirst({ where: { name: { contains: 'Fan Meeting' } } });
  if (!fanmeeting) {
    await prisma.concert.create({
      data: {
        name: 'HIEUTHUHAI & GERDNANG Special Fan Meeting 2026',
        description: 'Gặp gỡ, giao lưu thân mật cùng tổ đội GERDNANG, tham gia minigame và nhận chữ ký độc quyền.',
        location: 'Trung Tâm Triển Lãm & Hội Chợ Sài Gòn (SECC), Quận 7, TP. Hồ Chí Minh',
        performers: ['HIEUTHUHAI', 'HURRYKNG', 'NEGAV', 'MANBO'],
        ai_bio: 'Buổi họp fan ấm cúng và đầy bất ngờ dành cho cộng đồng người hâm mộ trung thành.',
        start_time: new Date('2026-11-28T14:00:00+07:00'),
        poster_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        category: 'FANMEETING',
        ticket_categories: {
          create: [
            { name: 'Vé Tham Dự Thường', price: 500000, total_quantity: 800, max_per_user: 2, status: 'book_now' },
            { name: 'Vé Fansign & Hi-Touch', price: 1500000, total_quantity: 100, max_per_user: 1, status: 'book_now' },
          ],
        },
      },
    });
  }

  const otherEvent = await prisma.concert.findFirst({ where: { name: { contains: 'Interactive Art & Sound' } } });
  if (!otherEvent) {
    await prisma.concert.create({
      data: {
        name: 'Triển Lãm Đa Giác Quan: Interactive Art & Sound Workshop',
        description: 'Không gian trải nghiệm công nghệ âm thanh 3D spatial audio kết hợp tranh chiếu tương tác nghệ thuật số.',
        location: 'Bảo tàng Mỹ thuật TP. Hồ Chí Minh, Quận 1',
        performers: ['Tixora Creative Lab', 'Sound Artists Club'],
        ai_bio: 'Sự kiện trải nghiệm công nghệ sáng tạo độc đáo phù hợp cho gia đình và giới trẻ.',
        start_time: new Date('2026-10-25T09:00:00+07:00'),
        poster_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        category: 'OTHER',
        ticket_categories: {
          create: [
            { name: 'Vé Trải Nghiệm Ngày', price: 200000, total_quantity: 500, max_per_user: 5, status: 'book_now' },
          ],
        },
      },
    });
  }

  console.log('Sample concerts verified and seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
