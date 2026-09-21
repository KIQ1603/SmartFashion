import { redirect } from 'next/navigation';

// /search tồn tại trước đây như 1 trang riêng, không filter/phân trang/bộ lọc - hợp nhất vào
// /products?q=... (đầy đủ ShopToolbar + phân trang) để giữ bộ lọc luôn hiện khi tìm kiếm,
// thay vì rời sang 1 trang kết quả trơ trọi. Giữ route này để không vỡ link cũ đã bookmark.
export default function SearchRedirectPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || '';
  redirect(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}
