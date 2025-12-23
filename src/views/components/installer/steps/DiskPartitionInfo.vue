<template>
  <div class="disk-info">
    <div class="disk-info-hr" />
    <div class="disk-info-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="content-wrapper">
      <div class="disk-info-form">
        <div>
          <span class="disk-info-label">{{ t('install.target_disk') }}</span>
          <span class="disk-info-value">{{ installInfo.disk }}</span>
        </div>
        <div>
          <span class="disk-info-label">{{ t('install.install_type') }}</span>
          <span class="disk-info-value">{{ t(INSTALL_TYPES.get(installInfo.installType) || '') }}</span>
        </div>
      </div>
      <div class="disk-info-sub">{{ t('install.partitionResult') }}</div>
      <div class="disk-info-res">
        <DiskPartitionSummary :before-disk="beforeDisk" :after-disk="afterDisk" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import DiskPartitionSummary from './DiskPartitionSummary.vue'
import { INSTALL_INFO_KEY, INSTALL_TYPES, InstallInfo } from "@/utils/constant.ts"
import { ConfigGenerator } from '@/services/ConfigGenerator.ts'

const { t } = useI18n()

const installInfo = inject(INSTALL_INFO_KEY, reactive({} as InstallInfo))
const afterDisk = ref({ name: '', partitions: [] })
const isLoading = ref(true)

const beforeDisk = ref({
  name: installInfo.disk,
  partitions: installInfo.partInfoBefore || [],
});

async function loadAutoPartitions() {
  try {
    isLoading.value = true
    const autoPartitions = await ConfigGenerator.generatePartitionPreview(installInfo);
    
    // 如果自动分区返回空数组且磁盘没有分区，创建一个空闲空间分区
    let partitionsToShow = autoPartitions;
    if (autoPartitions.length === 0 && (!installInfo.partInfoBefore || installInfo.partInfoBefore.length === 0)) {
      const freeSpacePartition = {
        name: installInfo.disk,
        dev_path: installInfo.disk,
        size: String(installInfo.diskSize),
        fs_type: '',
        mountpoint: '',
        uuid: 'free-space-' + Date.now(),
        flags: [],
        start: 0,
        type: 'free_space',
        status: 'free_space',
        tag: t('install.free_space'),
        loadPoint: ''
      };
      partitionsToShow = [freeSpacePartition];
    }
    
    // 应用翻译
    const translatedPartitions = partitionsToShow.map(partition => ({
      ...partition,
      tag: partition.tag === 'EFI System Partition' ? t('install.efi_system_partition') :
           partition.tag === 'LVM Partition' ? t('install.lvm_partition') :
           partition.tag === 'Root Partition' ? t('install.root_partition') : partition.tag
    }));
    
    afterDisk.value = {
      name: installInfo.disk,
      partitions: translatedPartitions,
    };
  } catch (error) {
    console.error('Failed to load auto partitions:', error)
    afterDisk.value = {
      name: installInfo.disk,
      partitions: [],
    };
  } finally {
    isLoading.value = false
  }
}

function loadManualPartitions() {
  // 确保触发响应式更新
  afterDisk.value = {
    name: installInfo.disk,
    partitions: [...installInfo.partInfo], // 使用展开运算符创建新数组
  };
}

function updateAfterDisk() {
  // 更新beforeDisk - 确保使用响应式更新
  let beforePartitions = [...(installInfo.partInfoBefore || [])];
  
  // 如果partInfoBefore为空且磁盘有大小，创建一个空闲空间分区
  if (beforePartitions.length === 0 && installInfo.diskSize && installInfo.diskSize > 0) {
    const freeSpacePartition = {
      name: installInfo.disk,
      dev_path: installInfo.disk,
      size: String(installInfo.diskSize),
      fs_type: '',
      mountpoint: '',
      uuid: 'free-space-before-' + Date.now(),
      flags: [],
      start: 0,
      type: 'free_space',
      status: 'free_space',
      tag: t('install.free_space'),
      loadPoint: ''
    };
    beforePartitions = [freeSpacePartition];
  }
  
  beforeDisk.value = {
    name: installInfo.disk,
    partitions: beforePartitions,
  };
  
  if (installInfo.partitionType === 'auto') {
    loadAutoPartitions();
  } else {
    // 手动分区模式：确保partInfo为空数组时也能正确显示
    loadManualPartitions();
  }
}

onMounted(() => {
  updateAfterDisk()
  // 确保在组件挂载时加载手动分区数据
  if (installInfo.partitionType === 'manual') {
    loadManualPartitions()
  }
})

// 监听安装信息变化，重新加载分区信息
watch(() => [installInfo.disk, installInfo.partitionType, installInfo.useLvm, installInfo.partInfo, installInfo.partInfoBefore], () => {
  updateAfterDisk()
}, { deep: true })

async function checkValid() {
  return true
}

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.disk-info {
  width: 100%;
  height: 100%;
  padding: 56px 0 72px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

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
}

.content-wrapper {
  width: calc(100% - 64px);
  max-width: 800px;
}

.disk-info-form {
  margin-bottom: 24px;
  line-height: 2;
}

.disk-info-label {
  display: inline-block;
  width: 80px; 
  color: #4e5865;
  margin-right: 16px;
}

.disk-info-value {
  color: #1c252d;
  font-weight: 500;
}

.disk-info-sub {
  line-height: 2;
  color: #4e5865;
}

.disk-info-res {
  margin-top: 4px;
  padding: 16px;
  background-color: #f4f6fa;
  height: 240px;
  overflow-y: auto;
}
</style>
