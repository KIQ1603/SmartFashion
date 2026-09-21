import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';

const IMPORT_COLUMNS = [
  'Mã',
  'Loại (percentage/fixed)',
  'Giá trị',
  'Đơn tối thiểu',
  'Giảm tối đa',
  'Số lượt dùng tối đa',
  'Ngày bắt đầu',
  'Ngày hết hạn',
  'Mô tả',
];

const IMPORT_GUIDE: [string, string, string][] = [
  ['Mã', 'Có', 'Không phân biệt hoa/thường, tự động viết hoa. Không được trùng mã đã có.'],
  ['Loại (percentage/fixed)', 'Có', '"percentage" = giảm theo %, "fixed" = giảm số tiền cố định'],
  ['Giá trị', 'Có', 'percentage: nhập số % (vd 10 = giảm 10%). fixed: nhập số tiền VNĐ'],
  ['Đơn tối thiểu', 'Không', 'Đơn hàng phải đạt số tiền này mới áp mã được. Để trống = không giới hạn'],
  ['Giảm tối đa', 'Không', 'Chỉ áp dụng cho loại percentage - chặn trần số tiền giảm. Để trống = không giới hạn'],
  ['Số lượt dùng tối đa', 'Không', 'Tổng số lần mã được dùng trên toàn hệ thống. Để trống = không giới hạn'],
  ['Ngày bắt đầu', 'Không', 'Định dạng YYYY-MM-DD. Để trống = có hiệu lực ngay'],
  ['Ngày hết hạn', 'Không', 'Định dạng YYYY-MM-DD. Để trống = không hết hạn'],
  ['Mô tả', 'Không', 'Ghi chú nội bộ, khách không nhìn thấy'],
];

interface DiscountCodeInput {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  description?: string | null;
}

@Injectable()
export class DiscountCodesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(input: DiscountCodeInput) {
    const code = this.normalizeCode(input.code);
    this.assertValidInput(input);
    const existing = await this.prisma.discountCode.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Mã "${code}" đã tồn tại.`);
    return this.prisma.discountCode.create({
      data: {
        code,
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        maxUses: input.maxUses ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: input.isActive ?? true,
        description: input.description ?? null,
      },
    });
  }

  async update(id: string, input: Partial<DiscountCodeInput>) {
    const existing = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy mã giảm giá.');

    const data: Record<string, unknown> = {};
    if (input.code !== undefined) {
      const code = this.normalizeCode(input.code);
      if (code !== existing.code) {
        const dup = await this.prisma.discountCode.findUnique({ where: { code } });
        if (dup) throw new ConflictException(`Mã "${code}" đã tồn tại.`);
      }
      data.code = code;
    }
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = input.value;
    if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount;
    if (input.maxDiscountAmount !== undefined) data.maxDiscountAmount = input.maxDiscountAmount;
    if (input.maxUses !== undefined) data.maxUses = input.maxUses;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.description !== undefined) data.description = input.description;

    this.assertValidInput({ ...existing, ...input, code: (data.code as string) ?? existing.code } as DiscountCodeInput);
    return this.prisma.discountCode.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy mã giảm giá.');
    await this.prisma.discountCode.delete({ where: { id } });
    return { success: true };
  }

  private normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  private assertValidInput(input: Pick<DiscountCodeInput, 'code' | 'type' | 'value'>) {
    if (!input.code || input.code.length < 3) throw new BadRequestException('Mã giảm giá phải có ít nhất 3 ký tự.');
    if (input.type !== 'percentage' && input.type !== 'fixed') {
      throw new BadRequestException('Loại mã giảm giá phải là "percentage" hoặc "fixed".');
    }
    if (!input.value || input.value <= 0) throw new BadRequestException('Giá trị giảm giá phải lớn hơn 0.');
    if (input.type === 'percentage' && input.value > 100) {
      throw new BadRequestException('Giảm theo % không được vượt quá 100.');
    }
  }

  /**
   * Kiểm tra + tính số tiền giảm thật - dùng chung cho cả bước xem trước ở giỏ hàng (validate,
   * KHÔNG tăng lượt dùng) lẫn lúc đặt hàng thật (checkout, có tăng lượt dùng trong applyUsage).
   * Luôn kiểm tra lại từ đầu (không tin dữ liệu client gửi lên) - mã có thể đã hết hạn/hết lượt
   * ngay giữa lúc khách xem giỏ hàng và lúc bấm đặt hàng.
   */
  async validate(
    rawCode: string,
    subtotal: number,
    client: any = this.prisma,
  ): Promise<{ discountCode: string; discountAmount: number }> {
    const code = this.normalizeCode(rawCode);
    if (!code) throw new BadRequestException('Vui lòng nhập mã giảm giá.');

    // Nhận "client" tuỳ chọn (mặc định this.prisma) - lúc gọi từ trong transaction đặt hàng thật
    // (orders.service.ts) sẽ truyền "tx" vào đây thay vì dùng kết nối ngoài transaction, để đọc
    // đúng usedCount mới nhất trong cùng transaction, giảm khoảng hở race-condition khi 2 đơn cùng
    // dùng 1 mã gần hết lượt cùng lúc.
    const discount = await client.discountCode.findUnique({ where: { code } });
    if (!discount) throw new BadRequestException('Mã giảm giá không tồn tại.');
    if (!discount.isActive) throw new BadRequestException('Mã giảm giá này đã bị vô hiệu hoá.');

    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) throw new BadRequestException('Mã giảm giá chưa tới thời gian áp dụng.');
    if (discount.expiresAt && now > discount.expiresAt) throw new BadRequestException('Mã giảm giá đã hết hạn.');
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    }
    if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) {
      throw new BadRequestException(`Đơn hàng cần tối thiểu ${Number(discount.minOrderAmount).toLocaleString('vi-VN')}đ để áp mã này.`);
    }

    let discountAmount =
      discount.type === 'percentage' ? (subtotal * Number(discount.value)) / 100 : Number(discount.value);
    if (discount.type === 'percentage' && discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, Number(discount.maxDiscountAmount));
    }
    // Không bao giờ giảm nhiều hơn chính giá trị đơn hàng (mã fixed lớn hơn subtotal thì chỉ giảm
    // vừa đủ về 0, không tạo ra số âm).
    discountAmount = Math.min(discountAmount, subtotal);

    return { discountCode: code, discountAmount: Math.round(discountAmount) };
  }

  /** Tăng lượt dùng thật - gọi trong transaction lúc tạo đơn hàng thành công (orders.service.ts),
   * không gọi ở bước validate/xem trước để tránh trừ lượt dùng của mã chỉ vì khách xem thử. */
  applyUsage(code: string, tx: any) {
    return tx.discountCode.update({ where: { code }, data: { usedCount: { increment: 1 } } });
  }

  generateImportTemplate(): Buffer {
    const sample = [
      {
        'Mã': 'CHAOMUNG10',
        'Loại (percentage/fixed)': 'percentage',
        'Giá trị': 10,
        'Đơn tối thiểu': 200000,
        'Giảm tối đa': 50000,
        'Số lượt dùng tối đa': 100,
        'Ngày bắt đầu': '',
        'Ngày hết hạn': '2026-12-31',
        'Mô tả': 'Ưu đãi khách hàng mới',
      },
      {
        'Mã': 'FREESHIP',
        'Loại (percentage/fixed)': 'fixed',
        'Giá trị': 30000,
        'Đơn tối thiểu': '',
        'Giảm tối đa': '',
        'Số lượt dùng tối đa': '',
        'Ngày bắt đầu': '',
        'Ngày hết hạn': '',
        'Mô tả': '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: IMPORT_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mã giảm giá');
    const guideWs = XLSX.utils.aoa_to_sheet([['Cột', 'Bắt buộc?', 'Ghi chú'], ...IMPORT_GUIDE]);
    XLSX.utils.book_append_sheet(wb, guideWs, 'Hướng dẫn');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      throw new ConflictException('File không có dữ liệu (hoặc thiếu dòng tiêu đề đúng tên cột).');
    }

    const existingCodes = new Set((await this.prisma.discountCode.findMany({ select: { code: true } })).map((d) => d.code));
    const errors: { row: number; reason: string }[] = [];
    const toCreate: DiscountCodeInput[] = [];
    const seenInFile = new Set<string>();

    rows.forEach((row, idx) => {
      const excelRow = idx + 2;
      const code = this.normalizeCode(String(row['Mã'] || ''));
      const type = String(row['Loại (percentage/fixed)'] || '').trim().toLowerCase();
      const value = Number(row['Giá trị']);

      if (!code || code.length < 3) return errors.push({ row: excelRow, reason: 'Thiếu "Mã" hoặc quá ngắn (tối thiểu 3 ký tự).' });
      if (existingCodes.has(code) || seenInFile.has(code)) return errors.push({ row: excelRow, reason: `Mã "${code}" đã tồn tại hoặc bị lặp trong file.` });
      if (type !== 'percentage' && type !== 'fixed') return errors.push({ row: excelRow, reason: '"Loại" phải là percentage hoặc fixed.' });
      if (!value || Number.isNaN(value) || value <= 0) return errors.push({ row: excelRow, reason: '"Giá trị" không hợp lệ.' });
      if (type === 'percentage' && value > 100) return errors.push({ row: excelRow, reason: 'Giảm theo % không được vượt quá 100.' });

      const minOrderAmount = row['Đơn tối thiểu'] !== '' ? Number(row['Đơn tối thiểu']) : null;
      const maxDiscountAmount = row['Giảm tối đa'] !== '' ? Number(row['Giảm tối đa']) : null;
      const maxUses = row['Số lượt dùng tối đa'] !== '' ? Number(row['Số lượt dùng tối đa']) : null;

      seenInFile.add(code);
      toCreate.push({
        code,
        type: type as 'percentage' | 'fixed',
        value,
        minOrderAmount,
        maxDiscountAmount,
        maxUses,
        startsAt: row['Ngày bắt đầu'] || null,
        expiresAt: row['Ngày hết hạn'] || null,
        description: row['Mô tả'] || null,
      });
    });

    let created = 0;
    const createdCodes: string[] = [];
    for (const item of toCreate) {
      try {
        await this.create(item);
        created += 1;
        createdCodes.push(item.code);
      } catch (err: any) {
        errors.push({ row: 0, reason: `Mã "${item.code}": ${err.message || 'lỗi không xác định'}` });
      }
    }

    return { created, createdCodes, errors };
  }
}
