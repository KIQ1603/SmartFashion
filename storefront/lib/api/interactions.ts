import { apiFetch } from './client';
import { getOrCreateSessionId } from '../utils/session';

export type InteractionType = 'view' | 'wishlist' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'return';

/** Ghi nhận hành vi người dùng để phục vụ Recommendation Service (đặc tả mục 3.1 luồng mua hàng). */
export function recordInteraction(productId: string, interactionType: InteractionType) {
  return apiFetch('/interactions', {
    method: 'POST',
    body: JSON.stringify({ productId, interactionType, sessionId: getOrCreateSessionId() }),
  }).catch(() => {
    /* không chặn trải nghiệm người dùng nếu ghi nhận interaction thất bại */
  });
}
