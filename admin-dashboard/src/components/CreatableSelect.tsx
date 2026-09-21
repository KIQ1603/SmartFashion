import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Select cho phép chọn từ danh sách có sẵn (config được) HOẶC gõ thêm giá trị mới ngay trong lúc
 * điền form - giá trị mới tự lưu lại (qua onCreateOption) để lần sau chọn được luôn, không cần
 * trang quản lý riêng cho từng danh sách nhỏ (thương hiệu/chất liệu/mùa).
 */
export default function CreatableSelect({
  value,
  onChange,
  options,
  onCreateOption,
  placeholder,
}: {
  value?: string;
  // Form.Item (antd) tự inject value/onChange lúc render qua cloneElement - TS không thấy được
  // việc đó nên khai báo optional ở đây, tránh bắt buộc phải truyền tay onChange ở nơi dùng trong
  // Form.
  onChange?: (v: string | undefined) => void;
  options: string[];
  onCreateOption: (value: string) => Promise<void>;
  placeholder?: string;
}) {
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const v = newValue.trim();
    if (!v) return;
    setCreating(true);
    try {
      await onCreateOption(v);
      onChange?.(v);
      setNewValue('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Select
      showSearch
      allowClear
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options.map((o) => ({ value: o, label: o }))}
      filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
      popupRender={(menu) => (
        <>
          {menu}
          <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid #F0F0F0' }}>
            <Input
              size="small"
              placeholder="Thêm giá trị mới..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleCreate();
              }}
            />
            <Button size="small" type="text" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
              Thêm
            </Button>
          </div>
        </>
      )}
    />
  );
}
