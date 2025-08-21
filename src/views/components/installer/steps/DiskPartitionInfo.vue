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
import { computed, inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import DiskPartitionSummary from './DiskPartitionSummary.vue'
import { INSTALL_INFO_KEY, INSTALL_TYPES, InstallInfo } from "@/utils/constant.ts"
import { ConfigGenerator } from '@/services/ConfigGenerator.ts'

const { t } = useI18n()

const installInfo = inject(INSTALL_INFO_KEY, reactive({} as InstallInfo))

const beforeDisk = computed(() => ({
  name: installInfo.disk,
  partitions: installInfo.partInfoBefore,
}));

const afterDisk = computed(() => {
  if (installInfo.partitionType === 'auto') {
    // 自动分区模式：从 ConfigGenerator 获取预期的分区结果
    const autoPartitions = ConfigGenerator.generatePartitionPreview(installInfo);
    // 应用翻译
    const translatedPartitions = autoPartitions.map(partition => ({
      ...partition,
      tag: partition.tag === 'EFI System Partition' ? t('install.efi_system_partition') :
           partition.tag === 'LVM Partition' ? t('install.lvm_partition') :
           partition.tag === 'Root Partition' ? t('install.root_partition') : partition.tag
    }));
    
    return {
      name: installInfo.disk,
      partitions: translatedPartitions,
    };
  } else {
    // 手动分区模式：使用用户修改的分区
    return {
      name: installInfo.disk,
      partitions: installInfo.partInfo,
    };
  }
});

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
