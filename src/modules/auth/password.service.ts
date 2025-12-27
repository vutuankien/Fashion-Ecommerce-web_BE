import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

/**Dịch vụ xử lý mật khẩu */
@Injectable()
export class PasswordService {
    /**Số vòng lặp mã hóa */
    private static readonly SALT_ROUNDS = 10;

    /**
     * Mã hóa mật khẩu
     * @param password - Mật khẩu cần mã hóa
     * @returns Mật khẩu đã được mã hóa
     */
    static async HashPassword(password: string): Promise<string> {
        /**Tạo salt cho mã hóa */
        const SALT = await bcrypt.genSalt(this.SALT_ROUNDS);
        /**Mã hóa mật khẩu với salt */
        return bcrypt.hash(password, SALT);
    }

    /**
     * So sánh mật khẩu
     * @param password - Mật khẩu cần kiểm tra
     * @param hashed_password - Mật khẩu đã mã hóa
     * @returns Kết quả so sánh
     */
    static async ComparePassword(password: string, hashed_password: string): Promise<boolean> {
        /**So sánh mật khẩu thông thường với mật khẩu đã mã hóa */
        return bcrypt.compare(password, hashed_password);
    }
}