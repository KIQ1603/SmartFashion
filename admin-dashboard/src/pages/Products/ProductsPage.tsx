import { useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tag, Tooltip, message } from 'antd';
import * as XLSX from 'xlsx';
import { DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { api } from '@/services/api';
import VariantManager from './VariantManager';
import ImageManager from './ImageManager';
import DraftVariantsEditor, { DraftVariant } from './DraftVariantsEditor';
import DraftImagesEditor, { DraftImage } from './DraftImagesEditor';
import ImportExcelModal from './ImportExcelModal';
import CreatableSelect from '@/components/CreatableSelect';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  color?: string | null;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  material?: string;
  season?: string;
  styleTags?: string[];
  status: string;
  category?: { name: string };
  categoryId?: string;
  images: ProductImage[];
  variants: Variant[];
}

const STATUS_LABEL: Record<string, string> = { active: 'Đang bán', out_of_stock: 'Hết hàng', discontinued: 'Ngừng bán' };
const STATUS_DOT: Record<string, string> = { active: '#22c55e', out_of_stock: '#ef4444', discontinued: '#a1a1aa' };

function flattenCategories(categories: Category[], prefix = ''): { id: string; label: string }[] {
  return categories.flatMap((c) => [
    { id: c.id, label: prefix + c.name },
    ...(c.children ? flattenCategories(c.children, prefix + c.name + ' / ') : []),
  ]);
}

function primaryImage(images: ProductImage[]): string {
  return images?.find((i) => i.isPrimary)?.imageUrl || images?.[0]?.imageUrl || '';
}

function totalStock(variants: Variant[]): number {
  return variants?.reduce((s, v) => s + (v.stockQuantity || 0), 0) || 0;
}

/** Sinh URL từ tên sản phẩm (vd: "Áo thun cotton trắng" -> "ao-thun-cotton-trang") - người quản
 * lý cửa hàng không phải là dev, không nên bắt họ tự nghĩ ra khái niệm "slug". */
function slugify(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<{
    brand: { id: string; value: string }[];
    material: { id: string; value: string }[];
    season: { id: string; value: string }[];
  }>({ brand: [], material: [], season: [] });
  // Biến thể/ảnh khi TẠO sản phẩm mới - sản phẩm chưa có id thật nên giữ tạm ở đây, gửi kèm 1
  // lần trong request tạo (xem DraftVariantsEditor/DraftImagesEditor). Sản phẩm đã tồn tại (sửa)
  // vẫn dùng VariantManager/ImageManager gọi API tức thời như cũ.
  const [draftVariants, setDraftVariants] = useState<DraftVariant[]>([]);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [form] = Form.useForm();
  const watchedSlug = Form.useWatch('slug', form);
  // Sản phẩm mới: tự sinh URL theo tên, cho tới khi admin tự tay sửa URL thì thôi ghi đè.
  // Sản phẩm đang sửa: khóa (true) ngay từ đầu - đổi tên không được âm thầm đổi luôn URL cũ,
  // vì URL đó có thể đã được chia sẻ/lưu bookmark ở nơi khác.
  const [slugLocked, setSlugLocked] = useState(false);

  // Bộ lọc (KHỐI 1) - lọc client-side trên danh sách đã tải (pageSize 100 đã đủ nhỏ cho quy mô demo).
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [appliedFilters, setAppliedFilters] = useState({ search: '', category: undefined as string | undefined, status: undefined as string | undefined });

  async function load() {
    setLoading(true);
    try {
      const [{ data: productData }, { data: categoryData }, { data: optionsData }] = await Promise.all([
        api.get('/products', { params: { pageSize: 100 } }),
        api.get('/categories'),
        api.get('/admin/attribute-options'),
      ]);
      setProducts(productData.items);
      setCategories(flattenCategories(categoryData));
      setAttributeOptions(optionsData);
      // Đồng bộ lại `editing` (nguồn dữ liệu variants/images cho modal đang mở) với bản ghi vừa
      // tải mới nhất - thiếu bước này thì sau khi thêm biến thể/ảnh mới, modal vẫn hiện dữ liệu
      // cũ (snapshot lúc mở modal) cho tới khi đóng rồi mở lại.
      setEditing((prev) => (prev ? productData.items.find((p: Product) => p.id === prev.id) ?? prev : prev));
    } catch {
      message.error('Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setSlugLocked(false);
    setDraftVariants([]);
    setDraftImages([]);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    form.setFieldsValue(product);
    setSlugLocked(true);
    setModalOpen(true);
  }

  // Tự tránh trùng URL với sản phẩm khác (loại chính sản phẩm đang sửa) - kiểu base, base-2,
  // base-3... giống cách WordPress/Shopify tự xử lý, không bắt admin tự nghĩ URL khác.
  function uniqueSlug(base: string): string {
    const taken = new Set(products.filter((p) => p.id !== editing?.id).map((p) => p.slug));
    if (!base || !taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  function handleNameChange(name: string) {
    if (!slugLocked) form.setFieldValue('slug', uniqueSlug(slugify(name)));
  }

  async function createAttributeOption(type: 'brand' | 'material' | 'season', value: string) {
    try {
      const { data: created } = await api.post('/admin/attribute-options', { type, value });
      setAttributeOptions((prev) =>
        prev[type].some((o) => o.value === value)
          ? prev
          : { ...prev, [type]: [...prev[type], created].sort((a, b) => a.value.localeCompare(b.value)) },
      );
    } catch {
      message.error('Không thêm được tùy chọn mới.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/products/${id}`);
      message.success('Đã xóa sản phẩm.');
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không thể xóa sản phẩm.');
    }
  }

  async function submit() {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const payload: any = { ...values, styleTags: (values.styleTags || '').split(',').map((s: string) => s.trim()).filter(Boolean) };
    try {
      if (editing) {
        await api.patch(`/admin/products/${editing.id}`, payload);
        message.success('Đã cập nhật sản phẩm.');
        setModalOpen(false);
      } else {
        if (draftVariants.length === 0) {
          message.warning('Thêm ít nhất 1 biến thể (size/màu/tồn kho) trước khi lưu.');
          return;
        }
        // Gửi kèm biến thể + ảnh đã cấu hình ở form tạo mới trong CÙNG 1 request - createProduct()
        // ở backend đã hỗ trợ nested-create sẵn, không cần bước "lưu xong mới thêm" nữa.
        payload.variants = draftVariants;
        payload.images = draftImages;
        const { data: created } = await api.post('/admin/products', payload);
        message.success('Đã tạo sản phẩm.');
        // Giữ modal mở, chuyển sang chế độ sửa ngay tại chỗ - để admin thêm tiếp biến thể/ảnh nếu
        // cần mà không phải đóng modal rồi tìm lại trong bảng để mở sửa lần nữa.
        setEditing(created);
        setSlugLocked(true);
        setDraftVariants([]);
        setDraftImages([]);
      }
      load();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không lưu được sản phẩm.');
    }
  }

  function applyFilters() {
    setAppliedFilters({ search: searchText.trim().toLowerCase(), category: categoryFilter, status: statusFilter });
  }

  function resetFilters() {
    setSearchText('');
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
    setAppliedFilters({ search: '', category: undefined, status: undefined });
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (appliedFilters.search) {
        const hay = `${p.name} ${p.id}`.toLowerCase();
        if (!hay.includes(appliedFilters.search)) return false;
      }
      if (appliedFilters.category && p.categoryId !== appliedFilters.category) return false;
      if (appliedFilters.status && p.status !== appliedFilters.status) return false;
      return true;
    });
  }, [products, appliedFilters]);

  // Xuất đúng danh sách đang lọc trên bảng (không phải toàn bộ sản phẩm) - cùng khuôn cột với
  // file nhập, để có thể sửa rồi nhập ngược lại được. Mỗi biến thể 1 dòng; sản phẩm chưa có biến
  // thể nào vẫn xuất 1 dòng riêng để không bị mất khỏi file.
  function exportToExcel() {
    const rows: Record<string, string | number>[] = [];
    for (const p of filteredProducts) {
      const base = {
        'Tên sản phẩm': p.name,
        'Danh mục': p.category?.name || '',
        Giá: Number(p.basePrice),
        'Giá gốc': p.compareAtPrice ? Number(p.compareAtPrice) : '',
        'Mô tả': p.description || '',
        'Thương hiệu': p.brand || '',
        'Chất liệu': p.material || '',
        Mùa: p.season || '',
        Tags: p.styleTags?.join(', ') || '',
      };
      if (p.variants.length === 0) {
        rows.push({ ...base, Size: '', Màu: '', 'Tồn kho': '', SKU: '', 'Ảnh (URL)': primaryImage(p.images) || '' });
        continue;
      }
      p.variants.forEach((v, i) => {
        rows.push({
          ...(i === 0 ? base : { ...base, 'Mô tả': '', 'Thương hiệu': '', 'Chất liệu': '', Mùa: '', Tags: '' }),
          Size: v.size,
          Màu: v.color,
          'Tồn kho': v.stockQuantity,
          SKU: v.sku,
          'Ảnh (URL)': i === 0 ? primaryImage(p.images) || '' : '',
        });
      });
    }
    if (rows.length === 0) {
      message.warning('Không có sản phẩm nào để xuất (kiểm tra lại bộ lọc).');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
    XLSX.writeFile(wb, `san-pham-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const columns = [
    {
      title: 'Thông tin sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#F4F4F5', flexShrink: 0, overflow: 'hidden', border: '1px solid #E4E4E7' }}>
            {primaryImage(record.images) && (
              <img src={primaryImage(record.images)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: '#18181B' }}>{text}</span>
            <span style={{ fontSize: 12.5, color: '#71717A' }}>SKU: {record.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (category: string) => category && <Tag color="blue" bordered={false} style={{ borderRadius: 999, padding: '2px 10px', fontWeight: 500 }}>{category}</Tag>,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'basePrice',
      key: 'price',
      render: (v: number, record: Product) => (
        <span>
          <span style={{ fontWeight: 700, color: '#18181B' }}>{Number(v).toLocaleString('vi-VN')}₫</span>
          {record.compareAtPrice && (
            <Tag color="red" style={{ marginLeft: 6 }}>
              -{Math.round((1 - Number(v) / Number(record.compareAtPrice)) * 100)}%
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Kho',
      key: 'stock',
      render: (_: any, record: Product) => {
        const stock = totalStock(record.variants);
        const bg = stock === 0 ? '#FEF2F2' : stock < 20 ? '#FFFBEB' : '#F0FDF4';
        const color = stock === 0 ? '#DC2626' : stock < 20 ? '#D97706' : '#16A34A';
        return <span style={{ padding: '3px 10px', borderRadius: 6, fontWeight: 600, fontSize: 13, background: bg, color }}>{stock}</span>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 500, color: '#3F3F46' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_DOT[status] || '#a1a1aa' }} />
          {STATUS_LABEL[status] || status}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Product) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => setViewing(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#18181B' }}>Danh sách sản phẩm</h2>
          <p style={{ margin: '4px 0 0', color: '#71717A' }}>Quản lý và cập nhật kho hàng của bạn</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<DownloadOutlined />} size="large" onClick={exportToExcel}>
            Xuất Excel
          </Button>
          <Button icon={<UploadOutlined />} size="large" onClick={() => setImportModalOpen(true)}>
            Nhập Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* KHỐI 1: BỘ LỌC - tách hẳn khỏi bảng, luôn hiển thị phía trên (không phải toggle ẩn/hiện). */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E4E7', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Input
            size="large"
            placeholder="Tìm tên, mã sản phẩm..."
            prefix={<SearchOutlined style={{ color: '#A1A1AA' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={applyFilters}
            allowClear
          />
          <Select
            size="large"
            placeholder="Tất cả danh mục"
            allowClear
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Select
            size="large"
            placeholder="Tất cả trạng thái"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="large" style={{ flex: 1 }} onClick={resetFilters}>
              Đặt lại
            </Button>
            <Button size="large" type="primary" style={{ flex: 1 }} onClick={applyFilters}>
              Lọc
            </Button>
          </div>
        </div>
      </div>

      {/* KHỐI 2: BẢNG DỮ LIỆU - card riêng, chỉ hiển thị kết quả sau khi lọc. */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E4E7', overflow: 'hidden' }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredProducts}
          columns={columns}
          pagination={{ defaultPageSize: 10, showTotal: (total) => `Tổng cộng ${total} sản phẩm` }}
        />
      </div>

      <Modal
        title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        cancelText={editing ? 'Đóng' : 'Hủy'}
        width={880}
        // Modal mặc định cuộn theo cả trang khi nội dung dài hơn màn hình - giới hạn chiều cao
        // của phần thân trong khung nhìn, chỉ phần nội dung form cuộn, còn tiêu đề/nút Lưu-Hủy
        // luôn cố định, khung không bị trôi theo khi cuộn.
        style={{ top: 24 }}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 6 } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input onChange={(e) => handleNameChange(e.target.value)} />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Đường dẫn URL"
            tooltip="Tự tạo theo tên sản phẩm - chỉ cần sửa nếu muốn 1 đường dẫn khác."
            rules={[
              { required: true, message: 'Chưa có tên sản phẩm để tự tạo đường dẫn.' },
              {
                validator: (_, value) =>
                  products.some((p) => p.slug === value && p.id !== editing?.id)
                    ? Promise.reject('Đường dẫn này đã dùng cho sản phẩm khác, hãy đổi thành 1 đường dẫn khác.')
                    : Promise.resolve(),
              },
            ]}
          >
            <Input onChange={() => setSlugLocked(true)} />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
            <Select options={categories.map((c) => ({ value: c.id, label: c.label }))} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="brand" label="Thương hiệu">
            <CreatableSelect
              options={attributeOptions.brand.map((o) => o.value)}
              onCreateOption={(v) => createAttributeOption('brand', v)}
              placeholder="Chọn hoặc thêm thương hiệu mới"
            />
          </Form.Item>
          <Form.Item name="basePrice" label="Giá (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="compareAtPrice"
            label="Giá gốc trước giảm (VNĐ) - để trống nếu không sale"
            tooltip="Nếu nhập, sản phẩm sẽ hiện badge giảm giá và xuất hiện ở tab 'Đang giảm giá' trên trang chủ."
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="material" label="Chất liệu">
            <CreatableSelect
              options={attributeOptions.material.map((o) => o.value)}
              onCreateOption={(v) => createAttributeOption('material', v)}
              placeholder="Chọn hoặc thêm chất liệu mới"
            />
          </Form.Item>
          <Form.Item name="season" label="Mùa">
            <CreatableSelect
              options={attributeOptions.season.map((o) => o.value)}
              onCreateOption={(v) => createAttributeOption('season', v)}
              placeholder="Chọn hoặc thêm mùa mới"
            />
          </Form.Item>
          <Form.Item name="styleTags" label="Tags (phân cách bằng dấu phẩy)">
            <Input placeholder="basic, streetwear" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" initialValue="active">
            <Select options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
        </Form>

        {!editing && (
          <>
            <DraftVariantsEditor variants={draftVariants} onChange={setDraftVariants} skuPrefix={(watchedSlug || 'sp').toUpperCase()} />
            <DraftImagesEditor
              images={draftImages}
              colors={[...new Set(draftVariants.map((v) => v.color))]}
              onChange={setDraftImages}
            />
          </>
        )}
        {editing && <VariantManager productId={editing.id} variants={editing.variants} onChange={load} />}
        {editing && (
          <ImageManager
            productId={editing.id}
            images={editing.images}
            colors={[...new Set(editing.variants.map((v) => v.color))]}
            onChange={load}
          />
        )}
      </Modal>

      <Modal
        title="Chi tiết sản phẩm"
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={null}
        width={480}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 6 } }}
        destroyOnHidden
      >
        {viewing && (
          <>
            {primaryImage(viewing.images) && (
              <img
                src={primaryImage(viewing.images)}
                alt=""
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 8, marginBottom: 16, border: '1px solid #E4E4E7' }}
              />
            )}
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Tên">{viewing.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">{viewing.slug}</Descriptions.Item>
              <Descriptions.Item label="Danh mục">{viewing.category?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Thương hiệu">{viewing.brand || '—'}</Descriptions.Item>
              <Descriptions.Item label="Giá">{Number(viewing.basePrice).toLocaleString('vi-VN')}₫</Descriptions.Item>
              <Descriptions.Item label="Chất liệu">{viewing.material || '—'}</Descriptions.Item>
              <Descriptions.Item label="Mùa">{viewing.season || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tags">{viewing.styleTags?.join(', ') || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tồn kho">{totalStock(viewing.variants)}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{STATUS_LABEL[viewing.status] || viewing.status}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      <ImportExcelModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImported={load} />
    </div>
  );
}
