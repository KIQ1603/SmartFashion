import { useEffect, useState } from 'react';
import { Button, Descriptions, Modal, Select, Table, Tag, Tooltip, message } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '@/services/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { fullName: string; email: string };
}

interface OrderDetail extends Order {
  paymentMethod?: string | null;
  discountCode?: string | null;
  cancelReason?: string | null;
  address?: { recipient: string; phone: string; line: string; city: string; province?: string | null } | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    variant: { size: string; color: string; product: { name: string } };
  }[];
}

// packed (đã đóng gói) thêm giữa confirmed và shipping - mốc chặn khách tự hủy đơn (xem
// CANCELLABLE_STATUSES ở orders.service.ts backend): từ packed trở đi chỉ shop thao tác tiếp.
const STATUS_OPTIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipping'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  packed: 'Đã đóng gói',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  confirmed: 'blue',
  packed: 'cyan',
  shipping: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

function formatVnd(v: number) {
  return Number(v).toLocaleString('vi-VN') + '₫';
}

/** Sinh file PDF hóa đơn từ chi tiết đơn hàng - tải trực tiếp 1 lần bấm, không qua hộp thoại in
 * của trình duyệt (đồng nhất với cách "Xuất Excel" ở trang Sản phẩm đã làm - xuất file thật).
 * Font mặc định của jsPDF (Helvetica) chỉ hỗ trợ WinAnsi/Latin1, không có glyph tiếng Việt - chữ
 * có dấu sẽ hiển thị sai (đã tự kiểm tra thực tế phát hiện lỗi này) - phải nhúng font Roboto có
 * đủ dấu tiếng Việt. Import động để ~650KB base64 font không nằm trong bundle chính, chỉ tải khi
 * thực sự bấm xuất hóa đơn.
 */
async function exportInvoicePdf(order: OrderDetail) {
  const { default: robotoFontBase64 } = await import('@/assets/robotoFont');
  const doc = new jsPDF();
  doc.addFileToVFS('Roboto.ttf', robotoFontBase64);
  doc.addFont('Roboto.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto');

  doc.setFontSize(18);
  doc.text('HÓA ĐƠN BÁN HÀNG', 14, 18);
  doc.setFontSize(10);
  doc.text('SmartFashion', 14, 25);

  doc.setFontSize(10);
  doc.text(`Mã đơn: #${order.id.slice(0, 8)}`, 14, 36);
  doc.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}`, 14, 42);
  doc.text(`Trạng thái: ${STATUS_LABEL[order.status] || order.status}`, 14, 48);
  doc.text(`Phương thức thanh toán: ${order.paymentMethod || '—'}`, 14, 54);

  doc.text(`Khách hàng: ${order.user.fullName}`, 120, 36);
  doc.text(`Email: ${order.user.email}`, 120, 42);
  if (order.address) {
    doc.text(`Giao tới: ${order.address.recipient} - ${order.address.phone}`, 120, 48);
    doc.text(`${order.address.line}, ${order.address.city}`, 120, 54);
  }

  autoTable(doc, {
    startY: 64,
    head: [['Sản phẩm', 'Size/Màu', 'SL', 'Đơn giá', 'Thành tiền']],
    body: order.items.map((item) => [
      item.variant.product.name,
      `${item.variant.size} / ${item.variant.color}`,
      String(item.quantity),
      formatVnd(item.price),
      formatVnd(Number(item.price) * item.quantity),
    ]),
    foot: [['', '', '', 'Tổng cộng', formatVnd(order.totalAmount)]],
    // fontStyle mặc định của autoTable cho head/foot là 'bold' - chỉ nhúng đúng 1 style 'normal'
    // của Roboto (xem addFont ở trên) nên phải ép fontStyle:'normal' ở cả 2 chỗ này, nếu không
    // jsPDF tự rơi về Helvetica-Bold gốc (không có dấu tiếng Việt) khi gặp fontStyle 'bold'.
    styles: { font: 'Roboto', fontStyle: 'normal' },
    headStyles: { fillColor: [24, 24, 27], font: 'Roboto', fontStyle: 'normal' },
    footStyles: { fillColor: [244, 244, 245], textColor: [24, 24, 27], font: 'Roboto', fontStyle: 'normal' },
  });

  doc.save(`hoa-don-${order.id.slice(0, 8)}.pdf`);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [viewing, setViewing] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  async function load(status?: string) {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', { params: { pageSize: 100, status } });
      setOrders(data);
    } catch {
      message.error('Không tải được danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function handleFilterChange(status: string | undefined) {
    setStatusFilter(status);
    load(status);
  }

  async function changeStatus(id: string, status: string) {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      message.success('Đã cập nhật trạng thái đơn hàng.');
      load(statusFilter);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thể chuyển trạng thái.');
    }
  }

  async function fetchDetail(id: string): Promise<OrderDetail | null> {
    setDetailLoading(id);
    try {
      const { data } = await api.get<OrderDetail>(`/admin/orders/${id}`);
      return data;
    } catch {
      message.error('Không tải được chi tiết đơn hàng.');
      return null;
    } finally {
      setDetailLoading(null);
    }
  }

  async function handleView(id: string) {
    const detail = await fetchDetail(id);
    if (detail) setViewing(detail);
  }

  async function handleExport(id: string) {
    const detail = await fetchDetail(id);
    if (detail) {
      try {
        await exportInvoicePdf(detail);
      } catch {
        message.error('Không xuất được hóa đơn.');
      }
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#18181B' }}>Quản lý đơn hàng</h2>
        <p style={{ margin: '4px 0 0', color: '#71717A' }}>Theo dõi và cập nhật trạng thái xử lý đơn hàng.</p>
      </div>

      {/* Bộ lọc trạng thái - dùng thẳng tham số ?status= backend đã hỗ trợ sẵn, trước đây chưa
          có ô lọc nào ở giao diện dù API đã nhận. */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E4E7', padding: 20, marginBottom: 20 }}>
        <Select
          size="large"
          placeholder="Tất cả trạng thái"
          allowClear
          style={{ width: 240 }}
          value={statusFilter}
          onChange={handleFilterChange}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E4E7', overflow: 'hidden' }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          pagination={{ defaultPageSize: 10, showTotal: (total) => `Tổng cộng ${total} đơn hàng` }}
          columns={[
            { title: 'Mã đơn', dataIndex: 'id', render: (v) => v.slice(0, 8) },
            { title: 'Khách hàng', dataIndex: ['user', 'fullName'] },
            { title: 'Email', dataIndex: ['user', 'email'] },
            { title: 'Tổng tiền', dataIndex: 'totalAmount', render: (v) => formatVnd(v) },
            { title: 'Ngày tạo', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('vi-VN') },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (status, record: Order) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>
                  {STATUS_OPTIONS[status]?.length > 0 && (
                    <Select
                      size="small"
                      placeholder="Chuyển..."
                      style={{ width: 140 }}
                      options={STATUS_OPTIONS[status].map((s) => ({ value: s, label: STATUS_LABEL[s] || s }))}
                      onChange={(v) => changeStatus(record.id, v)}
                    />
                  )}
                </div>
              ),
            },
            {
              title: 'Thao tác',
              key: 'action',
              align: 'right' as const,
              render: (_, record: Order) => (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <Tooltip title="Xem chi tiết">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      loading={detailLoading === record.id}
                      onClick={() => handleView(record.id)}
                    />
                  </Tooltip>
                  <Tooltip title="Xuất hóa đơn (PDF)">
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      loading={detailLoading === record.id}
                      onClick={() => handleExport(record.id)}
                    />
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={viewing ? `Đơn hàng #${viewing.id.slice(0, 8)}` : ''}
        open={!!viewing}
        onCancel={() => setViewing(null)}
        width={640}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 6 } }}
        footer={[
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={() => viewing && exportInvoicePdf(viewing).catch(() => message.error('Không xuất được hóa đơn.'))}
          >
            Xuất hóa đơn (PDF)
          </Button>,
          <Button key="close" type="primary" onClick={() => setViewing(null)}>
            Đóng
          </Button>,
        ]}
      >
        {viewing && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Khách hàng" span={2}>
                {viewing.user.fullName} ({viewing.user.email})
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">{new Date(viewing.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_COLOR[viewing.status]}>{STATUS_LABEL[viewing.status] || viewing.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">{viewing.paymentMethod || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">{formatVnd(viewing.totalAmount)}</Descriptions.Item>
              {viewing.address && (
                <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                  {viewing.address.recipient} - {viewing.address.phone} - {viewing.address.line}, {viewing.address.city}
                </Descriptions.Item>
              )}
              {viewing.cancelReason && (
                <Descriptions.Item label="Lý do hủy" span={2}>
                  <span style={{ color: '#DC2626' }}>{viewing.cancelReason}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={viewing.items}
              columns={[
                { title: 'Sản phẩm', render: (_, item) => item.variant.product.name },
                { title: 'Size/Màu', render: (_, item) => `${item.variant.size} / ${item.variant.color}` },
                { title: 'SL', dataIndex: 'quantity', width: 50 },
                { title: 'Đơn giá', dataIndex: 'price', render: (v) => formatVnd(v) },
                { title: 'Thành tiền', render: (_, item) => formatVnd(Number(item.price) * item.quantity) },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
