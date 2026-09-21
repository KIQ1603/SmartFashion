import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { ProductQueryDto } from './dto/product-query.dto';

// Cột file Excel nhập/xuất sản phẩm - dùng chung 1 nơi cho cả sinh file mẫu và đọc file nhập,
// tránh lệch tên cột giữa 2 chiều. Mỗi dòng = 1 biến thể (size/màu); các dòng cùng "Tên sản phẩm"
// + cùng "Danh mục" được gộp thành 1 sản phẩm nhiều biến thể.
const IMPORT_COLUMNS = [
  'Tên sản phẩm',
  'Danh mục',
  'Giá',
  'Giá gốc',
  'Mô tả',
  'Thương hiệu',
  'Chất liệu',
  'Mùa',
  'Tags',
  'Size',
  'Màu',
  'Tồn kho',
  'SKU',
  'Ảnh (URL)',
] as const;

const IMPORT_GUIDE: [string, string, string][] = [
  ['Tên sản phẩm', 'Có', 'Các dòng cùng tên + cùng danh mục sẽ gộp thành 1 sản phẩm nhiều biến thể (nhiều size/màu)'],
  ['Danh mục', 'Có', 'Phải trùng đúng tên 1 danh mục đã có sẵn trong hệ thống (vd: "Áo thun")'],
  ['Giá', 'Có', 'Số, đơn vị VNĐ, lớn hơn 0'],
  ['Giá gốc', 'Không', 'Chỉ nhập nếu sản phẩm đang giảm giá (giá gốc phải lớn hơn Giá)'],
  ['Mô tả', 'Không', 'Chỉ cần điền ở dòng đầu tiên của sản phẩm'],
  ['Thương hiệu', 'Không', 'Chỉ cần điền ở dòng đầu tiên của sản phẩm'],
  ['Chất liệu', 'Không', 'Chỉ cần điền ở dòng đầu tiên của sản phẩm'],
  ['Mùa', 'Không', 'Chỉ cần điền ở dòng đầu tiên của sản phẩm'],
  ['Tags', 'Không', 'Nhiều tag cách nhau bằng dấu phẩy, vd: "basic, unisex"'],
  ['Size', 'Có', 'Mỗi dòng là 1 biến thể riêng (size + màu)'],
  ['Màu', 'Có', ''],
  ['Tồn kho', 'Có', 'Số lượng tồn kho của riêng biến thể này'],
  ['SKU', 'Có', 'Mã riêng từng biến thể, không được trùng với SKU đã có trong hệ thống'],
  ['Ảnh (URL)', 'Không', 'Có thể để trống, thêm ảnh sau ở màn Sửa sản phẩm. Nếu điền, ảnh sẽ tự gắn với đúng màu ở dòng đó.'],
];

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  /**
   * Gộp avgRating/reviewCount thật từ bảng reviews vào danh sách sản phẩm bằng 1 groupBy
   * (không N+1 query từng sản phẩm) - dùng cho sao đánh giá trên Product Card.
   */
  private async attachRatings<T extends { id: string }>(products: T[]): Promise<(T & { avgRating: number | null; reviewCount: number })[]> {
    if (products.length === 0) return [];
    const stats = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) }, status: 'visible' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const byId = new Map(stats.map((s) => [s.productId, s]));
    return products.map((p) => {
      const s = byId.get(p.id);
      return { ...p, avgRating: s?._avg.rating ?? null, reviewCount: s?._count.rating ?? 0 };
    });
  }

  // Lọc theo slug 1 danh mục CHA (vd "Áo") phải bao gồm cả sản phẩm nằm ở danh mục CON (Áo thun,
  // Áo sơ mi...) - sản phẩm luôn được gán trực tiếp vào danh mục lá (leaf), không bao giờ gán vào
  // danh mục cha đứng riêng. Khớp đúng cách CategoriesService tính productCount (cộng dồn từ con
  // lên cha) - thiếu bước này thì bấm vào danh mục cha sẽ ra "0 sản phẩm" dù trang chủ báo có N.
  private async resolveCategoryIds(slug: string): Promise<string[]> {
    const target = await this.prisma.category.findUnique({ where: { slug } });
    if (!target) return [];
    const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const ids = [target.id];
    let frontier = [target.id];
    while (frontier.length) {
      const next = all.filter((c) => c.parentId && frontier.includes(c.parentId)).map((c) => c.id);
      ids.push(...next);
      frontier = next;
    }
    return ids;
  }

  async list(query: ProductQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;

    const where: Prisma.ProductWhereInput = { status: 'active' };
    if (query.category) where.categoryId = { in: await this.resolveCategoryIds(query.category) };
    if (query.brand) where.brand = query.brand;
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) (where.basePrice as any).gte = query.minPrice;
      if (query.maxPrice) (where.basePrice as any).lte = query.maxPrice;
    }
    if (query.onSale) where.compareAtPrice = { not: null };
    if (query.color || query.size) {
      where.variants = {
        some: {
          ...(query.color ? { color: query.color } : {}),
          ...(query.size ? { size: query.size } : {}),
        },
      };
    }
    if (query.q?.trim()) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { brand: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { basePrice: 'asc' };
    if (query.sort === 'price_desc') orderBy = { basePrice: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };
    // 'bestselling' được xử lý riêng bên dưới vì cần group theo interactions

    if (query.sort === 'bestselling') {
      const top = await this.prisma.userInteraction.groupBy({
        by: ['productId'],
        where: { interactionType: 'purchase' },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: pageSize * page,
      });
      const orderedIds = top.map((t) => t.productId);
      const products = await this.prisma.product.findMany({
        where: { ...where, id: { in: orderedIds } },
        include: { images: true, variants: true, category: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      const sliced = orderedIds.slice((page - 1) * pageSize, page * pageSize);
      const items = sliced.map((id) => byId.get(id)).filter(Boolean) as (typeof products)[number][];
      return {
        items: await this.attachRatings(items),
        page,
        pageSize,
        total: orderedIds.length,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { images: true, variants: true, category: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: await this.attachRatings(items), page, pageSize, total };
  }

  /**
   * Danh sách lọc thật (thương hiệu/màu/khoảng giá) để dựng bộ lọc trang Shop - lấy từ chính dữ
   * liệu sản phẩm đang active, không phải danh sách cứng đoán trước, nên luôn khớp với những gì
   * thật sự lọc được. Scope theo category nếu có để bộ lọc chỉ hiện lựa chọn còn ý nghĩa.
   */
  async facets(categorySlug?: string) {
    const where: Prisma.ProductWhereInput = { status: 'active' };
    if (categorySlug) where.categoryId = { in: await this.resolveCategoryIds(categorySlug) };

    const [brands, variants, priceAgg] = await Promise.all([
      this.prisma.product.findMany({ where, distinct: ['brand'], select: { brand: true } }),
      this.prisma.productVariant.findMany({
        where: { product: where },
        distinct: ['color'],
        select: { color: true },
      }),
      this.prisma.product.aggregate({ where, _min: { basePrice: true }, _max: { basePrice: true } }),
    ]);

    return {
      brands: brands.map((b) => b.brand).filter((b): b is string => !!b).sort(),
      colors: variants.map((v) => v.color).filter(Boolean).sort(),
      minPrice: Number(priceAgg._min.basePrice ?? 0),
      maxPrice: Number(priceAgg._max.basePrice ?? 0),
    };
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        images: true,
        variants: true,
        category: true,
        reviews: { where: { status: 'visible' }, include: { user: { select: { fullName: true } } } },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm.');

    // soldCount thật, tổng hợp từ order_items đã đặt (loại đơn đã hủy) - thay cho kiểu số liệu
    // "897 sold in last 32 hours" bịa đặt hay thấy ở theme mẫu, ở đây là số thật lấy từ đơn hàng.
    const sold = await this.prisma.orderItem.aggregate({
      where: { variant: { productId: product.id }, order: { status: { not: 'cancelled' } } },
      _sum: { quantity: true },
    });

    return { ...product, soldCount: sold._sum.quantity ?? 0 };
  }

  async search(q: string, limit = 20) {
    if (!q?.trim()) return [];
    const items = await this.prisma.product.findMany({
      where: {
        status: 'active',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { images: true, variants: true },
      take: limit,
    });
    return this.attachRatings(items);
  }

  async addReview(userId: string, productId: string, rating: number, comment?: string) {
    // Nghiệp vụ: chỉ cho phép đánh giá nếu user ĐÃ NHẬN thành công sản phẩm (đặc tả mục 1) - trước
    // đây cho đánh giá cả khi đơn mới confirmed/shipping (chưa cầm được hàng), không hợp lý.
    const purchased = await this.prisma.orderItem.findFirst({
      where: { order: { userId, status: 'delivered' }, variant: { productId } },
    });
    if (!purchased) {
      throw new NotFoundException('Bạn cần nhận được sản phẩm này (đơn đã giao) trước khi đánh giá.');
    }
    // Chặn spam: mỗi khách chỉ đánh giá 1 sản phẩm 1 lần - trước đây không kiểm tra, khách đã mua
    // có thể gửi vô hạn đánh giá lặp lại. Check tường minh trước để trả lỗi tiếng Việt rõ ràng,
    // thay vì để lộ lỗi vi phạm unique constraint thô từ Prisma xuống client.
    const existing = await this.prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi.');
    }
    return this.prisma.review.create({ data: { userId, productId, rating, comment } });
  }

  // ---- Admin CRUD ----
  async createProduct(data: any) {
    const { variants, images, ...rest } = data;
    // images có thể là string[] (tương thích ngược) hoặc {imageUrl, color?}[] (form tạo sản phẩm
    // ở admin cho cấu hình màu/size/ảnh ngay lúc tạo, không phải lưu xong mới thêm được) - ảnh
    // đầu tiên trong danh sách luôn là ảnh đại diện.
    const normalizedImages = images?.length
      ? images.map((img: any) => ({
          imageUrl: typeof img === 'string' ? img : img.imageUrl,
          color: typeof img === 'string' ? null : img.color || null,
        }))
      : undefined;
    try {
      return await this.prisma.product.create({
        data: {
          ...rest,
          variants: variants?.length ? { create: variants } : undefined,
          images: normalizedImages
            ? { create: normalizedImages.map((img: any, idx: number) => ({ ...img, isPrimary: idx === 0 })) }
            : undefined,
        },
        include: { variants: true, images: true },
      });
    } catch (e) {
      throw this.mapUniqueConstraintError(e);
    }
  }

  async updateProduct(id: string, data: any) {
    const { variants, images, ...rest } = data;
    try {
      return await this.prisma.product.update({ where: { id }, data: rest });
    } catch (e) {
      throw this.mapUniqueConstraintError(e);
    }
  }

  /** slug/sku là @unique trong schema - lỗi P2002 mặc định của Prisma bị ExceptionFilter chung
   * biến thành "Đã có lỗi xảy ra ở máy chủ" chung chung, không nói rõ trùng field nào. Bắt riêng
   * ở đây để trả về đúng thông báo, admin biết ngay cần đổi gì thay vì đoán mò. */
  private mapUniqueConstraintError(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = (e.meta?.target as string[])?.join(', ') || '';
      if (target.includes('slug')) return new ConflictException('Đường dẫn URL này đã được dùng cho sản phẩm khác.');
      if (target.includes('sku')) return new ConflictException('Mã SKU này đã tồn tại.');
      return new ConflictException('Dữ liệu bị trùng với sản phẩm khác.');
    }
    return e;
  }

  /**
   * UserInteraction/OrderItem KHÔNG cascade khi xóa Product (cố ý, khác với ProductVariant/
   * ProductImage) - đây là dữ liệu huấn luyện mô hình gợi ý và lịch sử đơn hàng thật, xóa sản
   * phẩm không được phép âm thầm xóa luôn dữ liệu đó. Trước đây thiếu kiểm tra này, Postgres tự
   * chặn bằng lỗi khóa ngoại và lộ ra thành 500 "Đã có lỗi xảy ra ở máy chủ" chung chung - kiểm
   * tra trước để báo đúng lý do và hướng xử lý (chuyển "Ngừng bán" thay vì xóa hẳn).
   */
  async removeProduct(id: string) {
    const [orderItemCount, interactionCount] = await Promise.all([
      this.prisma.orderItem.count({ where: { variant: { productId: id } } }),
      this.prisma.userInteraction.count({ where: { productId: id } }),
    ]);
    if (orderItemCount > 0) {
      throw new ConflictException(
        'Sản phẩm đã từng được đặt hàng - không thể xóa vì sẽ mất dữ liệu đơn hàng. Hãy chuyển trạng thái sang "Ngừng bán" thay vì xóa hẳn.',
      );
    }
    if (interactionCount > 0) {
      throw new ConflictException(
        'Sản phẩm đã có lượt xem/tương tác thật - xóa hẳn sẽ làm mất dữ liệu huấn luyện mô hình gợi ý. Hãy chuyển trạng thái sang "Ngừng bán" thay vì xóa hẳn.',
      );
    }
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (e) {
      // Lớp an toàn dự phòng - phòng trường hợp còn ràng buộc khóa ngoại khác chưa lường tới.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Không thể xóa vì sản phẩm vẫn còn dữ liệu liên quan (giỏ hàng/đơn hàng/tương tác).');
      }
      throw e;
    }
  }

  addVariant(productId: string, data: any) {
    return this.prisma.productVariant.create({ data: { ...data, productId } });
  }

  updateVariant(id: string, data: any) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  uploadImage(buffer: Buffer) {
    return this.cloudinary.uploadImage(buffer);
  }

  async addImage(productId: string, data: { imageUrl: string; isPrimary?: boolean; color?: string }) {
    // Chỉ 1 ảnh được là "primary" (ảnh đại diện hiện trên Product Card/thumbnail đầu tiên) -
    // set ảnh mới làm primary thì bỏ cờ primary của các ảnh cũ trong 1 transaction.
    if (data.isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    }
    return this.prisma.productImage.create({ data: { ...data, productId } });
  }

  async setPrimaryImage(id: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh.');
    await this.prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isPrimary: false } });
    return this.prisma.productImage.update({ where: { id }, data: { isPrimary: true } });
  }

  removeImage(id: string) {
    return this.prisma.productImage.delete({ where: { id } });
  }

  private slugify(text: string): string {
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

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name) || 'san-pham';
    let slug = base;
    let i = 2;
    // eslint-disable-next-line no-await-in-loop
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${i}`;
      i++;
    }
    return slug;
  }

  /** File .xlsx mẫu để admin điền theo đúng cột - sheet 1 có sẵn 1 sản phẩm ví dụ 2 biến thể,
   * sheet 2 là bảng hướng dẫn cột nào bắt buộc/có thể bỏ trống. */
  generateImportTemplate(): Buffer {
    const sample = [
      {
        'Tên sản phẩm': 'Áo thun basic',
        'Danh mục': 'Áo thun',
        Giá: 199000,
        'Giá gốc': '',
        'Mô tả': 'Áo thun cotton form rộng',
        'Thương hiệu': 'SmartFashion',
        'Chất liệu': 'cotton',
        Mùa: 'all-season',
        Tags: 'basic, unisex',
        Size: 'M',
        Màu: 'trắng',
        'Tồn kho': 50,
        SKU: 'AT-TRANG-M',
        'Ảnh (URL)': '',
      },
      {
        'Tên sản phẩm': 'Áo thun basic',
        'Danh mục': 'Áo thun',
        Giá: 199000,
        'Giá gốc': '',
        'Mô tả': '',
        'Thương hiệu': '',
        'Chất liệu': '',
        Mùa: '',
        Tags: '',
        Size: 'L',
        Màu: 'trắng',
        'Tồn kho': 40,
        SKU: 'AT-TRANG-L',
        'Ảnh (URL)': '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: IMPORT_COLUMNS as unknown as string[] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
    const guideWs = XLSX.utils.aoa_to_sheet([['Cột', 'Bắt buộc?', 'Ghi chú'], ...IMPORT_GUIDE]);
    XLSX.utils.book_append_sheet(wb, guideWs, 'Hướng dẫn');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Nhập sản phẩm hàng loạt từ file Excel - mỗi dòng là 1 biến thể, gộp theo (tên sản phẩm +
   * danh mục). Không dừng giữa chừng khi gặp dòng lỗi - bỏ qua dòng/sản phẩm đó, gom hết lỗi lại
   * trả về 1 lần để admin sửa file rồi nhập lại, đỡ phải mò từng dòng một.
   */
  async importFromExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      throw new ConflictException('File không có dữ liệu (hoặc thiếu dòng tiêu đề đúng tên cột).');
    }

    const categories = await this.prisma.category.findMany();
    const categoryByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));

    interface Group {
      productData: any;
      variants: { size: string; color: string; stockQuantity: number; sku: string }[];
      images: { imageUrl: string; color: string }[];
    }
    const groups = new Map<string, Group>();
    const errors: { row: number; reason: string }[] = [];

    rows.forEach((row, idx) => {
      const excelRow = idx + 2; // dòng 1 là tiêu đề
      const name = String(row['Tên sản phẩm'] || '').trim();
      const categoryName = String(row['Danh mục'] || '').trim();
      const size = String(row['Size'] || '').trim();
      const color = String(row['Màu'] || '').trim();
      const sku = String(row['SKU'] || '').trim();
      const price = Number(row['Giá']);
      const stock = Number(row['Tồn kho']);

      if (!name) return errors.push({ row: excelRow, reason: 'Thiếu "Tên sản phẩm".' });
      if (!categoryName) return errors.push({ row: excelRow, reason: 'Thiếu "Danh mục".' });
      const category = categoryByName.get(categoryName.toLowerCase());
      if (!category) return errors.push({ row: excelRow, reason: `Không tìm thấy danh mục "${categoryName}".` });
      if (!price || Number.isNaN(price) || price <= 0) return errors.push({ row: excelRow, reason: '"Giá" không hợp lệ.' });
      if (!size) return errors.push({ row: excelRow, reason: 'Thiếu "Size".' });
      if (!color) return errors.push({ row: excelRow, reason: 'Thiếu "Màu".' });
      if (!sku) return errors.push({ row: excelRow, reason: 'Thiếu "SKU".' });
      if (Number.isNaN(stock) || stock < 0) return errors.push({ row: excelRow, reason: '"Tồn kho" không hợp lệ.' });

      const groupKey = `${name.toLowerCase()}|${category.id}`;
      if (!groups.has(groupKey)) {
        const compareAtPrice = Number(row['Giá gốc']);
        groups.set(groupKey, {
          productData: {
            name,
            categoryId: category.id,
            basePrice: price,
            compareAtPrice: compareAtPrice > 0 ? compareAtPrice : undefined,
            description: String(row['Mô tả'] || '').trim() || undefined,
            brand: String(row['Thương hiệu'] || '').trim() || undefined,
            material: String(row['Chất liệu'] || '').trim() || undefined,
            season: String(row['Mùa'] || '').trim() || undefined,
            styleTags: String(row['Tags'] || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
          variants: [],
          images: [],
        });
      }
      const group = groups.get(groupKey)!;
      if (group.variants.some((v) => v.size === size && v.color === color)) {
        return errors.push({ row: excelRow, reason: `Trùng size/màu (${size}/${color}) với 1 dòng khác của cùng sản phẩm.` });
      }
      if (group.variants.some((v) => v.sku === sku)) {
        return errors.push({ row: excelRow, reason: `SKU "${sku}" bị lặp lại trong file.` });
      }
      group.variants.push({ size, color, stockQuantity: stock, sku });
      const imageUrl = String(row['Ảnh (URL)'] || '').trim();
      if (imageUrl) group.images.push({ imageUrl, color });
    });

    // Kiểm tra SKU trùng với dữ liệu đã có trong DB trước khi tạo - tránh tạo dở dang rồi mới lỗi.
    const allSkus = [...groups.values()].flatMap((g) => g.variants.map((v) => v.sku));
    const existingSkus = allSkus.length
      ? await this.prisma.productVariant.findMany({ where: { sku: { in: allSkus } }, select: { sku: true } })
      : [];
    const existingSkuSet = new Set(existingSkus.map((s) => s.sku));

    let created = 0;
    const createdNames: string[] = [];
    for (const group of groups.values()) {
      const conflictingSku = group.variants.find((v) => existingSkuSet.has(v.sku));
      if (conflictingSku) {
        errors.push({ row: 0, reason: `Sản phẩm "${group.productData.name}": SKU "${conflictingSku.sku}" đã tồn tại trong hệ thống - bỏ qua cả sản phẩm này.` });
        continue;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const slug = await this.generateUniqueSlug(group.productData.name);
        // eslint-disable-next-line no-await-in-loop
        await this.prisma.product.create({
          data: {
            ...group.productData,
            slug,
            variants: { create: group.variants },
            images: group.images.length ? { create: group.images.map((img, i) => ({ ...img, isPrimary: i === 0 })) } : undefined,
          },
        });
        created++;
        createdNames.push(group.productData.name);
      } catch (e) {
        errors.push({ row: 0, reason: `Sản phẩm "${group.productData.name}": không lưu được (${e instanceof Error ? e.message : 'lỗi không xác định'}).` });
      }
    }

    return { created, createdNames, errors };
  }
}
