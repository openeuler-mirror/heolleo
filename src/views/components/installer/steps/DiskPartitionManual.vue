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
      <PartitionGraph :data-list="installInfo?.partInfo || []" :height-px="20" />
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
        <el-button size="small" :disabled="!isFreeSpaceSelected" @click="partitionDialogRef?.openDialog(selectedPartition, false, selectedPartition.size)">{{ t('common.create') }}</el-button>
        <el-button size="small" :disabled="!isPartitionSelected" @click="partitionDialogRef?.openDialog(selectedPartition, true, (Number(selectedPartition.size) + totalFreeSpace))">{{ t('common.edit') }}</el-button>
        <el-button size="small" :disabled="!isPartitionSelected" @click="deleteRow(selectedPartition)">{{ t('common.delete') }}</el-button>
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
  type InstallInfo
} from '@/utils/constant.ts'
import { formatSize } from '@/utils/utils.ts'

const { t } = useI18n()

const emit = defineEmits(['prev'])
const partitionDialogRef = ref()
const createPartitionTableDialogRef = ref()
const selectedDisk = ref('')
const selectedPartition = ref<any>(null)

const installInfo = inject(INSTALL_INFO_KEY) as Reactive<InstallInfo>
async function checkValid() {
  // 检查是否至少有一个分区挂载点为 /
  const hasRootPartition = installInfo.partInfo.some(p => p.loadPoint === '/');
  if (!hasRootPartition) {
    // @ts-ignore
    ElMessage({
      type: 'error',
      message: t('install.error_no_root'),
    })
    return false
  }
  return true
}

const handleCurrentChange = (val) => {
  selectedPartition.value = val
}

const isFreeSpaceSelected = computed(() => {
  return selectedPartition.value && selectedPartition.value.tag === t('install.free_space')
})

const isPartitionSelected = computed(() => {
  return selectedPartition.value && selectedPartition.value.tag !== t('install.free_space')
})

const totalFreeSpace = computed(() => {
  return installInfo.partInfo
    .filter(p => p.tag === t('install.free_space'))
    .reduce((total, p) => total + Number(p.size), 0);
});

const deleteRow = (row: any) => {
  if (!row) return;

  const index = installInfo.partInfo.findIndex(p => p.uuid === row.uuid);
  if (index === -1) return;

  // 将分区变为空闲空间
  const freedPartition = {
    ...row,
    tag: t('install.free_space'),
    type: '',
    loadPoint: '',
    fs_type: null,
    mountpoint: null,
  };

  // 查找是否已存在空闲空间
  const existingFreeSpaceIndex = installInfo.partInfo.findIndex(p => p.tag === t('install.free_space') && p.uuid !== row.uuid);

  if (existingFreeSpaceIndex !== -1) {
    // 如果存在空闲空间，则合并
    const existingFreeSpace = installInfo.partInfo[existingFreeSpaceIndex];
    const newSize = Number(existingFreeSpace.size) + Number(freedPartition.size);
    installInfo.partInfo[existingFreeSpaceIndex].size = newSize.toString();
    installInfo.partInfo.splice(index, 1);
  } else {
    // 如果不存在空闲空间，则直接替换
    installInfo.partInfo.splice(index, 1, freedPartition);
  }

  // 清除选中状态
  selectedPartition.value = null;
};

const undoAllChanges = () => {
  installInfo.partInfo = JSON.parse(JSON.stringify(installInfo.partInfoBefore))
}

const handlePartitionConfirm = (partition: any, isEdit: boolean, originalUuid: string, shouldFormat: boolean = false) => {
  
  const index = installInfo.partInfo.findIndex(p => p.uuid === originalUuid);
  if (index === -1) {
    console.log('未找到原始分区')
    return;
  }

  if (isEdit) {
    const originalPartition = installInfo.partInfo[index];
    
    if (shouldFormat) {
      // 格式化模式：相当于删除原分区并创建新分区
      const sizeDifference = Number(partition.size) - Number(originalPartition.size);
      
      // 处理大小变化
      if (sizeDifference > 0) {
        // 分区大小增加，从空闲空间中减去
        // 需要考虑新分区大小需要的额外1MiB起始偏移
        let remainingDifference = sizeDifference + (1024 * 1024);
        const freeSpaces = installInfo.partInfo.filter(p => p.tag === t('install.free_space')).sort((a, b) => Number(b.size) - Number(a.size));

        for (const freeSpace of freeSpaces) {
          const freeSpaceIndex = installInfo.partInfo.findIndex(p => p.uuid === freeSpace.uuid);
          const freeSpaceSize = Number(freeSpace.size);

          if (remainingDifference >= freeSpaceSize) {
            remainingDifference -= freeSpaceSize;
            installInfo.partInfo.splice(freeSpaceIndex, 1);
          } else {
            installInfo.partInfo[freeSpaceIndex].size = (freeSpaceSize - remainingDifference).toString();
            remainingDifference = 0;
            break;
          }
        }
      } else if (sizeDifference < 0) {
        // 分区大小减小，增加到空闲空间
        // 需要考虑减少的分区大小释放的1MiB起始偏移
        const freedSize = -sizeDifference + (1024 * 1024);
        const existingFreeSpaceIndex = installInfo.partInfo.findIndex(p => p.tag === t('install.free_space'));

        if (existingFreeSpaceIndex !== -1) {
          const existingFreeSpace = installInfo.partInfo[existingFreeSpaceIndex];
          installInfo.partInfo[existingFreeSpaceIndex].size = (Number(existingFreeSpace.size) + freedSize).toString();
        } else {
          installInfo.partInfo.push({
            ...originalPartition,
            size: freedSize.toString(),
            tag: t('install.free_space'),
            type: '',
            loadPoint: '',
            uuid: `free-${Date.now()}`,
          });
        }
      }
      
      // 替换为新分区（相当于删除+创建）
      installInfo.partInfo.splice(index, 1, partition);
    } else {
      // 保留模式：只更新分区属性，不改变大小
      const sizeDifference = Number(partition.size) - Number(originalPartition.size);

      if (sizeDifference > 0) {
        // 分区大小增加，从空闲空间中减去
        // 需要考虑新分区大小需要的额外1MiB起始偏移
        let remainingDifference = sizeDifference + (1024 * 1024);
        const freeSpaces = installInfo.partInfo.filter(p => p.tag === t('install.free_space')).sort((a, b) => Number(b.size) - Number(a.size));

        for (const freeSpace of freeSpaces) {
          const freeSpaceIndex = installInfo.partInfo.findIndex(p => p.uuid === freeSpace.uuid);
          const freeSpaceSize = Number(freeSpace.size);

          if (remainingDifference >= freeSpaceSize) {
            remainingDifference -= freeSpaceSize;
            installInfo.partInfo.splice(freeSpaceIndex, 1);
          } else {
            installInfo.partInfo[freeSpaceIndex].size = (freeSpaceSize - remainingDifference).toString();
            remainingDifference = 0;
            break;
          }
        }
      } else if (sizeDifference < 0) {
        // 分区大小减小，增加到空闲空间
        // 需要考虑减少的分区大小释放的1MiB起始偏移
        const freedSize = -sizeDifference + (1024 * 1024);
        const existingFreeSpaceIndex = installInfo.partInfo.findIndex(p => p.tag === t('install.free_space'));

        if (existingFreeSpaceIndex !== -1) {
          const existingFreeSpace = installInfo.partInfo[existingFreeSpaceIndex];
          installInfo.partInfo[existingFreeSpaceIndex].size = (Number(existingFreeSpace.size) + freedSize).toString();
        } else {
          installInfo.partInfo.push({
            ...originalPartition,
            size: freedSize.toString(),
            tag: t('install.free_space'),
            type: '',
            loadPoint: '',
            uuid: `free-${Date.now()}`,
          });
        }
      }

      installInfo.partInfo.splice(index, 1, partition);
    }
  } else {
    // 创建模式
    const originalPartition = installInfo.partInfo[index];
    const originalSize = Number(originalPartition.size);
    const newSize = Number(partition.size);
    
    // 计算剩余空间时，需要考虑新分区需要的1MiB起始偏移
    const remainingSize = originalSize - newSize - (1024 * 1024);

    if (remainingSize > 0) {
      // 如果有剩余空间，则替换为两个分区
      const newFreePartition = {
        ...originalPartition,
        size: remainingSize.toString(),
        tag: t('install.free_space'),
        type: '',
        loadPoint: '',
        uuid: `free-${Date.now()}`,
      };
      installInfo.partInfo.splice(index, 1, partition, newFreePartition);
    } else {
      // 如果没有剩余空间，则只替换为新分区
      installInfo.partInfo.splice(index, 1, partition);
    }
  }
};

const handleCreatePartitionTable = (partitionType: string) => {
  // Mock logic to clear partitions
  const totalSize = installInfo.partInfo.reduce((sum, p) => sum + Number(p.size), 0)
  
  // 计算非空闲空间的分区数量，每个分区需要1MiB的起始偏移
  const partitionCount = installInfo.partInfo.filter(p => p.tag !== t('install.free_space')).length
  
  // 减去每个分区需要的1MiB起始偏移
  const availableSize = totalSize - (partitionCount * 1024 * 1024)
  
  installInfo.partInfo = [{
    name: t('install.free_space'),
    dev_path: installInfo.partInfo[0]?.dev_path || '',
    size: availableSize.toString(),
    fs_type: null,
    mountpoint: null,
    uuid: `free-${Date.now()}`,
    flags: [],
    start: null,
    type: '',
    status: '',
    tag: t('install.free_space'),
    loadPoint: ''
  }]
}

const tData = computed(() => {
  const sorted = (installInfo.partInfo || []).slice().sort((v1, v2) => {
    const size1 = Number(v1.size)
    const size2 = Number(v2.size)
    if (size1 === size2) {
      return v1.tag > v2.tag ? 1 : -1
    }
    return size2 - size1
  })
  return sorted.map(v => {
    const type = v.tag === t('install.free_space') ? t('install.unknown') : (v.fs_type || t('install.unknown'))
    return {
      ...v,
      type,
      sizeStr: formatSize(Number(v.size), true)
    }
  })
})

onActivated(() => {
  // 进入此页若无磁盘信息则返回上一步
  if (!installInfo.partInfoBefore?.length) {
    emit('prev')
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
  padding: 56px 0 72px;
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
  height: 240px;
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
