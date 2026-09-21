import { useEffect, useState } from 'react';
import { Card, Col, Row, Skeleton, Statistic, Table } from 'antd';
import { Area, Column } from '@ant-design/plots';
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
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

function formatVnd(v: number) {
  return v.toLocaleString('vi-VN') + '₫';
}

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
      <div>
        <Row gutter={16}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col span={8} key={i} style={{ marginBottom: 16 }}>
              <Card>
                <Skeleton active paragraph={false} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const ordersByStatusVi = stats.ordersByStatus.map((o) => ({ ...o, statusLabel: STATUS_LABEL[o.status] || o.status }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic title="Doanh thu" value={stats.totalRevenue} formatter={(v) => formatVnd(Number(v))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng đơn hàng" value={stats.totalOrders} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Khách hàng" value={stats.totalUsers} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Sản phẩm" value={stats.totalProducts} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Giá trị đơn trung bình" value={stats.averageOrderValue} formatter={(v) => formatVnd(Math.round(Number(v)))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Khách hàng mới (30 ngày)" value={stats.newCustomers30d} />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Doanh thu 30 ngày gần nhất">
            {stats.revenueOverTime.some((d) => d.revenue > 0) ? (
              <Area data={stats.revenueOverTime} xField="date" yField="revenue" height={280} />
            ) : (
              <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '60px 0' }}>Chưa có đơn hàng nào trong 30 ngày gần đây.</p>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="Đơn hàng theo trạng thái">
            {ordersByStatusVi.length > 0 ? (
              <Column data={ordersByStatusVi} xField="statusLabel" yField="count" height={280} color="#111827" />
            ) : (
              <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '60px 0' }}>Chưa có đơn hàng nào.</p>
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Sản phẩm bán chạy">
            <Table
              rowKey="productId"
              pagination={false}
              dataSource={stats.bestsellers}
              locale={{ emptyText: 'Chưa có dữ liệu mua hàng.' }}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'name' },
                { title: 'Lượt mua', dataIndex: 'purchases', width: 100 },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
