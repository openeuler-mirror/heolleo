<template>
  <div class="install-progress">
    <div class="install-progress-hr" />
    <div class="install-progress-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="install-progress-content">
      <div v-if="!showLog" class="carousel-wrapper">
        <el-carousel :interval="4000" arrow="always" indicator-position="none">
          <el-carousel-item v-for="idx in 3" :key="idx">
            <img :src="`/slides/slide${idx}.png`" style="width: 100%; height: 100%; object-fit: cover;" />
          </el-carousel-item>
        </el-carousel>
      </div>
      <div v-else ref="logViewer" class="log-viewer">
        <pre>{{ logs.join('\n') }}</pre>
      </div>
    </div>
    <div class="install-progress-percent">
      <div class="progress-wrapper">
        <el-progress
          class="progress-comp"
          :percentage="progress"
          :stroke-width="8"
          :status="installStatus === 'failed' ? 'exception' : undefined"
        />
        <el-icon v-if="logs.length > 0" @click="showLog = !showLog" class="log-icon" size="20">
          <IconFileText />
        </el-icon>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, reactive, nextTick } from 'vue'
import { INSTALL_INFO_KEY, InstallInfo } from '@/utils/constant.ts'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import { IconFileText } from '@computing/opendesign-icons'

const emit = defineEmits(['finish', 'failed'])

const { t, locale } = useI18n()

const progress = ref(0)
const installInfo = inject<InstallInfo>(INSTALL_INFO_KEY, reactive({} as InstallInfo))
const error = ref('')
const installStatus = ref<'installing' | 'success' | 'failed'>('installing')
const showLog = ref(false)
const logs = ref<string[]>([])
const logViewer = ref<HTMLElement | null>(null)

async function install() {
  const listener = (event, log) => {
    logs.value.push(log)
    nextTick(() => {
      if (logViewer.value) {
        logViewer.value.scrollTop = logViewer.value.scrollHeight
      }
    })
    if (log.includes('Starting installation...')) {
      progress.value = 20
    } else if (log.includes("installing packages ['base', 'base-devel', 'linux-firmware', 'linux', 'microcode_ctl']")) {
      progress.value = 30
    } else if (log.includes('Enabling periodic TRIM')) {
      progress.value = 40
    } else if (log.includes('Setting up swap on zram')) {
      progress.value = 50
    } else if (log.includes('Adding bootloader Systemd-boot')) {
      progress.value = 60
    } else if (log.includes('Activating systemd-timesyncd for time synchronization')) {
      progress.value = 80
    } else if (log.includes('Updating /mnt/etc/fstab')) {
      progress.value = 90
    } else if (log.includes('Installation completed without any errors')) {
      progress.value = 100
      installStatus.value = 'success'
      emit('finish')
      window.electron.ipcRenderer.removeListener('install-log', listener)
    }
  }

  window.electron.ipcRenderer.on('install-log', listener)

  try {
    const { success } = await window.electron.ipcRenderer.invoke('install-system', installInfo.configPath)
    if (!success) {
      throw new Error('安装失败')
    }
  } catch (err: any) {
    error.value = (err as Error).message
    installStatus.value = 'failed'
    emit('failed')
    console.error('安装失败:', err)
    window.electron.ipcRenderer.removeListener('install-log', listener)
  }
}

onMounted(() => {
  install()
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
    .carousel-wrapper,
    .log-viewer {
      width: 100%;
      height: 100%;
    }
    .log-viewer {
      padding: 8px;
      border-radius: 4px;
      overflow-y: auto;
      background-color: #000;
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
      box-sizing: border-box;
      text-align: left;
      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: #4c4c4c;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-track {
        background-color: #2c2c2c;
      }
      pre {
        margin: 0;
      }
    }
  }

  &-percent {
    width: calc(100% - 64px);
    margin-top: 24px;
  }
}
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}
.progress-comp {
  flex-grow: 1;
}
.log-icon {
  cursor: pointer;
  color: #409eff;
  &:hover {
    color: #79bbff;
  }
}
:deep(.progress-comp) {
  .el-progress__text {
    margin-left: 0;
    text-align: right;
  }
}
</style>
