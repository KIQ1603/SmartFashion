import { PrismaClient, Role, InteractionType, Product, Category, OrderStatus, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---- helpers dùng chung cho phần sinh dữ liệu số lượng lớn (users/products/orders) ----
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59), 0);
  return d;
}
let skuCounter = 0;
function nextSku(prefix: string) {
  skuCounter += 1;
  return `${prefix}-${skuCounter}`;
}
function variantsFor(prefix: string, sizes: string[], colors: string[], baseStock = 10) {
  const out: { size: string; color: string; stockQuantity: number; sku: string }[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      out.push({ size, color, stockQuantity: baseStock + randInt(0, 25), sku: nextSku(prefix) });
    }
  }
  return out;
}
function imagesFor(seed: string, count = 3) {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}${i > 0 ? '-' + (i + 1) : ''}/600/800`);
}

async function main() {
  console.log('Seeding database...');

  // ==================== USERS ====================
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfashion.dev' },
    update: {},
    create: { email: 'admin@smartfashion.dev', passwordHash: adminPassword, fullName: 'Quản trị viên', role: Role.admin },
  });

  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const customerDefs = [
    { email: 'customer@smartfashion.dev', fullName: 'Nguyễn Văn A', gender: 'male' as const, birthYear: 1999 },
    { email: 'customer2@smartfashion.dev', fullName: 'Trần Thị Bình', gender: 'female' as const, birthYear: 2001 },
    // 8 tài khoản bổ sung - đủ 10 khách hàng để dữ liệu đơn hàng/doanh thu khi deploy demo trông
    // thật, không chỉ 1-2 tài khoản lặp đi lặp lại.
    { email: 'customer3@smartfashion.dev', fullName: 'Lê Minh Khôi', gender: 'male' as const, birthYear: 1995 },
    { email: 'customer4@smartfashion.dev', fullName: 'Phạm Thị Ngọc', gender: 'female' as const, birthYear: 1998 },
    { email: 'customer5@smartfashion.dev', fullName: 'Hoàng Văn Đức', gender: 'male' as const, birthYear: 2000 },
    { email: 'customer6@smartfashion.dev', fullName: 'Đặng Thị Lan', gender: 'female' as const, birthYear: 1997 },
    { email: 'customer7@smartfashion.dev', fullName: 'Vũ Minh Quân', gender: 'male' as const, birthYear: 2002 },
    { email: 'customer8@smartfashion.dev', fullName: 'Bùi Thị Hương', gender: 'female' as const, birthYear: 1996 },
    { email: 'customer9@smartfashion.dev', fullName: 'Ngô Văn Tùng', gender: 'male' as const, birthYear: 1994 },
    { email: 'customer10@smartfashion.dev', fullName: 'Đỗ Thị Mai', gender: 'female' as const, birthYear: 2003 },
  ];
  const customers: User[] = [];
  for (let i = 0; i < customerDefs.length; i++) {
    const c = customerDefs[i];
    // Rải ngày tạo tài khoản trong ~120 ngày qua (vài tài khoản mới trong 30 ngày gần nhất) để chỉ
    // số "Khách hàng mới (30 ngày)" ở dashboard admin không phải lúc nào cũng bằng 0.
    const createdAt = i < 2 ? undefined : daysAgo(randInt(1, 120));
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, passwordHash: customerPassword, fullName: c.fullName, gender: c.gender, birthYear: c.birthYear, ...(createdAt ? { createdAt } : {}) },
    });
    customers.push(user);
  }
  const [customer, customer2] = customers;

  // ==================== ĐỊA CHỈ (mỗi khách 1 địa chỉ mặc định) ====================
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const streetNames = ['Nguyễn Trãi', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Nguyễn Huệ', 'Điện Biên Phủ', 'Hoàng Diệu', 'Lý Thường Kiệt'];
  const addressByUser = new Map<string, string>();
  for (const u of customers) {
    const existing = await prisma.address.findFirst({ where: { userId: u.id } });
    if (existing) {
      addressByUser.set(u.id, existing.id);
      continue;
    }
    const addr = await prisma.address.create({
      data: {
        userId: u.id,
        recipient: u.fullName,
        phone: `09${randInt(10000000, 99999999)}`,
        line: `${randInt(1, 300)} ${pick(streetNames)}`,
        city: pick(cities),
        isDefault: true,
      },
    });
    addressByUser.set(u.id, addr.id);
  }

  // ==================== CATEGORIES ====================
  const categoryDefs: { name: string; slug: string; parent?: string }[] = [
    { name: 'Áo', slug: 'ao' },
    { name: 'Áo thun', slug: 'ao-thun', parent: 'ao' },
    { name: 'Áo sơ mi', slug: 'ao-so-mi', parent: 'ao' },
    { name: 'Áo khoác', slug: 'ao-khoac', parent: 'ao' },
    { name: 'Áo len', slug: 'ao-len', parent: 'ao' },
    { name: 'Quần', slug: 'quan' },
    { name: 'Quần jean', slug: 'quan-jean', parent: 'quan' },
    { name: 'Quần tây', slug: 'quan-tay', parent: 'quan' },
    { name: 'Quần short', slug: 'quan-short', parent: 'quan' },
    { name: 'Đầm & Chân váy', slug: 'dam-chan-vay' },
    { name: 'Đầm', slug: 'dam', parent: 'dam-chan-vay' },
    { name: 'Chân váy', slug: 'chan-vay', parent: 'dam-chan-vay' },
    { name: 'Đồ thể thao', slug: 'do-the-thao' },
    { name: 'Phụ kiện', slug: 'phu-kien' },
  ];
  const categoryMap = new Map<string, Category>();
  for (const c of categoryDefs) {
    const parentId = c.parent ? categoryMap.get(c.parent)!.id : undefined;
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { name: c.name, slug: c.slug, parentId } });
    categoryMap.set(c.slug, cat);
  }

  // ==================== PRODUCTS ====================
  const SIZES_TOP = ['S', 'M', 'L', 'XL'];
  const SIZES_JEAN = ['28', '29', '30', '31', '32'];
  const SIZES_FREE = ['Free size'];
  const BRANDS = ['SmartFashion', 'UrbanWear', 'DenimCo', 'LinenLab', 'Aurora Basics', 'Metro Style', 'WoolCraft'];

  interface ProductSeed {
    name: string;
    slug: string;
    description: string;
    categorySlug: string;
    brand: string;
    basePrice: number;
    compareAtPrice?: number;
    material: string;
    styleTags: string[];
    season: string;
    variants: { size: string; color: string; stockQuantity: number; sku: string }[];
    images: string[];
  }

  // 5 sản phẩm gốc giữ nguyên (đã dùng trong dữ liệu tương tác/review mẫu bên dưới) + 44 sản phẩm
  // mới trải khắp các danh mục - tổng ~49 sản phẩm, đủ "khoảng 50" để demo/deploy không trông trống.
  const productsData: ProductSeed[] = [
    {
      name: 'Áo thun basic cotton trắng',
      slug: 'ao-thun-basic-cotton-trang',
      description: 'Áo thun cotton form rộng, phong cách basic, dễ phối đồ.',
      categorySlug: 'ao-thun',
      brand: 'SmartFashion',
      basePrice: 199000,
      material: 'cotton',
      styleTags: ['basic', 'unisex'],
      season: 'all-season',
      variants: [
        { size: 'M', color: 'trắng', stockQuantity: 50, sku: 'AT-TRANG-M' },
        { size: 'L', color: 'trắng', stockQuantity: 40, sku: 'AT-TRANG-L' },
      ],
      images: ['https://picsum.photos/seed/ao-thun-trang/600/800', 'https://picsum.photos/seed/ao-thun-trang-2/600/800', 'https://picsum.photos/seed/ao-thun-trang-3/600/800'],
    },
    {
      name: 'Áo thun streetwear đen',
      slug: 'ao-thun-streetwear-den',
      description: 'Áo thun form rộng phong cách streetwear, chất liệu cotton dày dặn.',
      categorySlug: 'ao-thun',
      brand: 'UrbanWear',
      basePrice: 259000,
      compareAtPrice: 349000,
      material: 'cotton',
      styleTags: ['streetwear', 'oversize'],
      season: 'all-season',
      variants: [
        { size: 'M', color: 'đen', stockQuantity: 30, sku: 'AT-DEN-M' },
        { size: 'L', color: 'đen', stockQuantity: 25, sku: 'AT-DEN-L' },
      ],
      images: ['https://picsum.photos/seed/ao-thun-den/600/800', 'https://picsum.photos/seed/ao-thun-den-2/600/800', 'https://picsum.photos/seed/ao-thun-den-3/600/800'],
    },
    {
      name: 'Áo sơ mi công sở trắng',
      slug: 'ao-so-mi-cong-so-trang',
      description: 'Áo sơ mi form ôm, chất liệu kate lụa, phù hợp môi trường công sở.',
      categorySlug: 'ao-so-mi',
      brand: 'SmartFashion',
      basePrice: 329000,
      material: 'kate lụa',
      styleTags: ['office', 'formal'],
      season: 'all-season',
      variants: [
        { size: 'M', color: 'trắng', stockQuantity: 20, sku: 'ASM-TRANG-M' },
        { size: 'L', color: 'trắng', stockQuantity: 20, sku: 'ASM-TRANG-L' },
      ],
      images: ['https://picsum.photos/seed/ao-so-mi/600/800', 'https://picsum.photos/seed/ao-so-mi-2/600/800', 'https://picsum.photos/seed/ao-so-mi-3/600/800'],
    },
    {
      name: 'Quần jean slimfit xanh đậm',
      slug: 'quan-jean-slimfit-xanh-dam',
      description: 'Quần jean slimfit, chất liệu denim co giãn nhẹ, dễ phối cùng áo sơ mi/áo thun.',
      categorySlug: 'quan-jean',
      brand: 'DenimCo',
      basePrice: 399000,
      material: 'denim',
      styleTags: ['slimfit', 'basic'],
      season: 'all-season',
      variants: [
        { size: '29', color: 'xanh đậm', stockQuantity: 15, sku: 'QJ-XANHDAM-29' },
        { size: '30', color: 'xanh đậm', stockQuantity: 25, sku: 'QJ-XANHDAM-30' },
        { size: '31', color: 'xanh đậm', stockQuantity: 20, sku: 'QJ-XANHDAM-31' },
      ],
      images: ['https://picsum.photos/seed/quan-jean-xanh/600/800', 'https://picsum.photos/seed/quan-jean-xanh-2/600/800', 'https://picsum.photos/seed/quan-jean-xanh-3/600/800'],
    },
    {
      name: 'Quần jean rách gối form rộng',
      slug: 'quan-jean-rach-goi-form-rong',
      description: 'Quần jean rách gối phong cách streetwear, form rộng, chất liệu denim dày.',
      categorySlug: 'quan-jean',
      brand: 'UrbanWear',
      basePrice: 429000,
      compareAtPrice: 549000,
      material: 'denim',
      styleTags: ['streetwear', 'oversize'],
      season: 'all-season',
      variants: [
        { size: '29', color: 'xanh nhạt', stockQuantity: 10, sku: 'QJ-RACH-29' },
        { size: '30', color: 'xanh nhạt', stockQuantity: 18, sku: 'QJ-RACH-30' },
      ],
      images: ['https://picsum.photos/seed/quan-jean-rach/600/800', 'https://picsum.photos/seed/quan-jean-rach-2/600/800', 'https://picsum.photos/seed/quan-jean-rach-3/600/800'],
    },
  ];

  // ---- 44 sản phẩm mới, sinh biến thể/ảnh qua helper để đỡ lặp code ----
  interface NewProductDef {
    name: string;
    categorySlug: string;
    brand: string;
    basePrice: number;
    discount?: boolean;
    material: string;
    styleTags: string[];
    sizes: string[];
    colors: string[];
  }
  const newProductDefs: NewProductDef[] = [
    // Áo thun (+4)
    { name: 'Áo thun cổ tròn basic đen', categorySlug: 'ao-thun', brand: 'SmartFashion', basePrice: 189000, material: 'cotton', styleTags: ['basic'], sizes: SIZES_TOP, colors: ['đen', 'xám'] },
    { name: 'Áo polo nam kẻ sọc navy', categorySlug: 'ao-thun', brand: 'Metro Style', basePrice: 279000, material: 'cotton pique', styleTags: ['office casual'], sizes: SIZES_TOP, colors: ['navy'] },
    { name: 'Áo thun croptop nữ form ngắn', categorySlug: 'ao-thun', brand: 'Aurora Basics', basePrice: 169000, discount: true, material: 'cotton', styleTags: ['trẻ trung'], sizes: ['S', 'M', 'L'], colors: ['trắng', 'hồng pastel'] },
    { name: 'Áo thun graphic in hình vintage', categorySlug: 'ao-thun', brand: 'UrbanWear', basePrice: 229000, material: 'cotton', styleTags: ['streetwear'], sizes: SIZES_TOP, colors: ['trắng kem', 'đen'] },
    // Áo sơ mi (+4)
    { name: 'Áo sơ mi caro flannel unisex', categorySlug: 'ao-so-mi', brand: 'UrbanWear', basePrice: 299000, material: 'flannel', styleTags: ['casual'], sizes: SIZES_TOP, colors: ['đỏ đen', 'xanh rêu'] },
    { name: 'Áo sơ mi lụa satin nữ', categorySlug: 'ao-so-mi', brand: 'Aurora Basics', basePrice: 349000, discount: true, material: 'lụa satin', styleTags: ['sang trọng'], sizes: ['S', 'M', 'L'], colors: ['kem', 'đen'] },
    { name: 'Áo sơ mi denim form suông', categorySlug: 'ao-so-mi', brand: 'DenimCo', basePrice: 319000, material: 'denim mềm', styleTags: ['casual'], sizes: SIZES_TOP, colors: ['xanh nhạt'] },
    { name: 'Áo sơ mi linen tay ngắn nam', categorySlug: 'ao-so-mi', brand: 'LinenLab', basePrice: 289000, material: 'linen', styleTags: ['mùa hè'], sizes: SIZES_TOP, colors: ['be', 'trắng'] },
    // Áo khoác (+5)
    { name: 'Áo khoác dạ nữ dáng dài', categorySlug: 'ao-khoac', brand: 'Aurora Basics', basePrice: 890000, discount: true, material: 'dạ', styleTags: ['thu đông'], sizes: ['S', 'M', 'L'], colors: ['be', 'đen'] },
    { name: 'Áo khoác bomber unisex', categorySlug: 'ao-khoac', brand: 'UrbanWear', basePrice: 459000, material: 'polyester', styleTags: ['streetwear'], sizes: SIZES_TOP, colors: ['đen', 'xanh rêu'] },
    { name: 'Áo khoác blazer công sở nữ', categorySlug: 'ao-khoac', brand: 'Metro Style', basePrice: 650000, material: 'polyester pha', styleTags: ['office'], sizes: ['S', 'M', 'L'], colors: ['xám', 'đen'] },
    { name: 'Áo khoác gió chống nước', categorySlug: 'ao-khoac', brand: 'SmartFashion', basePrice: 399000, material: 'polyester phủ PU', styleTags: ['thể thao'], sizes: SIZES_TOP, colors: ['navy', 'đen'] },
    { name: 'Áo khoác denim wash nhẹ', categorySlug: 'ao-khoac', brand: 'DenimCo', basePrice: 469000, material: 'denim', styleTags: ['casual'], sizes: SIZES_TOP, colors: ['xanh nhạt'] },
    // Áo len (+4)
    { name: 'Áo len cổ lọ basic', categorySlug: 'ao-len', brand: 'WoolCraft', basePrice: 349000, material: 'len', styleTags: ['thu đông'], sizes: SIZES_TOP, colors: ['be', 'nâu', 'đen'] },
    { name: 'Áo len cardigan cúc gỗ', categorySlug: 'ao-len', brand: 'WoolCraft', basePrice: 389000, discount: true, material: 'len pha', styleTags: ['vintage'], sizes: ['S', 'M', 'L'], colors: ['kem'] },
    { name: 'Áo len họa tiết Fair Isle', categorySlug: 'ao-len', brand: 'Metro Style', basePrice: 429000, material: 'len', styleTags: ['giáng sinh'], sizes: SIZES_TOP, colors: ['đỏ đô', 'xanh navy'] },
    { name: 'Áo len oversize cổ tròn', categorySlug: 'ao-len', brand: 'Aurora Basics', basePrice: 359000, material: 'len mỏng', styleTags: ['oversize'], sizes: SIZES_TOP, colors: ['tím than', 'xám'] },
    // Quần jean (+4)
    { name: 'Quần jean ống suông xanh nhạt', categorySlug: 'quan-jean', brand: 'DenimCo', basePrice: 379000, material: 'denim', styleTags: ['basic'], sizes: SIZES_JEAN, colors: ['xanh nhạt'] },
    { name: 'Quần jean baggy phong cách retro', categorySlug: 'quan-jean', brand: 'UrbanWear', basePrice: 459000, discount: true, material: 'denim dày', styleTags: ['retro', 'oversize'], sizes: SIZES_JEAN, colors: ['xanh đậm'] },
    { name: 'Quần jean skinny đen', categorySlug: 'quan-jean', brand: 'DenimCo', basePrice: 389000, material: 'denim co giãn', styleTags: ['skinny'], sizes: SIZES_JEAN, colors: ['đen'] },
    { name: 'Quần jean lửng nữ', categorySlug: 'quan-jean', brand: 'Aurora Basics', basePrice: 329000, material: 'denim', styleTags: ['mùa hè'], sizes: ['S', 'M', 'L'], colors: ['xanh nhạt'] },
    // Quần tây (+4)
    { name: 'Quần tây âu ống đứng', categorySlug: 'quan-tay', brand: 'Metro Style', basePrice: 429000, material: 'kaki pha', styleTags: ['office'], sizes: SIZES_JEAN, colors: ['đen', 'xám'] },
    { name: 'Quần tây nữ cạp cao', categorySlug: 'quan-tay', brand: 'Metro Style', basePrice: 399000, discount: true, material: 'polyester', styleTags: ['office'], sizes: ['S', 'M', 'L'], colors: ['đen', 'be'] },
    { name: 'Quần culottes công sở', categorySlug: 'quan-tay', brand: 'Aurora Basics', basePrice: 359000, material: 'linen pha', styleTags: ['thanh lịch'], sizes: ['S', 'M', 'L'], colors: ['xám', 'be'] },
    { name: 'Quần tây kẻ sọc', categorySlug: 'quan-tay', brand: 'SmartFashion', basePrice: 419000, material: 'kaki', styleTags: ['office'], sizes: SIZES_JEAN, colors: ['xanh navy'] },
    // Quần short (+3)
    { name: 'Quần short kaki nam', categorySlug: 'quan-short', brand: 'SmartFashion', basePrice: 219000, material: 'kaki', styleTags: ['mùa hè'], sizes: SIZES_TOP, colors: ['be', 'xanh rêu'] },
    { name: 'Quần short jean rách gối', categorySlug: 'quan-short', brand: 'UrbanWear', basePrice: 249000, discount: true, material: 'denim', styleTags: ['streetwear'], sizes: SIZES_JEAN, colors: ['xanh nhạt'] },
    { name: 'Quần short thể thao 2 lớp', categorySlug: 'quan-short', brand: 'SmartFashion', basePrice: 189000, material: 'polyester', styleTags: ['thể thao'], sizes: SIZES_TOP, colors: ['đen', 'xám'] },
    // Đầm (+5)
    { name: 'Đầm maxi hoa nhí', categorySlug: 'dam', brand: 'Aurora Basics', basePrice: 459000, material: 'voan', styleTags: ['dạo phố'], sizes: ['S', 'M', 'L'], colors: ['hoa nhí vàng', 'hoa nhí xanh'] },
    { name: 'Đầm babydoll tay bồng', categorySlug: 'dam', brand: 'Aurora Basics', basePrice: 389000, discount: true, material: 'cotton lụa', styleTags: ['trẻ trung'], sizes: ['S', 'M', 'L'], colors: ['trắng', 'hồng pastel'] },
    { name: 'Đầm len ôm dáng', categorySlug: 'dam', brand: 'WoolCraft', basePrice: 429000, material: 'len', styleTags: ['thu đông'], sizes: ['S', 'M', 'L'], colors: ['nâu', 'đen'] },
    { name: 'Đầm công sở tay dài', categorySlug: 'dam', brand: 'Metro Style', basePrice: 499000, material: 'polyester cao cấp', styleTags: ['office'], sizes: ['S', 'M', 'L'], colors: ['đen', 'xanh navy'] },
    { name: 'Đầm suông linen be', categorySlug: 'dam', brand: 'LinenLab', basePrice: 419000, material: 'linen', styleTags: ['tối giản'], sizes: ['S', 'M', 'L'], colors: ['be'] },
    // Chân váy (+3)
    { name: 'Chân váy xếp ly midi', categorySlug: 'chan-vay', brand: 'Aurora Basics', basePrice: 289000, discount: true, material: 'polyester', styleTags: ['nữ tính'], sizes: ['S', 'M', 'L'], colors: ['đen', 'be'] },
    { name: 'Chân váy denim ngắn', categorySlug: 'chan-vay', brand: 'DenimCo', basePrice: 259000, material: 'denim', styleTags: ['casual'], sizes: ['S', 'M', 'L'], colors: ['xanh nhạt'] },
    { name: 'Chân váy bút chì công sở', categorySlug: 'chan-vay', brand: 'Metro Style', basePrice: 329000, material: 'polyester pha', styleTags: ['office'], sizes: ['S', 'M', 'L'], colors: ['đen', 'xám'] },
    // Đồ thể thao (+4)
    { name: 'Áo tank top gym nữ', categorySlug: 'do-the-thao', brand: 'SmartFashion', basePrice: 159000, material: 'thun co giãn', styleTags: ['gym'], sizes: ['S', 'M', 'L'], colors: ['đen', 'hồng'] },
    { name: 'Quần legging thể thao', categorySlug: 'do-the-thao', brand: 'SmartFashion', basePrice: 229000, discount: true, material: 'spandex', styleTags: ['gym', 'yoga'], sizes: ['S', 'M', 'L'], colors: ['đen', 'xám'] },
    { name: 'Áo khoác gió tập chạy', categorySlug: 'do-the-thao', brand: 'Metro Style', basePrice: 349000, material: 'polyester nhẹ', styleTags: ['chạy bộ'], sizes: SIZES_TOP, colors: ['xanh navy', 'đen'] },
    { name: 'Bộ đồ thể thao unisex', categorySlug: 'do-the-thao', brand: 'SmartFashion', basePrice: 399000, material: 'thun nỉ', styleTags: ['gym'], sizes: SIZES_TOP, colors: ['xám', 'đen'] },
    // Phụ kiện (+4)
    { name: 'Thắt lưng da nam', categorySlug: 'phu-kien', brand: 'Metro Style', basePrice: 249000, material: 'da PU', styleTags: ['công sở'], sizes: SIZES_FREE, colors: ['đen', 'nâu'] },
    { name: 'Mũ lưỡi trai basic', categorySlug: 'phu-kien', brand: 'UrbanWear', basePrice: 129000, material: 'cotton', styleTags: ['streetwear'], sizes: SIZES_FREE, colors: ['đen', 'trắng', 'be'] },
    { name: 'Khăn choàng len', categorySlug: 'phu-kien', brand: 'WoolCraft', basePrice: 179000, discount: true, material: 'len', styleTags: ['thu đông'], sizes: SIZES_FREE, colors: ['xám', 'đỏ đô'] },
    { name: 'Túi tote vải canvas', categorySlug: 'phu-kien', brand: 'SmartFashion', basePrice: 149000, material: 'canvas', styleTags: ['tối giản'], sizes: SIZES_FREE, colors: ['be', 'đen'] },
  ];

  function toSlug(name: string) {
    return name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  for (const d of newProductDefs) {
    const slug = toSlug(d.name);
    productsData.push({
      name: d.name,
      slug,
      description: `${d.name} - chất liệu ${d.material}, thương hiệu ${d.brand}.`,
      categorySlug: d.categorySlug,
      brand: d.brand,
      basePrice: d.basePrice,
      compareAtPrice: d.discount ? Math.round((d.basePrice * randInt(120, 145)) / 100 / 1000) * 1000 : undefined,
      material: d.material,
      styleTags: d.styleTags,
      season: 'all-season',
      variants: variantsFor(slug.toUpperCase().slice(0, 6), d.sizes, d.colors),
      images: imagesFor(slug),
    });
  }

  const createdProducts: Product[] = [];
  for (const p of productsData) {
    const { variants, images, categorySlug, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...rest,
        categoryId: categoryMap.get(categorySlug)!.id,
        variants: { create: variants },
        images: { create: images.map((url, idx) => ({ imageUrl: url, isPrimary: idx === 0 })) },
      },
      include: { variants: true },
    });
    createdProducts.push(product);
  }
  console.log(`Đã có ${createdProducts.length} sản phẩm.`);

  // ==================== ATTRIBUTE OPTIONS (cho form thêm/sửa sản phẩm ở admin) ====================
  const attributeOptions: { type: string; value: string }[] = [
    ...BRANDS.map((b) => ({ type: 'brand', value: b })),
    { type: 'material', value: 'cotton' },
    { type: 'material', value: 'denim' },
    { type: 'material', value: 'kate lụa' },
    { type: 'material', value: 'len' },
    { type: 'material', value: 'da' },
    { type: 'material', value: 'lụa satin' },
    { type: 'material', value: 'linen' },
    { type: 'material', value: 'flannel' },
    { type: 'material', value: 'voan' },
    { type: 'material', value: 'kaki' },
    { type: 'material', value: 'polyester' },
    { type: 'season', value: 'all-season' },
    { type: 'season', value: 'xuân hè' },
    { type: 'season', value: 'thu đông' },
  ];
  for (const opt of attributeOptions) {
    await prisma.attributeOption.upsert({ where: { type_value: { type: opt.type, value: opt.value } }, update: {}, create: opt });
  }

  // ==================== SAMPLE INTERACTIONS (Recommendation Service demo) ====================
  const scoreMap: Record<string, number> = { view: 1, wishlist: 2, add_to_cart: 3, remove_from_cart: -1, purchase: 5, return: -3 };
  const sampleEvents: { type: InteractionType; productIndex: number }[] = [
    { type: 'view', productIndex: 0 },
    { type: 'view', productIndex: 1 },
    { type: 'add_to_cart', productIndex: 1 },
    { type: 'purchase', productIndex: 1 },
    { type: 'view', productIndex: 3 },
    { type: 'purchase', productIndex: 3 },
  ];
  const existingInteractions = await prisma.userInteraction.count({ where: { userId: customer.id } });
  if (existingInteractions === 0) {
    for (const ev of sampleEvents) {
      await prisma.userInteraction.create({
        data: { userId: customer.id, productId: createdProducts[ev.productIndex].id, interactionType: ev.type, implicitScore: scoreMap[ev.type] },
      });
    }
  }

  // Thêm lượt "view" ngẫu nhiên rải qua nhiều khách + nhiều sản phẩm - Recommendation Service cần
  // đủ tín hiệu tương tác để mô hình Collaborative Filtering hoạt động có ý nghĩa, không chỉ 1-2 event.
  const existingBulkInteractions = await prisma.userInteraction.count();
  if (existingBulkInteractions < 100) {
    const interactionTypes: InteractionType[] = ['view', 'view', 'view', 'wishlist', 'add_to_cart'];
    const bulkInteractions: { userId: string; productId: string; interactionType: InteractionType; implicitScore: number; createdAt: Date }[] = [];
    for (let i = 0; i < 150; i++) {
      bulkInteractions.push({
        userId: pick(customers).id,
        productId: pick(createdProducts).id,
        interactionType: pick(interactionTypes),
        implicitScore: scoreMap[pick(interactionTypes)],
        createdAt: daysAgo(randInt(0, 60)),
      });
    }
    await prisma.userInteraction.createMany({ data: bulkInteractions });
  }

  // ==================== SAMPLE REVIEWS (2 review gốc giữ nguyên) ====================
  const sampleReviews = [
    { productIndex: 0, userId: customer.id, rating: 5, comment: 'Vải mềm, form rộng vừa phải, mặc mát. Giặt vài lần chưa thấy giãn cổ.' },
    { productIndex: 0, userId: customer2.id, rating: 4, comment: 'Áo ổn, đúng size trên bảng size. Màu trắng hơi ngả kem chứ không trắng tinh như ảnh.' },
    { productIndex: 1, userId: customer2.id, rating: 5, comment: 'Chất cotton dày dặn, đường may chắc chắn. Mua size L cho form oversize là chuẩn.' },
    { productIndex: 3, userId: customer.id, rating: 4, comment: 'Jean co giãn nhẹ dễ chịu, lên form đẹp. Giao hàng hơi lâu 1 ngày so với dự kiến.' },
    { productIndex: 3, userId: customer2.id, rating: 5, comment: 'Quần đẹp, chất denim không quá cứng. Sẽ mua thêm màu khác.' },
    { productIndex: 4, userId: customer.id, rating: 3, comment: 'Form rộng đúng mô tả nhưng phần rách gối hơi nhiều so với ảnh, cần cân nhắc trước khi mua.' },
  ];
  const existingReviews = await prisma.review.count();
  if (existingReviews === 0) {
    for (const r of sampleReviews) {
      await prisma.review.create({ data: { userId: r.userId, productId: createdProducts[r.productIndex].id, rating: r.rating, comment: r.comment } });
    }
  }

  // ==================== ĐƠN HÀNG (số lượng lớn, trải nhiều trạng thái/ngày) ====================
  // Ngưỡng 60 để không sinh trùng lặp mỗi lần container restart (docker-entrypoint chạy lại
  // `prisma db seed`), nhưng vẫn chạy được ở lần đầu dù DB đã có sẵn vài chục đơn test thủ công.
  const existingOrderCount = await prisma.order.count();
  if (existingOrderCount < 60) {
    // Phân bố trạng thái có trọng số - phần lớn "đã giao" (shop vận hành ổn định), 1 phần nhỏ hủy.
    const STATUS_POOL: OrderStatus[] = [
      ...Array(4).fill('pending'),
      ...Array(6).fill('confirmed'),
      ...Array(4).fill('packed'),
      ...Array(6).fill('shipping'),
      ...Array(18).fill('delivered'),
      ...Array(4).fill('cancelled'),
    ];
    const CANCEL_REASONS = ['Đổi ý không muốn mua nữa', 'Tìm được giá tốt hơn ở nơi khác', 'Đặt nhầm sản phẩm/size', 'Giao hàng chậm hơn dự kiến so với nhu cầu'];
    const REVIEW_COMMENTS_POSITIVE = [
      'Chất lượng tốt, đúng như mô tả, sẽ ủng hộ shop tiếp.',
      'Giao hàng nhanh, đóng gói cẩn thận, sản phẩm đẹp.',
      'Form chuẩn, chất vải ổn so với giá tiền.',
      'Rất hài lòng, sẽ giới thiệu cho bạn bè.',
    ];
    const REVIEW_COMMENTS_MIXED = [
      'Sản phẩm ổn nhưng giao hơi chậm.',
      'Chất liệu tạm được, màu thực tế hơi khác ảnh 1 chút.',
      'Đúng size nhưng đường may chưa thật sự sắc sảo.',
    ];

    const reviewedPairs = new Set<string>(); // `${userId}:${productId}` - né vi phạm unique constraint

    let ordersCreated = 0;
    for (let i = 0; i < 95; i++) {
      const buyer = pick(customers);
      const status = pick(STATUS_POOL);
      const itemCount = randInt(1, 3);
      const chosenProducts = new Set<string>();
      const items: { variantId: string; quantity: number; price: number }[] = [];
      while (chosenProducts.size < itemCount) {
        const product = pick(createdProducts) as Product & { variants: { id: string }[] };
        if (chosenProducts.has(product.id) || !product.variants?.length) continue;
        chosenProducts.add(product.id);
        const variant = pick(product.variants);
        const quantity = randInt(1, 2);
        items.push({ variantId: variant.id, quantity, price: Number(product.basePrice) });
      }
      const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const createdAt = daysAgo(randInt(0, 45));

      const order = await prisma.order.create({
        data: {
          userId: buyer.id,
          addressId: addressByUser.get(buyer.id),
          status,
          totalAmount,
          paymentMethod: pick(['cod', 'cod', 'bank_transfer']),
          cancelReason: status === 'cancelled' ? pick(CANCEL_REASONS) : undefined,
          createdAt,
          items: { create: items },
        },
        include: { items: true },
      });
      ordersCreated++;

      // Đơn "đã giao" thì ~55% khả năng có review thật cho sản phẩm trong đơn (tôn trọng ràng buộc
      // unique 1 khách/1 sản phẩm/1 đánh giá vừa thêm - không tạo trùng).
      if (status === 'delivered' && Math.random() < 0.55) {
        for (const productId of chosenProducts) {
          const key = `${buyer.id}:${productId}`;
          if (reviewedPairs.has(key)) continue;
          const existingReview = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: buyer.id } } });
          if (existingReview) {
            reviewedPairs.add(key);
            continue;
          }
          reviewedPairs.add(key);
          const rating = pick([5, 5, 4, 4, 4, 3]);
          const comment = rating >= 4 ? pick(REVIEW_COMMENTS_POSITIVE) : pick(REVIEW_COMMENTS_MIXED);
          await prisma.review.create({ data: { userId: buyer.id, productId, rating, comment } }).catch(() => {});
        }
      }
    }
    console.log(`Đã tạo ${ordersCreated} đơn hàng mẫu.`);
  }

  console.log('Seed hoàn tất.');
  console.log('Admin login: admin@smartfashion.dev / Admin@123');
  console.log('Customer login: customer@smartfashion.dev / Customer@123 (customer2..customer10 cùng mật khẩu)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
