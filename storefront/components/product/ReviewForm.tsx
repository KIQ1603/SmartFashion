'use client';

import { useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { addReview } from '@/lib/api/products';
import { useAuthStore } from '@/store/auth';
import type { Review } from '@/types';

/** reviews: toàn bộ đánh giá của sản phẩm (trang chi tiết là Server Component nên không biết
 * user hiện tại là ai lúc render) - ReviewForm (Client Component) tự đối chiếu review.userId với
 * user đang đăng nhập để tìm myReview, quyết định hiện form hay hiện đánh giá đã gửi. Mỗi khách
 * chỉ đánh giá 1 lần, khớp ràng buộc unique ở backend - tránh vừa submit vừa dính lỗi "đã đánh
 * giá rồi" mới biết. */
export default function ReviewForm({ productId, reviews }: { productId: string; reviews?: Review[] }) {
  const { user } = useAuthStore();
  const myReview = user ? reviews?.find((r) => r.userId === user.id) : undefined;
  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!user) {
    return <p className="text-sm text-muted-foreground">Đăng nhập và mua sản phẩm để có thể đánh giá.</p>;
  }

  if (myReview || submitted) {
    return (
      <div className="max-w-md space-y-2 rounded-lg border border-border bg-warm p-5 shadow-soft">
        <p className="text-sm font-medium text-foreground">Bạn đã đánh giá sản phẩm này</p>
        <div className="flex items-center gap-1" aria-hidden>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={16} weight={s <= (myReview?.rating ?? rating) ? 'fill' : 'regular'} className="text-accent" />
          ))}
        </div>
        {myReview?.comment && <p className="text-sm text-muted-foreground">{myReview.comment}</p>}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await addReview(productId, rating, comment);
      setSubmitted(true);
    } catch (err: any) {
      setMessage(err.message || 'Bạn cần mua sản phẩm này trước khi đánh giá.');
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3 rounded-lg border border-border bg-warm p-5 shadow-soft">
      <p className="text-sm font-medium">Viết đánh giá</p>

      {/* Chọn sao bằng cách bấm trực tiếp vào ngôi sao - trước đây là dropdown "5 sao/4 sao..."
          không trực quan bằng thao tác click quen thuộc của UI đánh giá sao. */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Số sao</label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              aria-label={`${s} sao`}
              aria-pressed={rating === s}
              className="cursor-pointer p-0.5"
            >
              <Star size={24} weight={s <= (hoverRating || rating) ? 'fill' : 'regular'} className="text-accent transition-transform hover:scale-110" />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cảm nhận của bạn về sản phẩm..."
        className="input bg-card"
        rows={3}
      />
      <button type="submit" className="btn-primary">Gửi đánh giá</button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
