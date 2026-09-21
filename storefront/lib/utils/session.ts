import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'sf_session_id';

/** session_id cho khách vãng lai (Guest) - dùng để gộp giỏ hàng/interactions khi đăng nhập (đặc tả mục 3.2). */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearSessionId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}
