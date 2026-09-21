import { ArrowsClockwise, Eye, Package, Sparkle, Target, Truck } from '@phosphor-icons/react/dist/ssr';
import { getCategoryTree } from '@/lib/api/categories';
import { getSiteSettings } from '@/lib/api/settings';
import { getTrending } from '@/lib/api/recommendations';
import { primaryImage } from '@/lib/utils/format';
import type { Category } from '@/types';
import PersonalizedRecommendations from '@/components/recommendation/PersonalizedRecommendations';
import GuestCtaBanner from '@/components/home/GuestCtaBanner';
import ProductTabs from '@/components/home/ProductTabs';
import CategoryCircles from '@/components/product/CategoryCircles';
import HomeHeroSlider, { type HeroSlide } from '@/components/home/HomeHeroSlider';
import { Reveal } from '@/components/common/Reveal';

const TRUST_ITEMS = [
  { icon: Sparkle, title: 'Gợi ý bằng AI', desc: 'Cá nhân hóa theo sở thích của bạn' },
  { icon: Truck, title: 'Giao hàng toàn quốc', desc: 'Nhận hàng nhanh chóng, đúng hẹn' },
  { icon: ArrowsClockwise, title: 'Đổi trả 7 ngày', desc: 'Miễn phí nếu còn nguyên tem mác' },
  { icon: Package, title: '500+ sản phẩm', desc: 'Cập nhật liên tục theo xu hướng' },
];

const HOW_IT_WORKS = [
  {
    icon: Eye,
    title: 'Bạn xem & tương tác',
    body: 'Mỗi lượt xem, thêm giỏ hoặc lưu yêu thích đều được ghi nhận làm tín hiệu sở thích.',
  },
  {
    icon: Sparkle,
    title: 'Hệ thống học phong cách',
    body: 'Mô hình kết hợp Content-Based và Collaborative Filtering để hiểu gu thời trang của bạn.',
  },
  {
    icon: Target,
    title: 'Gợi ý ngày càng đúng',
    body: 'Trang chủ và trang sản phẩm cập nhật gợi ý theo đúng những gì bạn thực sự thích.',
  },
];

/** Danh mục gốc ("Áo"/"Quần") không gán sản phẩm trực tiếp - làm phẳng cả cây để hàng vòng
 * tròn "Shop By Categories" có đủ số lượng hiển thị thay vì chỉ 2 mục trống trải. */
function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((c) => [c, ...(c.children ? flattenCategories(c.children) : [])]);
}

export default async function HomePage() {
  const [categoryTree, settings, trending] = await Promise.all([
    getCategoryTree().catch(() => []),
    getSiteSettings().catch(() => null),
    getTrending().catch(() => ({ products: [] })),
  ]);
  // Không cắt bớt ở đây nữa - CategoryCircles tự chọn 4 danh mục nhiều sản phẩm nhất + ô "Xem tất
  // cả", cần biết đúng tổng số danh mục thật để hiện số lượng chính xác ở ô "+".
  const categories = flattenCategories(categoryTree);

  // Admin cấu hình toàn bộ danh sách slide qua trang Cài đặt (Hero) - khi đã cấu hình thì dùng
  // ĐÚNG danh sách đó (toàn quyền kiểm soát ảnh hiển thị theo đúng yêu cầu). Chưa cấu hình gì thì
  // tự dựng: 1 slide mặc định (hoặc heroImageUrl cũ nếu có) + sản phẩm nổi bật thật làm slide dự
  // phòng, không hiện trống trơn và không bịa ảnh/nội dung minh họa.
  const heroSlides: HeroSlide[] =
    settings?.heroSlides && settings.heroSlides.length > 0
      ? settings.heroSlides.map((s) => ({
          image: s.imageUrl,
          eyebrow: 'Ưu đãi mùa mới',
          title: s.title,
          subtitle: s.subtitle || '',
          ctaText: s.ctaText || 'Mua sắm ngay',
          ctaHref: s.ctaHref || '/products',
        }))
      : [
          {
            image: settings?.heroImageUrl || 'https://picsum.photos/seed/smartfashion-hero/1920/1080',
            eyebrow: 'Ưu đãi mùa mới',
            title: settings?.heroTitle || 'Thời trang chọn theo gu của riêng bạn',
            subtitle:
              settings?.heroSubtitle ||
              'Hệ thống gợi ý cá nhân hóa học từ sở thích và lịch sử mua sắm để đề xuất đúng sản phẩm bạn cần.',
            ctaText: settings?.heroCtaText || 'Mua sắm ngay',
            ctaHref: settings?.heroCtaHref || '/products',
          },
          ...trending.products.slice(0, 2).map((p) => ({
            image: primaryImage(p.images),
            eyebrow: 'Sản phẩm nổi bật',
            title: p.name,
            subtitle: p.description || 'Một trong những thiết kế được yêu thích nhất tại SmartFashion lúc này.',
            ctaText: 'Xem sản phẩm',
            ctaHref: `/products/${p.slug}`,
          })),
        ];

  return (
    <div>
      {/* === Hero dạng slide (trước đây 1 ảnh tĩnh mờ) - to, rõ nét, tự chuyển + điều hướng tay === */}
      <HomeHeroSlider slides={heroSlides} />

      {/* === Dải tin cậy NỔI đè lên mép dưới hero (margin âm) - thay vì 1 hàng chữ phẳng nằm trong
          khoảng trống riêng như bản trước, giờ là 1 khối thẻ có bóng đổ thật, "nổi lên" đúng nghĩa
          và gộp luôn vào nhịp của hero thay vì để 1 khoảng trắng riêng phía dưới. === */}
      <div className="container-page relative z-10 -mt-8 sm:-mt-14">
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-lift sm:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="bg-card px-3 py-4 text-center sm:px-6 sm:py-8">
                <item.icon size={18} weight="light" className="mx-auto text-accent sm:hidden" aria-hidden />
                <item.icon size={22} weight="light" className="mx-auto hidden text-accent sm:block" aria-hidden />
                <p className="mt-1.5 text-xs font-medium text-foreground sm:mt-2.5 sm:text-sm">{item.title}</p>
                <p className="mt-0.5 hidden text-xs leading-snug text-muted-foreground sm:mt-1 sm:block">{item.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {categories.length > 0 && (
        <section className="container-page py-8 text-center sm:py-16" aria-labelledby="shop-by-category-heading">
          <Reveal>
            <h2 id="shop-by-category-heading" className="section-heading">
              Mua sắm theo <span className="text-accent">danh mục</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Những phong cách được tìm kiếm nhiều nhất.</p>
          </Reveal>
          {/* Avatar tròn + tên bên dưới - khác hẳn layout family khối bento phía trên, tránh lặp
              "card ảnh + chữ overlay" hai lần liên tiếp trên cùng trang. */}
          <Reveal className="mt-6 sm:mt-10">
            <CategoryCircles categories={categories} />
          </Reveal>
        </section>
      )}

      {/* === How it works: mỗi bước là 1 thẻ nổi (border+shadow) thay vì icon+chữ trôi tự do trên
          nền phẳng như bản trước - "để quá nhiều khoảng trống" vì 3 khối text ngắn nằm rời rạc
          giữa các cột rộng; giờ mỗi bước có biên rõ, đọc như 1 cụm chủ ý thay vì 3 đoạn văn rời. */}
      <section className="bg-muted">
        <div className="container-page py-8 sm:py-16">
          <Reveal>
            <h2 className="section-heading mb-5 text-center sm:mb-8">
              Gợi ý <span className="text-accent">cá nhân hóa</span> hoạt động thế nào
            </h2>
          </Reveal>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="h-full rounded-lg border border-border bg-card p-4 shadow-soft sm:p-6">
                  <step.icon size={22} className="text-accent sm:hidden" weight="light" />
                  <step.icon size={26} className="hidden text-accent sm:block" weight="light" />
                  <h3 className="mt-3 text-sm font-medium text-foreground sm:mt-4 sm:text-base">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-16">
        <Reveal>
          <h2 className="section-heading mb-5 text-center sm:mb-8">
            Khám phá <span className="text-accent">sản phẩm</span>
          </h2>
        </Reveal>
        <ProductTabs />
      </section>

      {/* === Gợi ý cá nhân hóa: nền tối để tách biệt hẳn khỏi khối "bán chạy" phía trên
          (page theme lock §4.11 cho phép section-level tint trong cùng 1 hệ màu — không đổi theme,
          chỉ đảo nền/chữ để tạo điểm nhấn thị giác cho khối AI, đúng tinh thần "Theme Switch" có chủ đích) === */}
      <section className="bg-foreground text-background">
        <PersonalizedRecommendations dark />
      </section>

      <GuestCtaBanner />
    </div>
  );
}
