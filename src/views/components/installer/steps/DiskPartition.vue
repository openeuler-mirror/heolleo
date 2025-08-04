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
        <el-form-item prop="installType" :label="'安装方式'">
          <el-select v-model="form.installType">
            <el-option
              v-for="item in installTypes"
              :key="item.key"
              :label="t(item.i18nKey)"
              :value="item.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="partitionType" :label="'分区方式'">
          <el-select v-model="form.partitionType">
            <el-option label="自动分区" value="auto" />
            <el-option label="手动分区" value="manual" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="disk-info-sub">{{ t('install.diskInfo') }}</div>
    <div class="disk-info-res">
      <div class="disk-info-item">
        <PartitionGraph :data-list="installInfo?.partInfo || []" :width-px="700" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onActivated, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue'
import { INSTALL_TYPES, INSTALL_INFO_KEY } from "@/utils/constant"

const { t } = useI18n()

const disks = ref(['/dev/sda', '/dev/sdb', '/dev/nvme0n1'])
const installTypes = [...INSTALL_TYPES.entries()].map(v => ({ key: v[0], i18nKey: v[1] }))

const form = reactive({
  disk: '',
  installType: 'min',
  partitionType: 'auto'
})

const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
async function checkValid() {
  // 待添加表单验证
  installInfo.disk = form.disk
  installInfo.installType = form.installType
  installInfo.partitionType = form.partitionType
  return true
}

onActivated(() => {
  // 进入此页则必须获取磁盘信息
  if (!installInfo.partInfo?.length) {
    // 后续修改为通过API获取，并将loadPoint设为''
    // 当前为测试数据
    installInfo.partInfo = [
      {tag: 'nvme0n1p1', size: 311385129, type: 'FAT32', loadPoint: ''},
      {tag: '空闲空间', size: 511788302991, type: '', loadPoint: ''},
      {tag: 'nvme0n1p2', size: 311385129, type: 'FAT32', loadPoint: ''}
    ]
    // 保存分区前的状态
    installInfo.partInfoBefore = JSON.parse(JSON.stringify(installInfo.partInfo))
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
  &-res {
    margin-top: 4px;
    width: calc(100% - 32px);
    padding: 20px 0;
    max-height: 260px;
    background-color: #f4f6fa;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
  }
  &-item {
    margin-top: 8px;
    display: flex;
  }
}
</style>
