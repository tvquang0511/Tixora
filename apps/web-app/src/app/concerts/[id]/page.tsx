import { Button, Card, SiteShell } from "@/components/common";
import { ConcertDetailHero } from "@/components/screens";
import { ConcertBookingSection } from "@/components/ConcertBookingSection";
import { getConcertById } from "@/services/concert.service";

export default async function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let concert;
  try {
    concert = await getConcertById(id);
  } catch (error) {
    return (
      <SiteShell active="/">
        <section className="mx-auto w-full max-w-7xl px-4 py-12 text-center">
          <Card className="p-8 space-y-4">
            <h1 className="text-2xl font-bold text-rose-600">
              Lỗi tải thông tin sự kiện
            </h1>
            <p className="text-on-surface-variant">
              {error instanceof Error
                ? error.message
                : "Không thể kết nối đến máy chủ lúc này."}
            </p>
            <Button href="/" variant="primary">
              Quay lại Trang chủ
            </Button>
          </Card>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell active="/">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ConcertDetailHero concert={concert} />
        <ConcertBookingSection concert={concert} />
      </section>
    </SiteShell>
  );
}
