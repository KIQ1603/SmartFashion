/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.supabase.co' },
      // Ảnh admin tải lên thật (Cloudinary) - danh mục sản phẩm và slide hero trang chủ đều dùng
      // chung endpoint upload này (xem CloudinaryService phía backend).
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

module.exports = nextConfig;
