import bcrypt from 'bcryptjs'

export class PasswordUtils {
  // 生成加密密码
  static async encryptPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // 验证密码
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // 生成archinstall兼容的密码哈希
  static async generateArchinstallHash(password: string): Promise<string> {
    // archinstall使用$y$格式的密码哈希
    // 这里我们使用bcrypt生成，然后转换为archinstall格式
    const hash = await bcrypt.hash(password, 12)
    
    // 将bcrypt的$2b$格式转换为archinstall的$y$格式
    // archinstall期望的格式: $y$j9T$salt$hash
    const parts = hash.split('$')
    if (parts.length >= 4) {
      const salt = parts[3].substring(0, 22) // 取前22个字符作为salt
      const hashPart = parts[3].substring(22) // 剩余部分作为hash
      return `$y$j9T$${salt}$${hashPart}`
    }
    
    return hash // 如果转换失败，返回原始hash
  }
} 