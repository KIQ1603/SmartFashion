import type { Config } from 'tailwindcss';

// Design system: Minimalism & Swiss Style (mono nền + 1 accent duy nhất) — chọn qua skill
// ui-ux-pro-max cho ngành fashion e-commerce: "Clean, spacious, high contrast, grid-based,
// single accent color". Token đặt qua CSS variable (globals.css) để dễ mở rộng dark mode sau.
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          // Divider nhẹ hơn border mặc định — dùng để tách các khối phụ bên trong 1 section mà
          // không cần đường viền rõ như border card (note.md §5: "Soft border #F0EFED").
          soft: 'rgb(var(--color-border-soft) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        // Nền ấm dùng xen kẽ giữa các section để tránh cả trang là 1 mảng trắng phẳng (note.md
        // §8/§27) — khác `muted` (nền phụ trung tính hơn, dùng cho card/hover).
        warm: 'rgb(var(--color-warm) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },
      fontFamily: {
        // Fraunces (heading, serif biên tập rất hạn chế - chỉ dùng cho H1 hero/section heading/
        // eyebrow label) + Inter (body). Token vẫn tên `font-serif` để không phải sửa lại mọi
        // component đang dùng class này, chỉ đổi font đứng sau nó. Có subset `vietnamese` đầy đủ
        // (đã kiểm tra trước khi chọn - bài học từ lần đổi Playfair Display trước đây bị thiếu dấu).
        // Fallback Georgia/Cambria (serif hệ thống) thay vì sans-serif để không "nhảy" phong cách
        // chữ trong lúc web font đang tải (font-display: swap).
        serif: ['var(--font-heading)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        measure: '75ch',
      },
      borderRadius: {
        // Bo tròn RÕ RỆT kiểu "soft app premium" (ảnh mẫu tham khảo: card/ảnh sản phẩm bo góc lớn,
        // không phải minimal nữa) - toàn site đang dùng rounded-md/rounded-lg/rounded-xl cho nút,
        // input, ảnh, card nên chỉ cần nới token là mọi nơi đồng loạt bo tròn hơn.
        md: '0.875rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      boxShadow: {
        // Bóng đổ tăng độ đậm so với bản trước - nền giờ xám nhạt (gần trắng hơn cream cũ) nên độ
        // tương phản nền/card tự nhiên thấp hơn, cần shadow rõ hơn để "nổi" thật sự nhận ra được
        // (phản hồi trực tiếp: "component như nổi ở bên trên nền chứ không phải như vậy").
        soft: '0 3px 10px -3px rgb(23 23 23 / 0.09), 0 14px 32px -12px rgb(23 23 23 / 0.18)',
        lift: '0 6px 18px -6px rgb(23 23 23 / 0.14), 0 24px 48px -16px rgb(23 23 23 / 0.26)',
      },
    },
  },
  plugins: [],
};

export default config;
