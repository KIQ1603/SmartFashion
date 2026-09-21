import { useEffect, useState } from 'react';
import { Card, Col, Row, Skeleton, Table, Tag } from 'antd';
import {
  ArrowUpOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  SkinOutlined,
  TeamOutlined,
  UserAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Area, Pie } from '@ant-design/plots';
import { api } from '@/services/api';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  newCustomers30d: number;
  ordersByStatus: { status: string; count: number }[];
  bestsellers: { productId: string; name: string; purchases: number }[];
  revenueOverTime: { date: string; revenue: number; orders: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  packed: 'Đóng gói',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

// Màu ngữ nghĩa theo trạng thái (khác màu thương hiệu #C2410C) - nhìn vào biểu đồ là đoán được
// ngay trạng thái nào nhiều mà không cần đọc chú thích, đúng nguyên tắc "semantic color tách khỏi
// accent màu thương hiệu".
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  packed: '#8B5CF6',
  shipping: '#6366F1',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

function formatVnd(v: number) {
  return v.toLocaleString('vi-VN') + '₫';
}

function formatVndCompact(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'tr';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return String(v);
}

const STAT_CARDS: Array<{
  key: keyof Stats;
  title: string;
  icon: React.ReactNode;
  color: string;
  format: (v: number) => string;
}> = [
  { key: 'totalRevenue', title: 'Doanh thu', icon: <WalletOutlined />, color: '#C2410C', format: formatVnd },
  { key: 'totalOrders', title: 'Tổng đơn hàng', icon: <ShoppingCartOutlined />, color: '#3B82F6', format: (v) => String(v) },
  { key: 'totalUsers', title: 'Khách hàng', icon: <TeamOutlined />, color: '#8B5CF6', format: (v) => String(v) },
  { key: 'totalProducts', title: 'Sản phẩm', icon: <SkinOutlined />, color: '#10B981', format: (v) => String(v) },
  {
    key: 'averageOrderValue',
    title: 'Giá trị đơn trung bình',
    icon: <RiseOutlined />,
    color: '#F59E0B',
    format: (v) => formatVnd(Math.round(v)),
  },
  { key: 'newCustomers30d', title: 'Khách hàng mới (30 ngày)', icon: <UserAddOutlined />, color: '#EC4899', format: (v) => String(v) },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Không .catch() sẽ để lộ "Uncaught (in promise)" khi accessToken hết hạn và refresh cũng
    // thất bại - interceptor ở services/api.ts đã tự đăng xuất (clear()) trong trường hợp đó nên
    // chỉ cần im lặng ở đây, ProtectedRoute sẽ tự điều hướng về /login.
    api
      .get('/admin/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Col span={8} key={i}>
            <Card>
              <Skeleton active paragraph={false} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const ordersByStatusVi = stats.ordersByStatus.map((o) => ({
    ...o,
    statusLabel: STATUS_LABEL[o.status] || o.status,
  }));
  const totalOrdersForShare = stats.ordersByStatus.reduce((s, o) => s + o.count, 0) || 1;

  return (
    <div>
      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((c) => (
          <Col span={8} key={c.key}>
            {/* Icon tròn tô màu riêng từng chỉ số thay vì chữ trần - dễ quét mắt hơn, mỗi thẻ có
                bản sắc riêng thay vì 6 khối giống hệt nhau chỉ khác số. */}
            <Card styles={{ body: { display: 'flex', alignItems: 'center', gap: 16, padding: 20 } }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                  color: c.color,
                  background: `${c.color}1A`,
                }}
              >
                {c.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: '#71717A' }}>{c.title}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#18181B', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {c.format(stats[c.key] as number)}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="Doanh thu 30 ngày gần nhất">
            {stats.revenueOverTime.some((d) => d.revenue > 0) ? (
              <Area
                data={stats.revenueOverTime}
                xField="date"
                yField="revenue"
                height={300}
                shapeField="smooth"
                style={{ fill: 'linear-gradient(-90deg, rgba(194,65,12,0.02) 0%, rgba(194,65,12,0.35) 100%)', fillOpacity: 0.9 }}
                line={{ style: { stroke: '#C2410C', lineWidth: 2.5 } }}
                axis={{
                  y: { labelFormatter: (v: number) => formatVndCompact(Number(v)) },
                  x: { labelFormatter: (v: string) => v.slice(5) },
                }}
                tooltip={{ items: [{ field: 'revenue', name: 'Doanh thu', valueFormatter: (v: number) => formatVnd(Number(v)) }] }}
              />
            ) : (
              <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '60px 0' }}>Chưa có đơn hàng nào trong 30 ngày gần đây.</p>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Đơn hàng theo trạng thái">
            {ordersByStatusVi.length > 0 ? (
              <>
                <Pie
                  data={ordersByStatusVi}
                  angleField="count"
                  colorField="status"
                  height={220}
                  innerRadius={0.65}
                  scale={{ color: { domain: Object.keys(STATUS_COLOR), range: Object.values(STATUS_COLOR) } }}
                  label={false}
                  legend={false}
                  tooltip={{ items: [{ field: 'statusLabel', name: 'Trạng thái' }, { field: 'count', name: 'Số đơn' }] }}
                />
                {/* Chú thích tự viết thay legend mặc định - kèm % và số thật, không chỉ chấm màu +
                    tên trạng thái trơ trọi. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {ordersByStatusVi.map((o) => (
                    <div key={o.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_COLOR[o.status] || '#A1A1AA', flexShrink: 0 }} />
                      <span style={{ color: '#52525B', flex: 1 }}>{STATUS_LABEL[o.status] || o.status}</span>
                      <span style={{ fontWeight: 600, color: '#18181B', fontVariantNumeric: 'tabular-nums' }}>{o.count}</span>
                      <span style={{ color: '#A1A1AA', width: 36, textAlign: 'right' }}>
                        {Math.round((o.count / totalOrdersForShare) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '60px 0' }}>Chưa có đơn hàng nào.</p>
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Sản phẩm bán chạy">
            <Table
              rowKey="productId"
              pagination={false}
              dataSource={stats.bestsellers}
              locale={{ emptyText: 'Chưa có dữ liệu mua hàng.' }}
              columns={[
                {
                  title: '#',
                  width: 48,
                  render: (_v, _r, i) => (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: i < 3 ? '#FFF1E6' : '#F4F4F5',
                        color: i < 3 ? '#C2410C' : '#71717A',
                      }}
                    >
                      {i + 1}
                    </span>
                  ),
                },
                { title: 'Sản phẩm', dataIndex: 'name' },
                {
                  title: 'Lượt mua',
                  dataIndex: 'purchases',
                  width: 140,
                  render: (v: number) => (
                    <Tag icon={<ArrowUpOutlined />} color="success">
                      {v}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
