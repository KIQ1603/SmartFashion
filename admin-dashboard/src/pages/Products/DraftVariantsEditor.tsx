import { useState } from 'react';
import { Button, Input, InputNumber, Table, message } from 'antd';
import { DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

export interface DraftVariant {
  size: string;
  color: string;
  stockQuantity: number;
  sku: string;
}

function slugifyPart(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Bảng biến thể (size/màu/tồn kho/SKU) khi TẠO sản phẩm mới - sản phẩm chưa có id thật (chưa lưu
 * xuống DB) nên không gọi API từng dòng như VariantManager (dùng khi sửa sản phẩm đã tồn tại);
 * toàn bộ danh sách giữ ở state của form cha, gửi kèm 1 lần trong request tạo sản phẩm.
 */
export default function DraftVariantsEditor({
  variants,
  onChange,
  skuPrefix,
}: {
  variants: DraftVariant[];
  onChange: (v: DraftVariant[]) => void;
  skuPrefix: string;
}) {
  const [form, setForm] = useState<DraftVariant>({ size: '', color: '', stockQuantity: 0, sku: '' });
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  function add() {
    if (!form.size || !form.color || !form.sku) {
      message.warning('Nhập đủ size, màu, SKU.');
      return;
    }
    if (variants.some((v) => v.size === form.size && v.color === form.color)) {
      message.warning('Size/màu này đã được thêm rồi.');
      return;
    }
    if (variants.some((v) => v.sku === form.sku)) {
      message.warning('SKU này đã được dùng cho 1 dòng khác.');
      return;
    }
    onChange([...variants, form]);
    setForm({ size: '', color: '', stockQuantity: 0, sku: '' });
  }

  // Tạo nhanh nhiều biến thể theo tổ hợp size x màu (vd: 3 size x 2 màu = 6 dòng cùng lúc) thay
  // vì phải thêm tay từng dòng một - SKU tự sinh theo mẫu chung {tên sản phẩm}-{màu}-{size},
  // tồn kho mặc định 0 để admin chỉnh lại ngay trong bảng bên dưới.
  function generateCombos() {
    const sizeList = [...new Set(sizesInput.split(',').map((s) => s.trim()).filter(Boolean))];
    const colorList = [...new Set(colorsInput.split(',').map((s) => s.trim()).filter(Boolean))];
    if (sizeList.length === 0 || colorList.length === 0) {
      message.warning('Nhập ít nhất 1 size và 1 màu (cách nhau bằng dấu phẩy).');
      return;
    }
    const usedSku = new Set(variants.map((v) => v.sku));
    const newRows: DraftVariant[] = [];
    for (const color of colorList) {
      for (const size of sizeList) {
        if (variants.some((v) => v.size === size && v.color === color)) continue;
        let sku = `${skuPrefix}-${slugifyPart(color)}-${slugifyPart(size)}`.toUpperCase();
        if (usedSku.has(sku)) sku = `${sku}-${Math.floor(Math.random() * 900 + 100)}`;
        usedSku.add(sku);
        newRows.push({ size, color, stockQuantity: 0, sku });
      }
    }
    if (newRows.length === 0) {
      message.info('Các tổ hợp này đã có trong danh sách rồi.');
      return;
    }
    onChange([...variants, ...newRows]);
    setSizesInput('');
    setColorsInput('');
    message.success(`Đã tạo ${newRows.length} biến thể - chỉnh lại tồn kho từng dòng bên dưới.`);
  }

  function updateStock(index: number, stockQuantity: number) {
    onChange(variants.map((v, i) => (i === index ? { ...v, stockQuantity } : v)));
  }

  function remove(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <h4 style={{ marginBottom: 4 }}>Biến thể (Size / Màu / Tồn kho)</h4>
      <p style={{ fontSize: 12.5, color: '#71717A', marginTop: 0, marginBottom: 12 }}>
        Thêm ít nhất 1 biến thể trước khi lưu - sản phẩm không có size/màu thì khách không thể mua được.
      </p>

      {/* Tạo nhanh theo tổ hợp - dùng chung 1 mẫu size x màu, không phải gõ tay từng dòng. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 8, padding: 10 }}>
        <Input placeholder="Các size, vd: S, M, L, XL" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} style={{ flex: 1 }} />
        <Input placeholder="Các màu, vd: đen, trắng" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} style={{ flex: 1 }} />
        <Button icon={<ThunderboltOutlined />} onClick={generateCombos}>
          Tạo tổ hợp
        </Button>
      </div>

      {variants.length > 0 && (
        <Table
          size="small"
          rowKey={(v) => `${v.size}-${v.color}`}
          pagination={false}
          dataSource={variants}
          style={{ marginBottom: 12 }}
          columns={[
            { title: 'Size', dataIndex: 'size' },
            { title: 'Màu', dataIndex: 'color' },
            { title: 'SKU', dataIndex: 'sku' },
            {
              title: 'Tồn kho',
              dataIndex: 'stockQuantity',
              render: (v, _record, index) => <InputNumber size="small" min={0} value={v} onChange={(val) => updateStock(index, val || 0)} />,
            },
            {
              title: '',
              width: 40,
              render: (_, __, index) => <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />,
            },
          ]}
        />
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Input placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} style={{ width: 80 }} />
        <Input placeholder="Màu" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 100 }} />
        <InputNumber
          placeholder="Tồn kho"
          value={form.stockQuantity}
          onChange={(v) => setForm({ ...form, stockQuantity: v || 0 })}
          style={{ width: 100 }}
        />
        <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} style={{ width: 120 }} />
        <Button onClick={add}>Thêm</Button>
      </div>
    </div>
  );
}
