/**
 * 磁盘分区布局核心工具模块
 *
 * 参考 anaconda / archinstall 的设计：
 * 1. 统一使用「字节」作为内部单位（PartInfo.size 为字节字符串，start 为字节数字）
 * 2. 所有分区按物理位置 (start) 升序排列
 * 3. 空闲区域是磁盘上真实的连续未分配空间，有明确的 start/size
 * 4. 1MiB 对齐：GPT 标准布局，首个分区从 1MiB 开始
 * 5. 分区状态机：existing / create / delete / free / format
 *
 * 本模块为纯函数模块，不依赖 Vue 响应式，便于测试与复用。
 */
import {
  DISK_LAYOUT,
  type PartInfo,
  type PartitionStatus,
  type PartitionTableType,
  FREE_SPACE_STATUS
} from './constant'

const { MIB, GPT_START_OFFSET } = DISK_LAYOUT

// ============================================================
// 单位换算
// ============================================================

/** 向上对齐到 1MiB */
const alignUpMib = (bytes: number): number => Math.ceil(bytes / MIB) * MIB

/** 向下对齐到 1MiB */
const alignDownMib = (bytes: number): number => Math.floor(bytes / MIB) * MIB

// ============================================================
// ID 生成
// ============================================================

/** 生成唯一 id（用于前端临时标识） */
const genId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ============================================================
// 状态判断
// ============================================================

/** 判断是否为空闲区域 */
export const isFreeSpace = (p: PartInfo): boolean => p.status === FREE_SPACE_STATUS

/** 判断是否为有效分区（非空闲、非删除指令） */
export const isEffectivePartition = (p: PartInfo): boolean =>
  !isFreeSpace(p) && p.status !== 'delete'

// ============================================================
// 分区对象构造
// ============================================================

/**
 * 构造一个空闲空间分区对象
 * @param start 起始字节偏移
 * @param size  字节大小
 * @param diskPath 磁盘设备路径
 * @param freeSpaceLabel 空闲空间的国际化标签
 */
export const createFreeSpacePart = (
  start: number,
  size: number,
  diskPath: string,
  freeSpaceLabel: string
): PartInfo => ({
  name: freeSpaceLabel,
  dev_path: diskPath,
  size: size.toString(),
  fs_type: '',
  mountpoint: null,
  uuid: genId('free'),
  flags: [],
  start,
  type: '',
  status: FREE_SPACE_STATUS,
  tag: freeSpaceLabel,
  loadPoint: '',
  label: '',
  isDelete: null
})

// ============================================================
// 布局重建与合并
// ============================================================

/**
 * 将分区列表按物理位置 (start) 升序排序，并合并相邻的空闲区域。
 *
 * 参考 anaconda：空闲空间必须是磁盘上连续的真实区域，不允许碎片化。
 * 注意：delete 指令分区不参与合并（它们保留原始位置用于生成删除配置）。
 */
const mergeAdjacentFreeSpaces = (parts: PartInfo[]): PartInfo[] => {
  const sorted = [...parts].sort((a, b) => Number(a.start) - Number(b.start))
  const result: PartInfo[] = []
  for (const p of sorted) {
    const last = result[result.length - 1]
    if (
      isFreeSpace(p) &&
      last &&
      isFreeSpace(last) &&
      Number(last.start) + Number(last.size) === Number(p.start)
    ) {
      // 合并相邻空闲区域
      last.size = (Number(last.size) + Number(p.size)).toString()
    } else {
      result.push({ ...p })
    }
  }
  return result
}

/**
 * 重建磁盘布局：按 start 排序并合并相邻空闲空间。
 */
const rebuildLayout = (parts: PartInfo[]): PartInfo[] =>
  mergeAdjacentFreeSpaces(parts)

// ============================================================
// 后端数据规范化
// ============================================================

/**
 * 对从后端获取的原始分区列表进行规范化：
 * - 统一 start/size 为字节
 * - 标记 status='existing'
 * - 在分区之间以及首尾补全空闲区域
 * - 1MiB 对齐
 *
 * @param rawParts 后端返回的原始分区列表
 * @param diskSize 磁盘总大小（字节，已预扣 GPT 备份区）
 * @param diskPath 磁盘设备路径
 * @param freeSpaceLabel 空闲空间的国际化标签
 */
export const normalizePartInfo = (
  rawParts: PartInfo[],
  diskSize: number,
  diskPath: string,
  freeSpaceLabel: string
): PartInfo[] => {
  // 无分区：整盘为空闲
  if (!rawParts || rawParts.length === 0) {
    return [
      createFreeSpacePart(
        GPT_START_OFFSET,
        Math.max(0, diskSize - GPT_START_OFFSET),
        diskPath,
        freeSpaceLabel
      )
    ]
  }

  // 规范化每个分区：统一类型与单位
  const normalized: PartInfo[] = rawParts
    .map(p => {
      const start = alignUpMib(Number(p.start) || GPT_START_OFFSET)
      const size = alignDownMib(Number(p.size) || 0)
      return {
        ...p,
        size: size.toString(),
        start,
        status: 'existing' as PartitionStatus,
        isDelete: null,
        loadPoint: p.loadPoint || p.mountpoint || '',
        tag: p.tag || p.name,
        type: p.type || ('primary' as PartInfo['type']),
      }
    })
    // 过滤掉大小为 0 的无效分区
    .filter(p => Number(p.size) > 0)
    .sort((a, b) => Number(a.start) - Number(b.start))

  // 在分区之间以及首尾补全空闲区域
  const result: PartInfo[] = []
  let cursor = GPT_START_OFFSET

  for (const p of normalized) {
    const pStart = Number(p.start)
    // 分区前若存在空隙，补一个空闲区域
    if (pStart > cursor) {
      result.push(createFreeSpacePart(cursor, pStart - cursor, diskPath, freeSpaceLabel))
    }
    result.push(p)
    cursor = pStart + Number(p.size)
  }
  // 末尾剩余空间
  if (diskSize > cursor) {
    result.push(createFreeSpacePart(cursor, diskSize - cursor, diskPath, freeSpaceLabel))
  }

  return mergeAdjacentFreeSpaces(result)
}

// ============================================================
// 空磁盘初始化
// ============================================================

/**
 * 初始化空磁盘：整盘为一个空闲区域（从 1MiB 开始）。
 * @param diskSize 磁盘总大小（字节，已预扣 GPT 备份区）
 * @param diskPath 磁盘设备路径
 * @param freeSpaceLabel 空闲空间的国际化标签
 */
export const initEmptyDisk = (
  diskSize: number,
  diskPath: string,
  freeSpaceLabel: string
): PartInfo[] => {
  if (diskSize <= 0) return []
  return [
    createFreeSpacePart(
      GPT_START_OFFSET,
      Math.max(0, diskSize - GPT_START_OFFSET),
      diskPath,
      freeSpaceLabel
    )
  ]
}

// ============================================================
// 创建分区表
// ============================================================

/**
 * 创建新分区表：清空磁盘所有分区，整盘变为一个空闲区域。
 * 参考 anaconda：创建新分区表会擦除所有现有分区。
 */
export const createNewPartitionTable = (
  diskSize: number,
  diskPath: string,
  freeSpaceLabel: string,
  _tableType: PartitionTableType = 'gpt'
): PartInfo[] => {
  return initEmptyDisk(diskSize, diskPath, freeSpaceLabel)
}

// ============================================================
// 分区操作（创建 / 编辑 / 删除）
// ============================================================

/**
 * 从空闲区域中创建新分区。
 *
 * @param parts 当前分区列表
 * @param freeUuid 目标空闲区域的 uuid
 * @param newPart 新分区数据（size 为字节字符串）
 * @returns 新的分区列表
 */
export const createPartition = (
  parts: PartInfo[],
  freeUuid: string,
  newPart: PartInfo
): PartInfo[] => {
  const index = parts.findIndex(p => p.uuid === freeUuid)
  if (index === -1) return parts

  const free = parts[index]
  const freeStart = Number(free.start)
  const freeSize = Number(free.size)
  const newSize = Number(newPart.size)

  // 新分区占用空闲区域起始部分
  const created: PartInfo = {
    ...newPart,
    start: freeStart,
    size: newSize.toString(),
    status: 'create',
    isDelete: null,
  }

  const remaining = freeSize - newSize
  if (remaining >= MIB) {
    // 剩余空间足够，切分出新的空闲区域
    const newFree = createFreeSpacePart(
      freeStart + newSize,
      remaining,
      free.dev_path || '',
      free.tag
    )
    return rebuildLayout([
      ...parts.slice(0, index),
      created,
      newFree,
      ...parts.slice(index + 1),
    ])
  }
  // 剩余不足 1MiB，全部划归新分区（避免碎片）
  created.size = freeSize.toString()
  return rebuildLayout([
    ...parts.slice(0, index),
    created,
    ...parts.slice(index + 1),
  ])
}

/**
 * 编辑分区（保留模式）：只更新挂载点等属性，不改大小/位置/文件系统。
 */
export const editPartitionKeep = (
  parts: PartInfo[],
  uuid: string,
  updates: Partial<PartInfo>
): PartInfo[] => {
  const index = parts.findIndex(p => p.uuid === uuid)
  if (index === -1) return parts

  const original = parts[index]
  const updated: PartInfo = {
    ...original,
    loadPoint: updates.loadPoint ?? original.loadPoint,
    // 保留模式：保持原有状态（create 保持 create，existing 保持 existing）
    status: original.status === 'create' ? 'create' : 'existing',
    isDelete: null,
  }
  return rebuildLayout([
    ...parts.slice(0, index),
    updated,
    ...parts.slice(index + 1),
  ])
}

/**
 * 计算分区后方相邻空闲区域的大小（字节）。
 * 仅相邻的空闲区域可用于扩大分区，避免跨分区借用导致重叠。
 */
export const getAdjacentFreeSpace = (parts: PartInfo[], index: number): number => {
  const part = parts[index]
  if (!part) return 0
  const partEnd = Number(part.start) + Number(part.size)
  const next = parts[index + 1]
  if (next && isFreeSpace(next) && Number(next.start) === partEnd) {
    return Number(next.size)
  }
  return 0
}

/**
 * 编辑分区（格式化模式）：保留位置，重建文件系统。
 * 对已存在分区（existing）格式化 = 转为 format 状态。
 * 对新建分区（create）格式化 = 保持 create 状态。
 *
 * 大小调整规则（参考 anaconda）：
 * - 缩小分区：释放空间到后方空闲区域
 * - 扩大分区：仅能从后方相邻空闲区域借用空间；若不足则限制为最大可借大小
 *
 * @param parts 当前分区列表
 * @param uuid 目标分区 uuid
 * @param updates 新属性（fs_type / loadPoint / flags / size 等）
 * @param freeSpaceLabel 缩小分区时新建空闲区域的标签
 */
export const editPartitionFormat = (
  parts: PartInfo[],
  uuid: string,
  updates: Partial<PartInfo>,
  freeSpaceLabel?: string
): PartInfo[] => {
  const index = parts.findIndex(p => p.uuid === uuid)
  if (index === -1) return parts

  const original = parts[index]
  const originalStart = Number(original.start)
  const originalSize = Number(original.size)
  // 原始磁盘分区大小：多次编辑同一分区时，始终保留首次格式化前的真实磁盘大小，
  // 不被后续编辑覆盖。delete 指令按此大小删除物理分区。
  const realOriginalSize = original.originalSize ? Number(original.originalSize) : originalSize
  let newSize = Number(updates.size)

  // 校验扩大时的可用空间
  // 格式化（format/existing → format）模式下，后端会先 delete 原分区释放空间再 create，
  // 因此扩大上限 = 原始磁盘分区大小 + 后方相邻空闲区域
  // 新建（create）模式下，扩大上限 = 当前分区大小 + 后方相邻空闲区域
  const isFormatMode = original.status === 'existing' || original.status === 'format'
  const sizeDiff = newSize - originalSize
  if (sizeDiff > 0) {
    const adjacentFree = getAdjacentFreeSpace(parts, index)
    const maxAvailable = isFormatMode
      ? Math.max(realOriginalSize, originalSize) + adjacentFree
      : originalSize + adjacentFree
    if (newSize > maxAvailable) {
      // 可用空间不足，限制为最大可扩展大小（避免重叠）
      newSize = maxAvailable
    }
  }

  const finalSizeDiff = newSize - originalSize

  if (finalSizeDiff === 0) {
    // 大小不变：仅更新文件系统等属性，转为 format 状态
    const updated: PartInfo = {
      ...original,
      fs_type: updates.fs_type || original.fs_type,
      loadPoint: updates.loadPoint ?? original.loadPoint,
      flags: updates.flags ?? original.flags,
      size: originalSize.toString(),
      start: originalStart,
      status: original.status === 'create' ? 'create' : 'format',
      shouldFormat: true,
      isDelete: null,
      // 保留真正的原始磁盘大小，多次编辑不覆盖
      originalSize: realOriginalSize.toString(),
    }
    return rebuildLayout([
      ...parts.slice(0, index),
      updated,
      ...parts.slice(index + 1),
    ])
  }

  // 大小变化：需要调整相邻空闲区域
  let newParts = [...parts]
  if (finalSizeDiff > 0) {
    // 扩大分区：从后方相邻空闲区域借用空间
    newParts = borrowFromNextFree(newParts, index, finalSizeDiff)
  } else {
    // 缩小分区：释放空间到后方
    newParts = releaseToFree(newParts, index, -finalSizeDiff, freeSpaceLabel)
  }

  // 更新分区属性
  const updatedOriginal = newParts[index]
  const updated: PartInfo = {
    ...updatedOriginal,
    fs_type: updates.fs_type || updatedOriginal.fs_type,
    loadPoint: updates.loadPoint ?? updatedOriginal.loadPoint,
    flags: updates.flags ?? updatedOriginal.flags,
    size: newSize.toString(),
    status: updatedOriginal.status === 'create' ? 'create' : 'format',
    shouldFormat: true,
    isDelete: null,
    // 保留真正的原始磁盘大小，多次编辑不覆盖
    originalSize: realOriginalSize.toString(),
  }
  newParts[index] = updated
  return rebuildLayout(newParts)
}

/**
 * 从后方相邻的空闲区域借用空间（扩大分区）。
 * 仅当后方紧邻空闲区域且足够时才借用；不足时全部借走。
 */
const borrowFromNextFree = (
  parts: PartInfo[],
  index: number,
  borrowSize: number
): PartInfo[] => {
  const newParts = [...parts]
  const part = newParts[index]
  const partEnd = Number(part.start) + Number(part.size)
  const next = newParts[index + 1]

  if (next && isFreeSpace(next) && Number(next.start) === partEnd) {
    const nextSize = Number(next.size)
    if (nextSize >= borrowSize) {
      // 空闲区域足够，扣减
      const remaining = nextSize - borrowSize
      if (remaining >= MIB) {
        newParts[index + 1] = {
          ...next,
          start: Number(next.start) + borrowSize,
          size: remaining.toString(),
        }
      } else {
        // 剩余不足 1MiB，全部借走
        newParts.splice(index + 1, 1)
      }
    } else {
      // 空闲区域不足，全部借走（由调用方限制 borrowSize）
      newParts.splice(index + 1, 1)
    }
  }
  // 若后方非空闲区域，则不借用（由调用方已限制 newSize）
  return newParts
}

/**
 * 释放空间到后方（缩小分区，产生或扩大后方空闲区域）。
 */
const releaseToFree = (
  parts: PartInfo[],
  index: number,
  releaseSize: number,
  freeSpaceLabel?: string
): PartInfo[] => {
  const newParts = [...parts]
  const part = newParts[index]
  const partEnd = Number(part.start) + Number(part.size)
  const next = newParts[index + 1]

  if (next && isFreeSpace(next) && Number(next.start) === partEnd) {
    // 合并到后方空闲区域
    newParts[index + 1] = {
      ...next,
      start: Number(next.start) - releaseSize,
      size: (Number(next.size) + releaseSize).toString(),
    }
  } else {
    // 新建空闲区域，使用正确的空闲空间标签
    const newFree = createFreeSpacePart(
      partEnd - releaseSize,
      releaseSize,
      part.dev_path || '',
      freeSpaceLabel || part.tag
    )
    newParts.splice(index + 1, 0, newFree)
  }
  return newParts
}

/**
 * 删除分区。
 *
 * - create 分区：尚未落盘，直接转为空闲
 * - existing/format 分区：转为 delete 指令 + 释放空闲区域
 *
 * @param parts 当前分区列表
 * @param uuid 目标分区 uuid
 * @param freeSpaceLabel 空闲空间的国际化标签
 * @param diskPath 磁盘设备路径
 */
export const deletePartition = (
  parts: PartInfo[],
  uuid: string,
  freeSpaceLabel: string,
  diskPath: string
): PartInfo[] => {
  const index = parts.findIndex(p => p.uuid === uuid)
  if (index === -1) return parts

  const part = parts[index]
  const start = Number(part.start)
  const size = Number(part.size)

  if (part.status === 'create') {
    // 新建分区尚未落盘，直接转为空闲
    const freed = createFreeSpacePart(start, size, diskPath, freeSpaceLabel)
    return rebuildLayout([
      ...parts.slice(0, index),
      freed,
      ...parts.slice(index + 1),
    ])
  }

  // 已存在分区：保留 delete 指令 + 释放空闲区域
  const freed = createFreeSpacePart(start, size, diskPath, freeSpaceLabel)
  const deleteDirective: PartInfo = {
    ...part,
    status: 'delete',
    isDelete: 'delete',
    loadPoint: '',
    mountpoint: null,
  }
  return rebuildLayout([
    ...parts.slice(0, index),
    freed,
    ...parts.slice(index + 1),
    deleteDirective,
  ])
}

// ============================================================
// 校验
// ============================================================

/**
 * 校验分区布局是否有效：
 * - 必须至少有一个挂载点为 / 的有效分区
 * - 分区之间不能重叠
 *
 * @returns 校验结果与错误类型
 */
export const validateLayout = (parts: PartInfo[]): {
  valid: boolean
  errorType?: 'no_root' | 'no_partitions' | 'overlap'
} => {
  const effective = parts.filter(isEffectivePartition)

  if (effective.length === 0) {
    return { valid: false, errorType: 'no_partitions' }
  }

  const hasRoot = effective.some(p => p.loadPoint === '/')
  if (!hasRoot) {
    return { valid: false, errorType: 'no_root' }
  }

  // 检查分区重叠（按 start 排序后检查相邻边界）
  const sorted = [...effective].sort((a, b) => Number(a.start) - Number(b.start))
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i]
    const next = sorted[i + 1]
    const curEnd = Number(cur.start) + Number(cur.size)
    if (curEnd > Number(next.start)) {
      return { valid: false, errorType: 'overlap' }
    }
  }

  return { valid: true }
}
