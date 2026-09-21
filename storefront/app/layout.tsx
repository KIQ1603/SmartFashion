import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MobileTabBar from '@/components/common/MobileTabBar';

// Fraunces (heading, serif biên tập - dùng RẤT hạn chế: hero H1, section heading, eyebrow label)
// + Inter (body). Đổi từ Manrope sang serif theo yêu cầu redesign "fashion editorial", nhưng
// KHÔNG áp serif cho toàn site - nav/button/label/body vẫn Inter. Chọn Fraunces (đã kiểm tra có
// subset `vietnamese` đầy đủ trước khi chọn - bài học từ lần đổi Playfair Display cũ từng thiếu
// dấu tiếng Việt) vì có optical size + italic mềm mại, hợp tinh thần "fashion magazine" hơn các
// serif kinh điển kiểu Playfair/Georgia đã quá phổ biến. next/font tự self-host, không FOIT.
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter', display: 'swap' });
const heading = Fraunces({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'SmartFashion — Thời trang thông minh',
  description: 'Website thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${heading.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">
          Bỏ qua để đến nội dung chính
        </a>
        <Header />
        {/* pb-20 chừa chỗ cho MobileTabBar cố định ở đáy màn hình (chỉ hiện < md) - thiếu dòng này
            thì nội dung cuối trang (vd. nút CTA cuối cùng) sẽ bị tab bar che mất trên mobile. */}
        <main id="main-content" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}
