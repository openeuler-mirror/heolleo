<template>
  <div class="disk-info">
    <div class="disk-info-hr" />
    <div class="disk-info-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="disk-info-form">
      <div class="disk-info-labels">
        <div class="disk-info-label">{{ t('install.target_disk') }}</div>
        <div class="disk-info-label">{{ '安装方式' }}</div>
      </div>
      <div class="disk-info-values">
        <div class="disk-info-value">{{ installInfo.disk }}</div>
        <div class="disk-info-value">{{ t(INSTALL_TYPES.get(installInfo.installType)) }}</div>
      </div>
    </div>
    <div class="disk-info-sub">{{ t('install.partitionResult') }}</div>
    <div class="disk-info-res">
      <div class="disk-info-item">
        <div class="disk-info-item-label" style="text-align: right;">{{ '当前' }}</div>
        <PartitionGraph :data-list="installInfo.partInfoBefore" />
      </div>
      <div class="disk-info-item">
        <div class="disk-info-item-label" style="text-align: right;">{{ '之后' }}</div>
        <PartitionGraph :data-list="TEST_AFTER" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue'
import { INSTALL_TYPES, INSTALL_INFO_KEY } from '@/utils/constant'

const TEST_AFTER = [
  {tag: 'FancyGL', size: 26628797235, type: 'ext4'},
  {tag: 'Swap', size: 2351494594, type: 'swap'},
  {tag: 'Swap', size: 2351494594, type: 'swap'},
  {tag: 'Swap', size: 2351494594, type: 'swap'},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: 'Swap', size: 2351494594},
  {tag: '空闲空间', size: 79886391705}
]

const { t } = useI18n()

const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
</script>

<style lang="scss" scoped>
.disk-info {
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
    display: flex;
    line-height: 2;
  }

  &-sub {
    width: calc(100% - 32px);
    line-height: 2;
    color: #4e5865;
  }
}

.disk-info-label {
  min-width: 120px;
  color: #4e5865;
}
.disk-info-value {
  width: 600px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.disk-info-res {
  margin-top: 4px;
  width: calc(100% - 32px);
  padding: 20px 0;
  max-height: 260px;
  background-color: #f4f6fa;
  overflow-y: auto;
}
.disk-info-item {
  margin-top: 8px;
  display: flex;
}
.disk-info-item-label {
  padding-right: 24px;
  width: 80px;
  text-align: right;
  color: #4e5865;
}
</style>
