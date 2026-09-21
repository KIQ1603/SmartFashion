'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COMPARE = 4;

interface CompareState {
  productIds: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

/** So sánh sản phẩm - lưu client-side (localStorage), không cần backend vì chỉ là danh sách
 * tạm để đối chiếu trước khi mua, không phải dữ liệu nghiệp vụ cần đồng bộ nhiều thiết bị. */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          set({ productIds: productIds.filter((id) => id !== productId) });
        } else if (productIds.length < MAX_COMPARE) {
          set({ productIds: [...productIds, productId] });
        }
      },
      remove: (productId) => set({ productIds: get().productIds.filter((id) => id !== productId) }),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'sf_compare' },
  ),
);

export { MAX_COMPARE };
