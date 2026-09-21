import Link from 'next/link';
import { Compass } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <Compass size={44} className="text-muted-foreground" />
      <div>
        <p className="font-serif text-3xl font-medium text-foreground">Không tìm thấy trang</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển. Kiểm tra lại đường dẫn hoặc quay về
          trang chủ.
        </p>
      </div>
      <div className="mt-2 flex gap-3">
        <Link href="/" className="btn-primary">
          Về trang chủ
        </Link>
        <Link href="/products" className="btn-outline">
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
