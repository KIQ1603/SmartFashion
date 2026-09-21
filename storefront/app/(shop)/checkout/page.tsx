'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import type { Address, Cart } from '@/types';
import { getCart } from '@/lib/api/cart';
import { getAddresses, createAddress } from '@/lib/api/users';
import { getSiteSettings, type SiteSettings } from '@/lib/api/settings';
import { checkout } from '@/lib/api/orders';
import { validateDiscountCode } from '@/lib/api/discount-codes';
import { recordInteraction } from '@/lib/api/interactions';
import { formatVnd } from '@/lib/utils/format';
import { useAuthStore } from '@/store/auth';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  // Hiện form thêm địa chỉ mới - mặc định BẬT nếu chưa có địa chỉ nào (bắt buộc điền ít nhất 1
  // địa chỉ trước khi đặt đơn đầu tiên), thu gọn lại nếu đã có sẵn địa chỉ để chọn nhanh.
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ recipient: '', phone: '', line: '', city: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mã giảm giá: xem trước ngay khi bấm "Áp dụng" (validate riêng, KHÔNG tăng lượt dùng) - sửa lại
  // input sau khi đã áp thì huỷ kết quả cũ, bắt bấm "Áp dụng" lại để tránh gửi mã cũ không khớp ô
  // nhập hiện tại lúc đặt hàng thật.
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    // Đợi zustand persist rehydrate xong (đọc localStorage) rồi mới quyết định redirect - chưa
    // hydrate xong thì `user` luôn là null dù có thể đã đăng nhập thật, redirect ngay lúc này sẽ
    // đá nhầm khách hàng thật ra khỏi trang khi họ tải thẳng URL /checkout hoặc F5 giữa chừng.
    if (!hasHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    Promise.all([getCart(), getAddresses().catch(() => []), getSiteSettings().catch(() => null)])
      .then(([cartData, addressList, settingsData]) => {
        setCart(cartData);
        setAddresses(addressList);
        setSettings(settingsData);
        const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else setShowNewAddressForm(true);
      })
      .catch(() => router.push('/cart'));
  }, [hasHydrated, user, router]);

  const hasBankInfo = !!(settings?.bankName && settings?.bankAccountNumber && settings?.bankAccountHolder);

  async function applyDiscount() {
    if (!cart || !discountInput.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const result = await validateDiscountCode(discountInput.trim(), cart.subtotal);
      setAppliedDiscount({ code: result.discountCode, amount: result.discountAmount });
    } catch (err: any) {
      setAppliedDiscount(null);
      setDiscountError(err.message || 'Mã giảm giá không hợp lệ.');
    } finally {
      setDiscountLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      let addressId = selectedAddressId;
      if (showNewAddressForm || !addressId) {
        if (!newAddress.recipient || !newAddress.phone || !newAddress.line || !newAddress.city) {
          setError('Vui lòng điền đầy đủ địa chỉ giao hàng.');
          setLoading(false);
          return;
        }
        const created = await createAddress({ ...newAddress, isDefault: (addresses?.length ?? 0) === 0 });
        addressId = created.id;
      }
      const order = await checkout({ addressId: addressId!, paymentMethod, discountCode: appliedDiscount?.code });
      // Ghi nhận interaction "purchase" cho từng sản phẩm (đã ghi ở backend khi checkout,
      // gọi thêm ở client chỉ để chắc chắn UI đồng bộ ngay lập tức - không bắt buộc)
      await Promise.all(cart.items.map((item) => recordInteraction(item.variant.product.id, 'purchase')));
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Đặt hàng thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!cart || !addresses) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="container-page grid grid-cols-1 gap-10 py-10 sm:py-14 lg:grid-cols-3 lg:items-start lg:gap-14">
      <form onSubmit={submit} className="space-y-8 lg:col-span-2">
        <div>
          <h1 className="section-heading">Thanh toán</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Kiểm tra lại địa chỉ và phương thức thanh toán trước khi đặt hàng.</p>
        </div>

        {/* 1 khung lớn duy nhất ôm cả "Địa chỉ giao hàng" và "Phương thức thanh toán" - 2 khối con
            ngăn nhau bằng border-t thay vì 2 card rời. */}
        <div className="overflow-hidden rounded-lg border border-border bg-warm shadow-soft">
        <div className="p-6 sm:p-8">
          <p className="mb-2.5 text-sm font-medium text-foreground">Địa chỉ giao hàng</p>

          {addresses.length > 0 && (
            <div className="space-y-2.5">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    !showNewAddressForm && selectedAddressId === a.id
                      ? 'border-foreground bg-card'
                      : 'border-border bg-card/60 hover:border-foreground/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1 accent-foreground"
                    checked={!showNewAddressForm && selectedAddressId === a.id}
                    onChange={() => {
                      setSelectedAddressId(a.id);
                      setShowNewAddressForm(false);
                    }}
                  />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {a.recipient} <span className="font-normal text-muted-foreground">— {a.phone}</span>
                      {a.isDefault && (
                        <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                          Mặc định
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      {a.line}, {a.city}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!showNewAddressForm ? (
            <button
              type="button"
              onClick={() => setShowNewAddressForm(true)}
              className="btn-ghost mt-3 gap-1.5 px-0 text-foreground hover:bg-transparent hover:underline"
            >
              <Plus size={15} /> Thêm địa chỉ mới
            </button>
          ) : (
            <div className="mt-3 space-y-4 rounded-lg border border-border bg-card p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Người nhận</label>
                <input
                  required
                  className="input"
                  value={newAddress.recipient}
                  onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Số điện thoại</label>
                <input
                  required
                  type="tel"
                  className="input"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Địa chỉ</label>
                <input
                  required
                  className="input"
                  value={newAddress.line}
                  onChange={(e) => setNewAddress({ ...newAddress, line: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tỉnh/Thành phố</label>
                <input
                  required
                  className="input"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(false)}
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Dùng địa chỉ đã lưu thay vào đó
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border p-6 sm:p-8">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Phương thức thanh toán</label>
          <select className="input bg-card" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            {hasBankInfo && <option value="bank_transfer">Chuyển khoản ngân hàng</option>}
          </select>
          {paymentMethod === 'bank_transfer' && hasBankInfo && (
            <div className="mt-3 space-y-1 rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium text-foreground">Thông tin chuyển khoản</p>
              <p className="text-muted-foreground">
                Ngân hàng: <span className="text-foreground">{settings!.bankName}</span>
              </p>
              <p className="text-muted-foreground">
                Số tài khoản: <span className="font-medium text-foreground">{settings!.bankAccountNumber}</span>
              </p>
              <p className="text-muted-foreground">
                Chủ tài khoản: <span className="text-foreground">{settings!.bankAccountHolder}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Vui lòng ghi nội dung chuyển khoản kèm số điện thoại đặt hàng để cửa hàng xác nhận nhanh hơn.
              </p>
            </div>
          )}
        </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary min-h-12 w-full sm:w-auto sm:px-12">
          {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
        </button>
      </form>

      {/* Order summary có visual priority cao nhất bên phải (note.md §14/§25: PRIMARY của trang
          checkout là xác nhận đơn) - sticky để luôn thấy được tổng tiền khi cuộn form dài ở cột
          trái, và có breakdown Tạm tính/Phí vận chuyển thay vì chỉ 1 dòng Tổng cộng trơ trọi. */}
      <div className="h-fit space-y-5 rounded-lg border border-border bg-warm p-6 shadow-soft sm:p-8 lg:sticky lg:top-24">
        <h2 className="font-medium text-foreground">Đơn hàng của bạn</h2>
        <div className="space-y-2.5 border-b border-border-soft pb-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {item.variant.product.name} <span className="tabular-nums">x{item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums text-foreground">{formatVnd(Number(item.variant.product.basePrice) * item.quantity)}</span>
            </div>
          ))}
        </div>
        {/* Mã giảm giá - xem trước ngay (validate riêng, không cần đặt hàng mới biết giảm bao
            nhiêu), sửa ô nhập sau khi áp thì huỷ kết quả cũ để tránh lệch giữa hiển thị và mã thật
            gửi lên lúc đặt hàng. */}
        <div className="border-b border-border-soft pb-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Mã giảm giá</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nhập mã..."
              value={discountInput}
              onChange={(e) => {
                setDiscountInput(e.target.value);
                setAppliedDiscount(null);
                setDiscountError(null);
              }}
            />
            <button
              type="button"
              onClick={applyDiscount}
              disabled={discountLoading || !discountInput.trim()}
              className="btn-outline shrink-0 px-4 disabled:opacity-50"
            >
              {discountLoading ? '...' : 'Áp dụng'}
            </button>
          </div>
          {discountError && (
            <p className="mt-1.5 text-xs text-destructive" role="alert">
              {discountError}
            </p>
          )}
          {appliedDiscount && (
            <p className="mt-1.5 text-xs text-success">
              Đã áp mã "{appliedDiscount.code}" — giảm {formatVnd(appliedDiscount.amount)}.
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span className="tabular-nums text-foreground">{formatVnd(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Phí vận chuyển</span>
            <span className="text-success">Miễn phí</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-muted-foreground">
              <span>Giảm giá ({appliedDiscount.code})</span>
              <span className="tabular-nums text-success">-{formatVnd(appliedDiscount.amount)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
          <span>Tổng cộng</span>
          <span className="tabular-nums">{formatVnd(cart.subtotal - (appliedDiscount?.amount || 0))}</span>
        </div>
      </div>
    </div>
  );
}
