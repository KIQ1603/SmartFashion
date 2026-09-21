import { useEffect, useState } from 'react';
import { Button, Input, Popconfirm, Table, Tabs, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '@/services/api';

interface Option {
  id: string;
  value: string;
}

type OptionsByType = { brand: Option[]; material: Option[]; season: Option[] };

const TYPE_LABEL: Record<string, string> = { brand: 'thương hiệu', material: 'chất liệu', season: 'mùa' };

/**
 * Quản lý danh sách tùy chọn dùng chung cho form Sản phẩm (thương hiệu/chất liệu/mùa) - xóa ở
 * đây chỉ bỏ khỏi danh sách gợi ý chọn nhanh, KHÔNG đụng tới sản phẩm đã dùng giá trị đó (vì
 * Product.brand/material/season vẫn là string tự do, không phải khóa ngoại tới bảng này).
 */
function OptionTab({
  type,
  options,
  loading,
  onAdd,
  onRemove,
}: {
  type: string;
  options: Option[];
  loading: boolean;
  onAdd: (v: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const v = newValue.trim();
    if (!v) return;
    if (options.some((o) => o.value.toLowerCase() === v.toLowerCase())) {
      message.warning('Giá trị này đã có trong danh sách.');
      return;
    }
    setSaving(true);
    try {
      await onAdd(v);
      setNewValue('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, maxWidth: 420 }}>
        <Input
          placeholder={`Thêm ${TYPE_LABEL[type]} mới...`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onPressEnter={handleAdd}
        />
        <Button type="primary" icon={<PlusOutlined />} loading={saving} onClick={handleAdd}>
          Thêm
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={options}
        pagination={false}
        columns={[
          { title: 'Giá trị', dataIndex: 'value' },
          {
            title: 'Hành động',
            width: 100,
            align: 'right' as const,
            render: (_, record) => (
              <Popconfirm title={`Xóa "${record.value}" khỏi danh sách?`} onConfirm={() => onRemove(record.id)}>
                <Button size="small" danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]}
        locale={{ emptyText: `Chưa có ${TYPE_LABEL[type]} nào.` }}
      />
    </div>
  );
}

export default function AttributesPage() {
  const [options, setOptions] = useState<OptionsByType>({ brand: [], material: [], season: [] });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/attribute-options');
      setOptions(data);
    } catch {
      message.error('Không tải được danh sách tùy chọn.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addOption(type: string, value: string) {
    try {
      await api.post('/admin/attribute-options', { type, value });
      message.success('Đã thêm.');
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thêm được.');
    }
  }

  async function removeOption(id: string) {
    try {
      await api.delete(`/admin/attribute-options/${id}`);
      message.success('Đã xóa.');
      load();
    } catch {
      message.error('Không xóa được.');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#18181B' }}>Quản lý thuộc tính sản phẩm</h2>
        <p style={{ margin: '4px 0 0', color: '#71717A' }}>Danh sách thương hiệu, chất liệu, mùa dùng để chọn nhanh khi tạo/sửa sản phẩm.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E4E7', padding: 20 }}>
        <Tabs
          items={[
            { key: 'brand', label: 'Thương hiệu', children: <OptionTab type="brand" options={options.brand} loading={loading} onAdd={(v) => addOption('brand', v)} onRemove={removeOption} /> },
            { key: 'material', label: 'Chất liệu', children: <OptionTab type="material" options={options.material} loading={loading} onAdd={(v) => addOption('material', v)} onRemove={removeOption} /> },
            { key: 'season', label: 'Mùa', children: <OptionTab type="season" options={options.season} loading={loading} onAdd={(v) => addOption('season', v)} onRemove={removeOption} /> },
          ]}
        />
      </div>
    </div>
  );
}
