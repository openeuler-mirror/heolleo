<template>
  <div class="disk-partition">
    <div class="disk-partition-hr" />
    <div class="disk-partition-bar">
      <StepBar :step-num="2" />
    </div>
    <div class="disk-partition-form">
      <el-form :model="form" label-width="auto" label-position="left">
        <el-form-item prop="disk" :label="t('install.target_disk')">
          <el-select v-model="form.disk" placeholder="Select disk">
            <el-option
              v-for="disk in disks"
              :key="disk"
              :label="disk"
              :value="disk"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="partitionType" :label="t('install.partition_type')">
          <el-select v-model="form.partitionType">
            <el-option :label="t('install.auto_partition')" value="auto" />
            <el-option :label="t('install.manual_partition')" value="manual" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="disk-info-sub">{{ t('install.diskInfo') }}</div>
    <div class="disk-info-item">
      <PartitionGraph :data-list="installInfo?.partInfo || []" :height-px="20" />
    </div>
  </div>
</template>

<script setup lang="ts">
/// &lt;reference types="@/types/electron.d.ts" /&gt;
import { computed, inject, onActivated, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue'
import { INSTALL_INFO_KEY, DISK_LAYOUT } from "@/utils/constant.ts"
import { normalizePartInfo, initEmptyDisk } from '@/utils/partitionUtils.ts'

const { t } = useI18n()

const disks = ref<string[]>([])
const loading = ref(false)

const form = reactive({
  disk: '',
  installType: 'dev',
  partitionType: 'auto',
  useLvm: false
})

import { InstallInfo } from '@/utils/constant.ts'

const installInfo = inject<InstallInfo>(INSTALL_INFO_KEY)!
async function checkValid() {
  installInfo.disk = form.disk
  installInfo.installType = form.installType
  installInfo.partitionType = form.partitionType
  installInfo.useLvm = form.useLvm

  const selectedDisk = fullDiskInfo.value.find(d => `/dev/${d.name}` === form.disk)
  if (selectedDisk) {
    installInfo.diskSize = selectedDisk.size
    installInfo.sector_size = selectedDisk.sector_size || DISK_LAYOUT.DEFAULT_SECTOR_SIZE
  }

  return true
}

const fullDiskInfo = ref<any[]>([])

const selectedDisk = computed(() => {
  if (!form.disk || !fullDiskInfo.value.length) {
    return null
  }
  return fullDiskInfo.value.find(d => `/dev/${d.name}` === form.disk)
})

watch(selectedDisk, (newDisk) => {
  if (!newDisk) return

  const diskPath = `/dev/${newDisk.name}`
  const diskSize = Number(newDisk.size) || 0
  const freeSpaceLabel = t('install.free_space')

  // 规范化后端返回的分区数据：统一单位、补全空闲区域、1MiB 对齐
  // 后端返回的 start 已经是字节（startSector * 512），size 是字节
  if (!newDisk.partitions?.length) {
    // 无分区：整盘为空闲
    installInfo.partInfo = initEmptyDisk(diskSize, diskPath, freeSpaceLabel)
  } else {
    // 有分区：规范化（补全空闲区域、对齐）
    const rawParts = newDisk.partitions.map((part: any) => ({
      name: part.name,
      dev_path: part.dev_path,
      size: String(part.size),
      fs_type: part.fs_type || '',
      mountpoint: part.mountpoint,
      uuid: part.uuid,
      flags: part.flags || [],
      start: Number(part.start) || DISK_LAYOUT.GPT_START_OFFSET,
      type: part.type || 'primary',
      status: 'existing' as const,
      tag: part.name,
      loadPoint: part.mountpoint || '',
      label: '',
      isDelete: null,
    }))
    installInfo.partInfo = normalizePartInfo(rawParts, diskSize, diskPath, freeSpaceLabel)
  }

  // 保存原始状态用于撤销（深拷贝）
  installInfo.partInfoBefore = JSON.parse(JSON.stringify(installInfo.partInfo))
}, { immediate: true })


async function fetchDiskInfo() {
  loading.value = true
  try {
    const { success, disks: diskList } = await window.electron.ipcRenderer.invoke('get-disk-info')
    if (success && diskList?.length) {
      fullDiskInfo.value = diskList || []
      disks.value = (diskList || []).map(d => `/dev/${d.name}`)
      if (disks.value.length > 0) {
        form.disk = disks.value[0]
      }
    }
  } catch (error) {
    console.error('获取磁盘信息失败:', error)
  } finally {
    loading.value = false
  }
}

onActivated(() => {
  // 进入此页则必须获取磁盘信息
  if (!disks.value.length) {
    fetchDiskInfo()
  }
})

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.disk-partition {
  width: 100%;
  height: 100%;
  padding: 56px 0 72px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;

  &-hr {
    width: 100%;
    height: 1px;
    position: absolute;
    top: 56px;
    left: 0;
    background-color: #dfe5ef;
  }

  &-bar {
    width: calc(100% - 32px);
    margin: 24px 0;
  }

  &-form {
    width: calc(100% - 32px);
  }
}

.disk-partition-form {
  :deep(.el-form-item__content) {
    max-width: 320px;
  }
  :deep(.el-select) {
    width: 100%;
  }
}

.disk-info {
  &-sub {
    width: calc(100% - 32px);
    line-height: 2;
    color: #4e5865;
  }
  &-item {
    width: 100%;
    display: flex;
  }
}
.disk-info-item {
  width: calc(100% - 32px);
  border: 1px solid #E5EAF1;
  padding: 8px;
  background-color: #f4f6fa;
  margin-top: 8px;
}
</style>
