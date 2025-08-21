<template>
  <div class="disk-partition-summary">
    <div class="summary-group">
      <div class="summary-label">{{ t('common.before') }}:</div>
      <div class="summary-content">
        <PartitionGraph :data-list="beforeDisk.partitions" :height-px="24" />
      </div>
    </div>
    <div class="summary-group">
      <div class="summary-label">{{ t('common.after') }}:</div>
      <div class="summary-content">
        <PartitionGraph :data-list="afterDisk.partitions" :height-px="24" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue';
import { useI18n } from 'vue-i18n';

defineProps({
  beforeDisk: {
    type: Object,
    default: () => ({ partitions: [] })
  },
  afterDisk: {
    type: Object,
    default: () => ({ partitions: [] })
  }
});

const { t } = useI18n();
</script>

<style scoped lang="scss">
.disk-partition-summary {
  width: 100%;
  font-size: 14px;
}

.summary-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.summary-label {
  width: 60px;
  color: #606266;
  padding-right: 12px;
  text-align: right;
  line-height: 24px;
}

.summary-content {
  flex: 1;
}
</style>