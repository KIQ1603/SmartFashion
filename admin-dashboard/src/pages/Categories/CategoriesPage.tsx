import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '@/services/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

function flatten(categories: Category[]): Category[] {
  return categories.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  async function load() {
    try {
      const { data } = await api.get('/categories');
      setTree(data);
    } catch {
      message.error('Không tải được danh mục.');
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    form.setFieldsValue(c);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/categories/${id}`);
      message.success('Đã xóa danh mục.');
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thể xóa danh mục.');
    }
  }

  async function submit() {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      if (editing) {
        await api.patch(`/admin/categories/${editing.id}`, values);
        message.success('Đã cập nhật.');
      } else {
        await api.post('/admin/categories', values);
        message.success('Đã tạo danh mục.');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không lưu được danh mục.');
    }
  }

  const flatOptions = flatten(tree).map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý danh mục</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm danh mục
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={tree}
        pagination={false}
        columns={[
          { title: 'Tên danh mục', dataIndex: 'name' },
          { title: 'Slug', dataIndex: 'slug' },
          {
            title: 'Hành động',
            render: (_, record) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" onClick={() => openEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]}
        defaultExpandAllRows
      />

      <Modal title={editing ? 'Sửa danh mục' : 'Thêm danh mục'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="Danh mục cha (nếu có)">
            <Select allowClear options={flatOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
