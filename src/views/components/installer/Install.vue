<template>
  <div class="wrapper">
    <div class="nav">
      <img class="logo" src="@/assets/logo_s.svg" alt="logo_s">
      <div class="close">
        <el-icon size="16" color="#8d98aa" style="cursor: pointer;" @click.stop="closeApp">
          <IconX />
        </el-icon>
      </div>
    </div>
    <div class="container">
      <component :is="currentStep" @next="nextStep" @prev="prevStep" />
    </div>
    <div class="footer">
      <div class="footer-left">
        <el-button 
          size="small" 
          @click="prevStep"
          :disabled="currentStepIndex === 0"
        >
          {{ t('common.pre') }}
        </el-button>
      </div>
      <div class="footer-right">
        <el-button 
          v-if="currentStepIndex < steps.length - 1"
          type="primary" 
          size="small"
          @click="nextStep"
        >
          {{ t('common.next') }}
        </el-button>
        <el-button 
          v-else
          type="primary" 
          size="small"
          @click="startInstall"
          :loading="isInstalling"
        >
          {{ t('install.start_install') }}
        </el-button>
        <el-button size="small" @click="closeApp">
          {{ t('common.cancel') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconX } from '@computing/opendesign-icons'
import Welcome from './steps/Welcome.vue'
import UserSetup from './steps/UserSetup.vue'
import DiskPartition from './steps/DiskPartition.vue'
import InstallProgress from './steps/InstallProgress.vue'
import { installService } from '@/services/InstallService'

const { t } = useI18n()

const steps = [
  shallowRef(Welcome),
  shallowRef(UserSetup),
  shallowRef(DiskPartition),
  shallowRef(InstallProgress)
]

const currentStepIndex = ref(0)
const currentStep = computed(() => steps[currentStepIndex.value].value)
const isInstalling = ref(false)

function nextStep() {
  if (currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

async function startInstall() {
  isInstalling.value = true
  try {
    // 执行安装逻辑
    // 这里应该调用installService中的方法
    await new Promise(resolve => setTimeout(resolve, 3000)) // 模拟安装
    currentStepIndex.value++
  } catch (error) {
    console.error('Install failed:', error)
  } finally {
    isInstalling.value = false
  }
}

function closeApp() {
  const ipc = window.electronAPI
  ipc?.closeApp()
}
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  position: relative;
}

.nav {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: absolute;
  top: 0;
  left: 0;
}

.logo {
  height: 24px;
  width: 113px;
}

.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 56px 0 72px;
}

.footer {
  width: 100%;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: absolute;
  bottom: 0;
  left: 0;

  &-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
