'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useReducedMotion } from 'motion/react';

export interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

const AUTO_ADVANCE_MS = 5500;

/**
 * Hero dạng slide thật (trước đây chỉ 1 ảnh tĩnh mờ) - ảnh full độ nét, tự chuyển sau mỗi 5.5s,
 * dừng khi rê chuột vào, có nút mũi tên + chấm chọn tay. Slide đầu lấy đúng banner admin cấu hình
 * (Cài đặt > Hero), 2 slide sau là sản phẩm nổi bật thật - không bịa nội dung minh họa.
 */
export default function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => setIndex(((i % slides.length) + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || reduceMotion || slides.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, reduceMotion, slides.length]);

  return (
    <section
      className="relative overflow-hidden bg-foreground text-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(100 / slides.length) * index}%)`,
          transition: reduceMotion ? 'none' : 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="relative w-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
            <div className="relative min-h-screen">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                aria-hidden
                sizes="100vw"
                className="object-cover"
              />
              {/* Gradient chỉ đậm ở góc trái/dưới (nơi chữ nằm) - phần còn lại ảnh giữ nguyên độ nét
                  và màu thật, không phủ xám/mờ toàn khung như bản trước ("cho ảnh to lên"). */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent sm:bg-gradient-to-r sm:from-foreground/90 sm:via-foreground/30 sm:to-transparent" />
              {/* Scrim riêng ở mép trên - navbar giờ nằm ĐÈ lên ảnh (fixed, không chiếm chỗ layout
                  nữa) nên cần dải tối riêng đảm bảo chữ/icon trắng của navbar luôn đọc được, kể cả
                  ở nửa phải ảnh nơi gradient chính phía trên đã nhạt dần về trong suốt. */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" aria-hidden />

              <div className="container-page relative flex min-h-screen flex-col items-start justify-end gap-3 pb-12 pt-24 sm:justify-center sm:gap-5 sm:pb-0 sm:pt-0">
                <span className="border-l-2 border-accent py-1 pl-3 text-xs font-medium uppercase tracking-wider text-background/80">
                  {slide.eyebrow}
                </span>
                <h1 className="max-w-2xl text-balance font-serif text-3xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
                  {slide.title}
                </h1>
                <p className="max-w-md text-balance text-sm leading-relaxed text-background/70 sm:text-[15px]">{slide.subtitle}</p>
                <Link
                  href={slide.ctaHref}
                  className="btn-primary mt-1 bg-background px-6 py-2.5 text-foreground hover:bg-background/90 sm:mt-2 sm:px-7 sm:py-3"
                >
                  {slide.ctaText}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mũi tên + chấm đặt CHUNG 1 hàng dưới đáy (không đặt mũi tên giữa khung theo chiều dọc như
          bản đầu) - vị trí giữa khung trùng đúng vùng chữ khi nội dung căn giữa dọc (sm:justify-
          center), slide có đoạn mô tả dài sẽ đè lên nút mũi tên. Gộp cùng hàng dưới đáy thì không
          bao giờ va vào chữ bất kể nội dung dài ngắn ra sao. */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-20 z-10 hidden items-center justify-center gap-5 sm:flex">
          <button
            aria-label="Slide trước"
            onClick={() => goTo(index - 1)}
            className="rounded-full border border-background/25 bg-foreground/30 p-2 text-background backdrop-blur-sm transition-colors hover:bg-foreground/50"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Đến slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-background' : 'w-1.5 bg-background/40 hover:bg-background/60'}`}
              />
            ))}
          </div>

          <button
            aria-label="Slide sau"
            onClick={() => goTo(index + 1)}
            className="rounded-full border border-background/25 bg-foreground/30 p-2 text-background backdrop-blur-sm transition-colors hover:bg-foreground/50"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Mobile: chỉ chấm chọn tay ở giữa đáy (không có mũi tên - quá chật, vuốt ngang cũng đã
          hoạt động qua touch trên track). */}
      {slides.length > 1 && (
        <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:hidden">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Đến slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-background' : 'w-1.5 bg-background/40 hover:bg-background/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
