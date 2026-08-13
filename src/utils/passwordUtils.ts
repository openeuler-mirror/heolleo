import bcrypt from 'bcryptjs'

export class PasswordUtils {
  // 生成加密密码
  static async encryptPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }
} 
