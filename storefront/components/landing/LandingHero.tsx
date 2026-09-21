import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

/**
 * Hero landing thời trang - không dùng hiệu ứng 3D/particle nữa (đã bỏ hẳn Three.js). Học theo
 * đúng quy ước của các trang landing thời trang thật (Zara, COS, Massimo Dutti...): ảnh phủ kín
 * toàn khung, chữ neo ở góc dưới (không giữa khung), rất ít chi tiết trang trí - để ảnh và
 * typography tự nói lên câu chuyện, không cần hiệu ứng công nghệ để "gây ấn tượng".
 */
export default function LandingHero({ imageUrl }: { imageUrl: string }) {
  return (
    <section className="relative flex min-h-[88vh] w-full items-end overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover [filter:grayscale(0.5)_sepia(0.22)_contrast(1.06)]"
        />
        {/* Gradient tối dần về đáy - đảm bảo chữ trắng luôn đọc được bất kể ảnh nền là gì, đồng thời
            tạo cảm giác "biên tập" thống nhất thay vì lộ nguyên màu ảnh gốc. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      </div>

      <div className="container-page relative z-10 grid gap-10 pb-14 pt-32 sm:pb-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/70">Bộ sưu tập Thu Đông 2026</p>
          <h1 className="text-balance font-serif text-4xl font-medium leading-[1.08] text-white sm:text-6xl lg:text-7xl">
            Vẻ đẹp nằm ở<br />sự giản đơn.
          </h1>
        </div>
        <div className="flex flex-col justify-end gap-6 lg:col-span-5">
          <p className="max-w-sm text-balance text-[15px] leading-relaxed text-white/75">
            Từng thiết kế chọn lọc chất liệu và đường cắt để tôn lên phong cách thật của bạn, không chạy theo xu hướng nhất thời.
          </p>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Khám phá bộ sưu tập
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
