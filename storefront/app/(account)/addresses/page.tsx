'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { getAddresses, createAddress, updateAddress, removeAddress, setDefaultAddress } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import type { Address } from '@/types';

const EMPTY_FORM = { recipient: '', phone: '', line: '', city: '' };

export default function AddressesPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    return getAddresses().then(setAddresses);
  }

  useEffect(() => {
    // Đợi rehydrate xong mới quyết định redirect - xem giải thích chi tiết ở store/auth.ts.
    if (!hasHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    reload().catch(() => router.push('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user, router]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(a: Address) {
    setEditingId(a.id);
    setForm({ recipient: a.recipient, phone: a.phone, line: a.line, city: a.city });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipient || !form.phone || !form.line || !form.city) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) await updateAddress(editingId, form);
      else await createAddress(form);
      await reload();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Xóa địa chỉ này?')) return;
    await removeAddress(id).catch(() => {});
    reload();
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id).catch(() => {});
    reload();
  }

  if (!addresses) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-8 w-52" />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-heading">Sổ địa chỉ</h1>
        {!showForm && (
          <button onClick={openCreate} className="btn-outline gap-1.5">
            <Plus size={15} /> Thêm địa chỉ
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 space-y-4 rounded-lg border border-border bg-warm p-6 shadow-soft">
          <p className="text-sm font-medium text-foreground">{editingId ? 'Sửa địa chỉ' : 'Địa chỉ mới'}</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Người nhận</label>
            <input required className="input bg-card" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Số điện thoại</label>
            <input required type="tel" className="input bg-card" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Địa chỉ</label>
            <input required className="input bg-card" value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tỉnh/Thành phố</label>
            <input required className="input bg-card" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary min-h-10 flex-1">
              {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost min-h-10">
              Hủy
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-20 text-center">
          <MapPin size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Bạn chưa lưu địa chỉ nào.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-soft overflow-hidden rounded-lg border border-border bg-warm shadow-soft">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {a.recipient} <span className="font-normal text-muted-foreground">— {a.phone}</span>
                  </p>
                  {a.isDefault && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">Mặc định</span>
                  )}
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {a.line}, {a.city}
                </p>
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a.id)} className="mt-2 text-xs font-medium text-accent hover:underline">
                    Đặt làm mặc định
                  </button>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openEdit(a)} aria-label="Sửa địa chỉ" className="btn-ghost p-2">
                  <PencilSimple size={16} />
                </button>
                <button onClick={() => handleRemove(a.id)} aria-label="Xóa địa chỉ" className="btn-ghost p-2 hover:text-destructive">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
