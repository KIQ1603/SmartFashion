import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        gender: true,
        birthYear: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return user;
  }

  async updateMe(userId: string, data: { fullName?: string; gender?: string; birthYear?: number }) {
    return this.prisma.user.update({ where: { id: userId }, data: data as any });
  }

  async listAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] });
    // Tự phục hồi: nếu có địa chỉ nhưng không cái nào được đánh dấu mặc định (dữ liệu cũ tạo
    // trước khi có logic tự-mặc-định, hoặc lệch dữ liệu do thao tác thủ công), tự thăng địa chỉ
    // đầu tiên làm mặc định để tránh checkout không hiện được badge/chọn sẵn địa chỉ nào.
    if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
      const promoted = await this.prisma.address.update({ where: { id: addresses[0].id }, data: { isDefault: true } });
      addresses[0] = promoted;
    }
    return addresses;
  }

  async createAddress(userId: string, data: any) {
    const existingCount = await this.prisma.address.count({ where: { userId } });
    // Địa chỉ đầu tiên tự động là mặc định (đỡ bắt người dùng phải vào đặt lại thủ công ngay sau
    // khi vừa thêm) - từ địa chỉ thứ 2 trở đi thì theo đúng cờ isDefault người dùng chọn.
    const isDefault = existingCount === 0 ? true : !!data.isDefault;
    if (isDefault) await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.create({ data: { ...data, userId, isDefault } });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    if (data.isDefault) await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.update({ where: { id: addressId }, data });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
  }

  async removeAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    await this.prisma.address.delete({ where: { id: addressId } });
    // Vừa xóa đúng địa chỉ mặc định mà vẫn còn địa chỉ khác -> tự thăng 1 địa chỉ còn lại làm mặc
    // định, tránh trạng thái "không có địa chỉ nào mặc định" gây khó xử ở bước chọn nhanh lúc checkout.
    if (address.isDefault) {
      const remaining = await this.prisma.address.findFirst({ where: { userId } });
      if (remaining) await this.prisma.address.update({ where: { id: remaining.id }, data: { isDefault: true } });
    }
    return { success: true };
  }

  async listWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  }

  async addWishlist(userId: string, productId: string) {
    return this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async removeWishlist(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { success: true };
  }

  // ---- Admin ----
  listAll(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    return this.prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });
  }

  count() {
    return this.prisma.user.count();
  }

  setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }
}
