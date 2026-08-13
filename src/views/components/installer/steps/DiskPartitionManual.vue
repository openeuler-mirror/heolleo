<template>
  <div class="disk-partition-manual">
    <div class="disk-partition-hr" />
    <div class="disk-partition-bar">
      <StepBar :step-num="2" />
    </div>
    <div class="storage-selector-row">
      <span class="label">{{ t('install.storage_device') }}:</span>
      <el-select v-model="selectedDisk" size="small">
        <el-option :label="installInfo.disk" :value="installInfo.disk" />
      </el-select>
      <el-button size="small" style="margin-left: auto;" @click="undoAllChanges">
        {{ t('install.undo_all_changes') }}
      </el-button>
    </div>
    <div class="disk-info-item">
      <PartitionGraph :data-list="installInfo?.partInfoManual || []" :height-px="20" />
    </div>
    <div class="table-container">
      <div class="disk-part-table">
        <el-table :data="tData" size="small" height="100%" highlight-current-row @current-change="handleCurrentChange" border>
          <el-table-column :label="t('install.name')" property="tag" min-width="30%">
            <template #default="scope">
              <div
                class="disk-part-table-tag-color"
                :style="{backgroundColor: DISK_PART_PALETTE[scope.$index] || DISK_OTHERS_COLOR}"
              />
              <span class="disk-part-table-tag-text">{{ scope.row.tag }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('install.filesystem')" property="type" min-width="15%" />
          <el-table-column :label="t('install.mount_point')" property="loadPoint" min-width="20%" />
          <el-table-column :label="t('install.filesystem_label')" property="label" min-width="20%" />
          <el-table-column :label="t('install.del_label')" property="isDelete" min-width="15%" />
          <el-table-column :label="t('install.size')" property="sizeStr" min-width="15%" />
        </el-table>
      </div>
    </div>
    <div class="bottom-actions">
      <div class="bottom-actions-left">
        <el-button size="small" @click="() => {
          createPartitionTableDialogRef?.openDialog(installInfo.disk)
        }">{{ t('install.new_partition_table') }}</el-button>
      </div>
      <div class="bottom-actions-right">
        <el-button size="small" :disabled="!isFreeSpaceSelected" @click="onCreatePartition">{{ t('common.create') }}</el-button>
        <el-button size="small" :disabled="!isPartitionSelected" @click="onEditPartition">{{ t('common.edit') }}</el-button>
        <el-button size="small" :disabled="!isPartitionSelected" @click="onDeletePartition">{{ t('common.delete') }}</el-button>
      </div>
    </div>
  </div>
  <PartitionDialog ref="partitionDialogRef" @confirm="handlePartitionConfirm" />
  <CreatePartitionTableDialog ref="createPartitionTableDialogRef" @confirm="handleCreatePartitionTable" />
</template>

<script setup lang="ts">
import { computed, inject, onActivated, ref, type Reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue'
import PartitionDialog from '@/views/components/installer/comp/PartitionDialog.vue'
import CreatePartitionTableDialog from '@/views/components/installer/comp/CreatePartitionTableDialog.vue'
import {
  DISK_OTHERS_COLOR,
  DISK_PART_PALETTE,
  INSTALL_INFO_KEY,
  type InstallInfo,
  type PartInfo
} from '@/utils/constant.ts'
import { formatSize } from '@/utils/utils.ts'
import {
  isFreeSpace,
  isEffectivePartition,
  getAdjacentFreeSpace,
  createPartition,
  editPartitionKeep,
  editPartitionFormat,
  deletePartition,
  createNewPartitionTable,
  initEmptyDisk,
  normalizePartInfo,
  validateLayout,
} from '@/utils/partitionUtils.ts'

const { t } = useI18n()

/**
 * 手动分区逻辑（参考 anaconda / archinstall 标准）
 *
 * 核心约定见 src/utils/partitionUtils.ts
 * 本组件负责 UI 交互，分区布局逻辑全部委托给 partitionUtils.ts
 */

const partitionDialogRef = ref()
const createPartitionTableDialogRef = ref()
const selectedDisk = ref('')
const selectedPartition = ref<PartInfo | null>(null)

const installInfo = inject(INSTALL_INFO_KEY) as Reactive<InstallInfo>

// ============================================================
// 校验
// ============================================================

async function checkValid() {
  const result = validateLayout(installInfo.partInfoManual)
  if (!result.valid) {
    // @ts-ignore ElMessage 全局注入
    ElMessage({
      type: result.errorType === 'no_partitions' ? 'warning' : 'error',
      message: result.errorType === 'no_root'
        ? t('install.error_no_root')
        : t('install.warning_create_partition_table'),
    })
    return false
  }
  return true
}

// ============================================================
// 表格选择状态
// ============================================================

const handleCurrentChange = (val: PartInfo | null) => {
  selectedPartition.value = val
}

/** 当前选中的是否为空闲区域 */
const isFreeSpaceSelected = computed(() => {
  return !!selectedPartition.value && isFreeSpace(selectedPartition.value)
})

/** 当前选中的是否为实际分区（非空闲、非删除指令） */
const isPartitionSelected = computed(() => {
  return !!selectedPartition.value && isEffectivePartition(selectedPartition.value)
})

// ============================================================
// 分区操作入口
// ============================================================

/** 点击"创建"按钮：打开对话框，传入选中的空闲区域 */
const onCreatePartition = () => {
  if (!selectedPartition.value) return
  // 从 partInfoManual 重新查找最新空闲区域数据，
  // 避免 selectedPartition 指向 tData computed 生成的过期对象
  const latestFree = installInfo.partInfoManual.find(p => p.uuid === selectedPartition.value!.uuid)
  if (!latestFree) return
  const free = latestFree
  // 创建模式 maxSize = 空闲区域大小
  partitionDialogRef.value?.openDialog(free, false, Number(free.size))
}

/** 点击"编辑"按钮：打开对话框，传入选中的分区 */
const onEditPartition = () => {
  if (!selectedPartition.value) return
  // 从 partInfoManual 重新查找最新分区数据，
  // 避免 selectedPartition 指向 tData computed 生成的过期对象
  const latestPart = installInfo.partInfoManual.find(p => p.uuid === selectedPartition.value!.uuid)
  if (!latestPart) return
  const part = latestPart
  // 编辑模式 maxSize 计算：
  // - 格式化模式（existing/format）：后端会先 delete 释放原分区空间，扩大上限 = 原始磁盘大小 + 后方相邻空闲
  // - 保留模式/新建：扩大上限 = 当前分区大小 + 后方相邻空闲
  const partIndex = installInfo.partInfoManual.findIndex(p => p.uuid === part.uuid)
  const adjacentFree = partIndex >= 0 ? getAdjacentFreeSpace(installInfo.partInfoManual, partIndex) : 0
  const isFormatMode = part.status === 'existing' || part.status === 'format'
  const baseSize = isFormatMode
    ? Math.max(Number(part.originalSize || 0), Number(part.size))
    : Number(part.size)
  const maxSize = baseSize + adjacentFree
  partitionDialogRef.value?.openDialog(part, true, maxSize)
}

/** 点击"删除"按钮 */
const onDeletePartition = () => {
  if (!selectedPartition.value) return
  deleteRow(selectedPartition.value)
}

// ============================================================
// 删除分区
// ============================================================

const deleteRow = (row: PartInfo) => {
  if (!row.uuid) return
  installInfo.partInfoManual = deletePartition(
    installInfo.partInfoManual,
    row.uuid,
    t('install.free_space'),
    installInfo.disk
  )
  selectedPartition.value = null
}

// ============================================================
// 撤销所有修改
// ============================================================

const undoAllChanges = () => {
  if (installInfo.partInfoBefore?.length) {
    installInfo.partInfoManual = JSON.parse(JSON.stringify(installInfo.partInfoBefore))
  } else {
    installInfo.partInfoManual = initEmptyDisk(
      Number(installInfo.diskSize) || 0,
      installInfo.disk,
      t('install.free_space')
    )
  }
  selectedPartition.value = null
}

// ============================================================
// 创建 / 编辑 分区确认（由 PartitionDialog 触发）
// ============================================================

/**
 * 处理 PartitionDialog 返回的分区确认。
 *
 * @param partition  对话框返回的新分区数据（size 为字节字符串）
 * @param isEdit     是否为编辑模式
 * @param originalUuid 原始分区 uuid
 * @param shouldFormat 编辑模式下是否格式化
 */
const handlePartitionConfirm = (
  partition: PartInfo,
  isEdit: boolean,
  originalUuid: string,
  shouldFormat: boolean = false
) => {
  if (!isEdit) {
    // 创建模式：从空闲区域中切分出新分区
    installInfo.partInfoManual = createPartition(
      installInfo.partInfoManual,
      originalUuid,
      partition
    )
  } else {
    // 编辑模式
    if (shouldFormat) {
      // 格式化模式：保留位置，重建文件系统（可调整大小）
      installInfo.partInfoManual = editPartitionFormat(
        installInfo.partInfoManual,
        originalUuid,
        partition,
        t('install.free_space')
      )
    } else {
      // 保留模式：只更新挂载点等属性
      installInfo.partInfoManual = editPartitionKeep(
        installInfo.partInfoManual,
        originalUuid,
        partition
      )
    }
  }
  selectedPartition.value = null
}

// ============================================================
// 创建分区表
// ============================================================

const handleCreatePartitionTable = (_partitionType: string) => {
  installInfo.partInfoManual = createNewPartitionTable(
    Number(installInfo.diskSize) || 0,
    installInfo.disk,
    t('install.free_space')
  )
  selectedPartition.value = null
}

// ============================================================
// 表格展示数据：按物理位置(start)排序
// ============================================================

const tData = computed(() => {
  const sorted = (installInfo.partInfoManual || []).slice().sort((v1, v2) => {
    return Number(v1.start) - Number(v2.start)
  })
  return sorted.map(v => {
    const type = isFreeSpace(v) ? t('install.unknown') : (v.fs_type || t('install.unknown'))
    return {
      ...v,
      type,
      sizeStr: formatSize(Number(v.size), true)
    }
  })
})

// ============================================================
// 生命周期
// ============================================================

onActivated(() => {
  // 首次进入时：初始化 partInfo（真实磁盘数据）并深拷贝到 partInfoManual
  if (!installInfo.partInfo?.length) {
    // partInfo 为空：初始化整盘空闲
    installInfo.partInfo = initEmptyDisk(
      Number(installInfo.diskSize) || 0,
      installInfo.disk,
      t('install.free_space')
    )
  } else if (!installInfo.partInfoBefore?.length) {
    // 首次进入但 partInfoBefore 为空：规范化 partInfo 并保存为原始状态
    installInfo.partInfo = normalizePartInfo(
      installInfo.partInfo,
      Number(installInfo.diskSize) || 0,
      installInfo.disk,
      t('install.free_space')
    )
    installInfo.partInfoBefore = JSON.parse(JSON.stringify(installInfo.partInfo))
  }
  // 仅在 partInfoManual 为空（首次从 DiskPartition.vue 进入）时初始化为真实磁盘数据。
  // 从 DiskPartitionInfo.vue 返回时保留 partInfoManual 已编辑的数据。
  if (!installInfo.partInfoManual?.length) {
    installInfo.partInfoManual = JSON.parse(JSON.stringify(installInfo.partInfo))
  }
  if (installInfo.disk) {
    selectedDisk.value = installInfo.disk
  }
  selectedPartition.value = null
})

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.disk-partition-manual {
  width: 100%;
  height: 100%;
  padding: 56px 0 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  gap: 16px;
}
.disk-partition-hr {
  width: 100%;
  height: 1px;
  position: absolute;
  top: 56px;
  left: 0;
  background-color: #dfe5ef;
}
.disk-partition-bar {
  width: calc(100% - 32px);
  margin-top: 8px;
}
.storage-selector-row {
  width: calc(100% - 32px);
  display: flex;
  align-items: center;
  .label {
    margin-right: 8px;
  }
}
.disk-info-item {
  width: calc(100% - 32px);
  border: 1px solid #E5EAF1;
  padding: 8px;
  background-color: #f4f6fa;
}
.table-container {
  width: calc(100% - 32px);
  height: 165px;
}
.disk-part-table {
  height: 100%;
  border: 1px solid #eee;
  :deep(.el-table__header-wrapper) {
    th {
      background-color: #f5f7fa;
      font-weight: bold;
    }
  }
}
.bottom-actions {
  width: calc(100% - 32px);
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
  &-left, &-right {
    display: flex;
    gap: 8px;
  }
}
.disk-part-table-tag-color {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  display: inline-block;
  vertical-align: middle;
}
.disk-part-table-tag-text {
  vertical-align: middle;
}
</style>
