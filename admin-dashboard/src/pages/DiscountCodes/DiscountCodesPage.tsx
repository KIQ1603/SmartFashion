import { useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tag, Tooltip, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '@/services/api';
import DiscountCodesImportModal from './DiscountCodesImportModal';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderAmount: string | null;
  maxDiscountAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

function formatVnd(v: string | number | null) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('vi-VN') + 'đ';
}

/**
 * Quản lý mã giảm giá - CRUD tay + nhập hàng loạt từ Excel (cùng khuôn mẫu với "Nhập Excel" ở
 * trang Sản phẩm). Trạng thái hết hạn/hết lượt tính TẠI THỜI ĐIỂM XEM (không lưu cứng ở DB) - cột
 * "Trạng thái" chỉ phản ánh cờ isActive admin bật/tắt tay, còn hết hạn/hết lượt hiện riêng 1 tag
 * phụ để phân biệt "admin tắt" với "tự hết hiệu lực".
 */
export default function DiscountCodesPage() {
  const [data, setData] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  function load() {
    setLoading(true);
    api
      .get<DiscountCode[]>('/admin/discount-codes')
      .then(({ data }) => setData(data))
      .catch(() => message.error('Không tải được danh sách mã giảm giá.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'percentage', isActive: true });
    setModalOpen(true);
  }

  function openEdit(record: DiscountCode) {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      type: record.type,
      value: Number(record.value),
      minOrderAmount: record.minOrderAmount ? Number(record.minOrderAmount) : undefined,
      maxDiscountAmount: record.maxDiscountAmount ? Number(record.maxDiscountAmount) : undefined,
      maxUses: record.maxUses ?? undefined,
      dateRange:
        record.startsAt || record.expiresAt
          ? [record.startsAt ? dayjs(record.startsAt) : null, record.expiresAt ? dayjs(record.expiresAt) : null]
          : undefined,
      isActive: record.isActive,
      description: record.description ?? undefined,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    const [startsAt, expiresAt] = values.dateRange || [null, null];
    const payload = {
      code: values.code,
      type: values.type,
      value: values.value,
      minOrderAmount: values.minOrderAmount ?? null,
      maxDiscountAmount: values.maxDiscountAmount ?? null,
      maxUses: values.maxUses ?? null,
      startsAt: startsAt ? startsAt.format('YYYY-MM-DD') : null,
      expiresAt: expiresAt ? expiresAt.format('YYYY-MM-DD') : null,
      isActive: values.isActive,
      description: values.description || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/discount-codes/${editing.id}`, payload);
        message.success('Đã cập nhật mã giảm giá.');
      } else {
        await api.post('/admin/discount-codes', payload);
        message.success('Đã tạo mã giảm giá.');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không lưu được mã giảm giá.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/discount-codes/${id}`);
      message.success('Đã xoá mã giảm giá.');
      load();
    } catch {
      message.error('Không xoá được mã giảm giá.');
    }
  }

  const watchType = Form.useWatch('type', form);

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#18181B' }}>Mã giảm giá</h2>
          <p style={{ margin: '4px 0 0', color: '#71717A' }}>Tạo tay hoặc nhập hàng loạt từ Excel - áp dụng ngay ở giỏ hàng/thanh toán.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<UploadOutlined />} size="large" onClick={() => setImportModalOpen(true)}>
            Nhập Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Tạo mã giảm giá
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        locale={{ emptyText: 'Chưa có mã giảm giá nào.' }}
        columns={[
          {
            title: 'Mã',
            dataIndex: 'code',
            render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }}>{v}</span>,
          },
          {
            title: 'Giá trị',
            render: (_v, r) => (r.type === 'percentage' ? `${Number(r.value)}%` : formatVnd(r.value)),
          },
          {
            title: 'Điều kiện',
            render: (_v, r) => (
              <div style={{ fontSize: 12.5, color: '#71717A' }}>
                {r.minOrderAmount && <div>Đơn tối thiểu: {formatVnd(r.minOrderAmount)}</div>}
                {r.type === 'percentage' && r.maxDiscountAmount && <div>Giảm tối đa: {formatVnd(r.maxDiscountAmount)}</div>}
                {!r.minOrderAmount && !(r.type === 'percentage' && r.maxDiscountAmount) && '—'}
              </div>
            ),
          },
          {
            title: 'Lượt dùng',
            render: (_v, r) => (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.usedCount}
                {r.maxUses !== null ? ` / ${r.maxUses}` : ''}
              </span>
            ),
          },
          {
            title: 'Hiệu lực',
            render: (_v, r) => {
              const now = dayjs();
              const notStarted = r.startsAt && now.isBefore(dayjs(r.startsAt));
              const expired = r.expiresAt && now.isAfter(dayjs(r.expiresAt));
              const exhausted = r.maxUses !== null && r.usedCount >= r.maxUses;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Tag color={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Đang bật' : 'Đã tắt'}</Tag>
                  {notStarted && <Tag color="blue">Chưa tới ngày</Tag>}
                  {expired && <Tag color="error">Đã hết hạn</Tag>}
                  {exhausted && <Tag color="error">Đã hết lượt</Tag>}
                </div>
              );
            },
          },
          {
            title: 'Thao tác',
            width: 100,
            render: (_v, r) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Tooltip title="Sửa">
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                </Tooltip>
                <Popconfirm title="Xoá mã giảm giá này?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ">
                  <Tooltip title="Xoá">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editing ? 'Lưu' : 'Tạo'}
        cancelText="Huỷ"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true, message: 'Nhập mã (tối thiểu 3 ký tự)' }, { min: 3 }]}>
            <Input placeholder="CHAOMUNG10" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="type" label="Loại" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 'percentage', label: 'Giảm theo %' },
                  { value: 'fixed', label: 'Giảm số tiền cố định' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="value"
              label={watchType === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Phần trăm giảm (%)'}
              rules={[{ required: true, message: 'Nhập giá trị' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={watchType === 'percentage' ? 100 : undefined} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="minOrderAmount" label="Đơn tối thiểu (VNĐ)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
            </Form.Item>
            {watchType === 'percentage' && (
              <Form.Item name="maxDiscountAmount" label="Giảm tối đa (VNĐ)" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="maxUses" label="Số lượt dùng tối đa" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Không giới hạn" />
            </Form.Item>
            <Form.Item name="dateRange" label="Thời gian hiệu lực" style={{ flex: 1 }}>
              <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={['Bắt đầu', 'Hết hạn']} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả nội bộ">
            <Input.TextArea rows={2} placeholder="Ghi chú cho admin, khách không nhìn thấy" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <DiscountCodesImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImported={load} />
    </div>
  );
}
