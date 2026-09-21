import { useEffect, useState } from 'react';
import { Button, Table, Tag, message } from 'antd';
import { api } from '@/services/api';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { pageSize: 100 } });
      setUsers(data.items);
    } catch {
      message.error('Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !isActive });
      message.success(!isActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thể cập nhật trạng thái.');
    }
  }

  return (
    <div>
      <h2>Quản lý người dùng</h2>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={[
          { title: 'Họ tên', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Vai trò', dataIndex: 'role' },
          { title: 'Ngày tạo', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
          {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            render: (v) => (v ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Đã khóa</Tag>),
          },
          {
            title: 'Hành động',
            render: (_, record) => (
              <Button size="small" danger={record.isActive} onClick={() => toggleActive(record.id, record.isActive)}>
                {record.isActive ? 'Khóa' : 'Mở khóa'}
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
