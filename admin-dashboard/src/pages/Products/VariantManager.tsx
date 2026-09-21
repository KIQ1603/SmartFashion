import { useState } from 'react';
import { Button, Input, InputNumber, Table, message } from 'antd';
import { api } from '@/services/api';

interface Variant {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
  sku: string;
}

export default function VariantManager({
  productId,
  variants,
  onChange,
}: {
  productId: string;
  variants: Variant[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ size: '', color: '', stockQuantity: 0, sku: '' });

  async function addVariant() {
    if (!form.size || !form.color || !form.sku) {
      message.warning('Nhập đủ size, màu, SKU.');
      return;
    }
    try {
      await api.post(`/admin/products/${productId}/variants`, form);
      message.success('Đã thêm biến thể.');
      setForm({ size: '', color: '', stockQuantity: 0, sku: '' });
      onChange();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thêm được biến thể (SKU có thể đã tồn tại).');
    }
  }

  async function updateStock(id: string, stockQuantity: number) {
    try {
      await api.patch(`/admin/product-variants/${id}`, { stockQuantity });
      onChange();
    } catch {
      message.error('Không cập nhật được tồn kho.');
    }
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <h4>Biến thể (Size / Màu / Tồn kho)</h4>
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={variants}
        columns={[
          { title: 'Size', dataIndex: 'size' },
          { title: 'Màu', dataIndex: 'color' },
          { title: 'SKU', dataIndex: 'sku' },
          {
            title: 'Tồn kho',
            dataIndex: 'stockQuantity',
            render: (v, record) => (
              <InputNumber min={0} defaultValue={v} onBlur={(e) => updateStock(record.id, Number(e.target.value))} />
            ),
          },
        ]}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Input placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} style={{ width: 80 }} />
        <Input placeholder="Màu" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 100 }} />
        <InputNumber
          placeholder="Tồn kho"
          value={form.stockQuantity}
          onChange={(v) => setForm({ ...form, stockQuantity: v || 0 })}
          style={{ width: 100 }}
        />
        <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} style={{ width: 120 }} />
        <Button onClick={addVariant}>Thêm</Button>
      </div>
    </div>
  );
}
