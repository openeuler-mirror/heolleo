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
      </div>
      <div class="disk-info-sub">{{ t('install.partitionResult') }}</div>
      <div class="disk-info-res">
        <DiskPartitionSummary :before-disk="beforeDisk" :after-disk="afterDisk" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, reactive, onActivated, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import DiskPartitionSummary from './DiskPartitionSummary.vue'
import { INSTALL_INFO_KEY, InstallInfo } from "@/utils/constant.ts"
import { ConfigGenerator } from '@/services/ConfigGenerator.ts'
import { initEmptyDisk } from '@/utils/partitionUtils.ts'

const { t } = useI18n()

const installInfo = inject(INSTALL_INFO_KEY, reactive({} as InstallInfo))
const afterDisk = ref({ name: '', partitions: [] as any[] })

const beforeDisk = ref({
  name: installInfo.disk,
  partitions: installInfo.partInfoBefore || [],
});

/**
 * 加载自动分区预览（通过 ConfigGenerator 生成 archinstall 配置后转换回 PartInfo）
 */
async function loadAutoPartitions() {
  try {
    const autoPartitions = await ConfigGenerator.generatePartitionPreview(installInfo);

    // 如果自动分区返回空数组且磁盘没有分区，创建一个空闲空间分区
    let partitionsToShow = autoPartitions;
    if (autoPartitions.length === 0 && (!installInfo.partInfoBefore || installInfo.partInfoBefore.length === 0)) {
      partitionsToShow = initEmptyDisk(
        Number(installInfo.diskSize) || 0,
        installInfo.disk,
        t('install.free_space')
      );
    }

    // 应用翻译
    const translatedPartitions = partitionsToShow.map((partition: any) => ({
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
  }
}

/**
 * 加载手动分区预览。
 *
 * 手动分区的 after 视图展示用户操作后的最终磁盘布局：
 * - 保留 free 区域（可视化显示未分配空间）
 * - 过滤掉 delete 指令分区（删除的分区不出现在最终布局中）
 * - create/existing/format 分区正常显示
 */
function loadManualPartitions() {
  const afterPartitions = (installInfo.partInfoManual || []).filter((p: any) => p.status !== 'delete')
  afterDisk.value = {
    name: installInfo.disk,
    partitions: [...afterPartitions],
  };
}

function updateAfterDisk() {
  // 更新 beforeDisk：使用原始分区布局
  let beforePartitions = [...(installInfo.partInfoBefore || [])];

  // 如果 partInfoBefore 为空且磁盘有大小，创建一个空闲空间分区
  if (beforePartitions.length === 0 && installInfo.diskSize && installInfo.diskSize > 0) {
    beforePartitions = initEmptyDisk(
      Number(installInfo.diskSize) || 0,
      installInfo.disk,
      t('install.free_space')
    );
  }

  beforeDisk.value = {
    name: installInfo.disk,
    partitions: beforePartitions,
  };

  if (installInfo.partitionType === 'auto') {
    loadAutoPartitions();
  } else {
    loadManualPartitions();
  }
}

onActivated(() => {
  updateAfterDisk()
  if (installInfo.partitionType === 'manual') {
    loadManualPartitions()
  }
})

// 监听安装信息变化，重新加载分区信息
watch(() => [installInfo.disk, installInfo.partitionType, installInfo.useLvm, installInfo.partInfoManual, installInfo.partInfoBefore], () => {
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
