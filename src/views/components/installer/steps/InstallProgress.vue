<template>
  <div class="install-progress">
    <div class="install-progress-hr" />
    <div class="install-progress-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="install-progress-content">
      <el-carousel :interval="4000" arrow="always" indicator-position="none">
        <el-carousel-item v-for="idx in 3" :key="idx">
          <el-empty :description="`pic-${idx}`"></el-empty>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div class="install-progress-percent">
      <el-progress
        class="progress-comp"
        :percentage="progress"
        :stroke-width="8"
        :status="error ? 'exception' : undefined"
      />
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {inject, ref, onMounted} from 'vue'
import { INSTALL_INFO_KEY } from "@/utils/constant"
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'

const emit = defineEmits(['finish'])

const { t } = useI18n()

const progress = ref(0)
const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
const error = ref('')

async function reqProgress() {
  try {
    // 阶段1: 分区磁盘 (20%)
    const { success: partitionSuccess } = await window.electron.ipcRenderer.invoke('partition-disk', {
      disk: installInfo.disk,
      bootMode: installInfo.bootMode
    })
    if (!partitionSuccess) throw new Error('磁盘分区失败')
    progress.value = 20

    // 阶段2: 安装系统 (20% -> 70%)
    const { success: installSuccess } = await window.electron.ipcRenderer.invoke('install-system', {
      rootPath: '/mnt/install_system',
      packages: ['@base', 'grub2', 'kernel']
    })
    if (!installSuccess) throw new Error('系统安装失败')
    progress.value = 70

    // 阶段3: 配置GRUB (70% -> 90%)
    const { success: grubSuccess } = await window.electron.ipcRenderer.invoke('configure-grub', {
      disk: installInfo.disk,
      bootMode: installInfo.bootMode,
      rootPath: '/mnt/install_system'
    })
    if (!grubSuccess) throw new Error('GRUB配置失败')
    progress.value = 90

    // 阶段4: 完成 (90% -> 100%)
    progress.value = 100
    emit('finish')
  } catch (err) {
    error.value = err.message
    console.error('安装失败:', err)
  }
}

onMounted(() => {
  reqProgress()
})
</script>

<style scoped lang="scss">
.install-progress {
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

  &-content {
    width: calc(100% - 64px);
    height: 300px;
    background-color: #dfe5ef;
  }

  &-percent {
    width: calc(100% - 64px);
    margin-top: 24px;
  }
}
:deep(.progress-comp) {
  .el-progress__text {
    margin-left: 0;
    text-align: right;
  }
}
</style>
