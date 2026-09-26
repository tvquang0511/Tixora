import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SAMPLE_VENUES = [
  {
    name: 'Sân vận động Quốc gia Mỹ Đình',
    city: 'Hà Nội',
    address: 'Đường Lê Đức Thọ, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội',
    capacity: 40192,
    svg_template_url: 'https://cdn.tixora.local/maps/my-dinh-stadium.svg',
    zone_presets: [
      { code: 'VIP_A', name: 'Khu VIP A (Sân khấu trái)', default_price: 3500000, default_color: '#f59e0b', gate_number: 1 },
      { code: 'VIP_B', name: 'Khu VIP B (Sân khấu phải)', default_price: 3500000, default_color: '#f59e0b', gate_number: 2 },
      { code: 'FANZONE', name: 'Fanzone Standing (Lòng sân)', default_price: 2200000, default_color: '#ec4899', gate_number: 3 },
      { code: 'STAND_A', name: 'Khán đài A (Tầng 1 có mái che)', default_price: 1800000, default_color: '#06b6d4', gate_number: 4 },
      { code: 'STAND_B', name: 'Khán đài B (Tầng 1 đối diện)', default_price: 1500000, default_color: '#3b82f6', gate_number: 5 },
      { code: 'STAND_CD', name: 'Khán đài C & D', default_price: 900000, default_color: '#8b5cf6', gate_number: 6 },
    ],
  },
  {
    name: 'Sân vận động Quân Khu 7',
    city: 'TP. Hồ Chí Minh',
    address: '202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh',
    capacity: 25000,
    svg_template_url: 'https://cdn.tixora.local/maps/quan-khu-7-stadium.svg',
    zone_presets: [
      { code: 'SVIP_CATWALK', name: 'Super VIP Cận Sân Khấu', default_price: 3800000, default_color: '#eab308', gate_number: 1 },
      { code: 'VIP_STANDING', name: 'VIP Đứng Lòng Sân', default_price: 2400000, default_color: '#a855f7', gate_number: 2 },
      { code: 'STAND_A_CENTER', name: 'Khán đài A Trung tâm', default_price: 1900000, default_color: '#06b6d4', gate_number: 3 },
      { code: 'STAND_B', name: 'Khán đài B', default_price: 1200000, default_color: '#3b82f6', gate_number: 4 },
      { code: 'GA_FESTIVAL', name: 'Khu Phổ Thông (GA)', default_price: 750000, default_color: '#10b981', gate_number: 5 },
    ],
  },
  {
    name: 'Trung tâm Hội chợ & Triển lãm Sài Gòn (SECC)',
    city: 'TP. Hồ Chí Minh',
    address: '799 Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    capacity: 15000,
    svg_template_url: 'https://cdn.tixora.local/maps/secc-hall-a.svg',
    zone_presets: [
      { code: 'VIP_LOUNGE', name: 'VIP Lounge & Sofa', default_price: 4500000, default_color: '#f59e0b', gate_number: 1 },
      { code: 'ZONE_A', name: 'Khu A (Gần Sân Khấu)', default_price: 2500000, default_color: '#ec4899', gate_number: 2 },
      { code: 'ZONE_B', name: 'Khu B (Trung Tâm)', default_price: 1600000, default_color: '#8b5cf6', gate_number: 3 },
      { code: 'GA_STANDARD', name: 'Khu GA Tiêu Chuẩn', default_price: 850000, default_color: '#3b82f6', gate_number: 4 },
    ],
  },
  {
    name: 'Nhà thi đấu Thể dục Thể thao Phú Thọ',
    city: 'TP. Hồ Chí Minh',
    address: '01 Lữ Gia, Phường 15, Quận 11, TP. Hồ Chí Minh',
    capacity: 8000,
    svg_template_url: 'https://cdn.tixora.local/maps/phu-tho-arena.svg',
    zone_presets: [
      { code: 'FLOOR_VIP', name: 'Sàn Đấu VIP (Kèm Ghế)', default_price: 2800000, default_color: '#eab308', gate_number: 1 },
      { code: 'TRIBUNE_EAST', name: 'Khán Đài Đông (Tầng 1)', default_price: 1600000, default_color: '#06b6d4', gate_number: 2 },
      { code: 'TRIBUNE_WEST', name: 'Khán Đài Tây (Tầng 1)', default_price: 1600000, default_color: '#3b82f6', gate_number: 3 },
      { code: 'BALCONY_TIER2', name: 'Tầng 2 Tổng Hợp', default_price: 950000, default_color: '#a855f7', gate_number: 4 },
    ],
  },
  {
    name: 'Cung Văn hóa Hữu nghị Việt - Xô',
    city: 'Hà Nội',
    address: '91 Trần Hưng Đạo, Phường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội',
    capacity: 1200,
    svg_template_url: 'https://cdn.tixora.local/maps/viet-xo-theatre.svg',
    zone_presets: [
      { code: 'DIAMOND_ROW', name: 'Hàng Ghế Kim Cương (Hàng 1-5)', default_price: 3000000, default_color: '#f59e0b', gate_number: 1 },
      { code: 'ORCHESTRA_CENTER', name: 'Tầng 1 Trung Tâm (Hàng 6-15)', default_price: 2000000, default_color: '#ec4899', gate_number: 2 },
      { code: 'ORCHESTRA_WING', name: 'Tầng 1 Cánh Gà (Hai bên)', default_price: 1400000, default_color: '#06b6d4', gate_number: 2 },
      { code: 'MEZZANINE', name: 'Tầng 2 Ban Công', default_price: 800000, default_color: '#8b5cf6', gate_number: 3 },
    ],
  },
];

async function main() {
  console.log('Seeding standard venues in Vietnam...');

  for (const item of SAMPLE_VENUES) {
    const existing = await prisma.venue.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.venue.create({
        data: item,
      });
      console.log(`Created venue: ${item.name} (${item.city})`);
    } else {
      await prisma.venue.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`Updated venue: ${item.name}`);
    }
  }

  // Link existing concerts to venues if location matches
  const myDinh = await prisma.venue.findFirst({ where: { name: { contains: 'Mỹ Đình' } } });
  if (myDinh) {
    await prisma.concert.updateMany({
      where: { location: { contains: 'Mỹ Đình' } },
      data: { venue_id: myDinh.id },
    });
  }

  const secc = await prisma.venue.findFirst({ where: { name: { contains: 'SECC' } } });
  if (secc) {
    await prisma.concert.updateMany({
      where: { location: { contains: 'SECC' } },
      data: { venue_id: secc.id },
    });
  }

  console.log('Venue seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding venues:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
