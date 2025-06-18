<template>
  <div class="wrapper">
    <div class="container">
      <KeepAlive>
        <component ref="stepCompRef" :is="currentStep" @next="nextStep" @prev="prevStep" @finish="onInstallFin" />
      </KeepAlive>
    </div>
    <div class="nav">
      <img class="logo" src="@/assets/logo_s.svg" alt="logo_s">
      <div class="close">
        <el-icon size="16" color="#8d98aa" style="cursor: pointer;" @click.stop="closeApp" v-show="currentStepIndex < 4">
          <IconX />
        </el-icon>
      </div>
    </div>
    <div class="footer">
      <div class="footer-left" />
      <div class="footer-right" v-if="currentStepIndex < 4">
        <el-button
          size="small"
          @click="prevStep"
          :disabled="currentStepIndex === 0"
        >
          {{ t('common.pre') }}
        </el-button>
        <el-button
          v-if="currentStepIndex === 3"
          type="primary"
          size="small"
          @click="startInstall"
          :loading="isInstalling"
        >
          {{ t('install.start_install') }}
        </el-button>
        <el-button
          v-else
          type="primary"
          size="small"
          @click="nextStep"
        >
          {{ t('common.next') }}
        </el-button>
        <el-button size="small" @click="closeApp">
          {{ t('common.cancel') }}
        </el-button>
      </div>
      <div class="footer-right" v-else>
        <el-button
          type="primary"
          size="small"
          :loading="isInstalling"
          @click="finishInstall"
        >
          {{ isInstalling ? '安装中' : '完成' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconX } from '@computing/opendesign-icons'
import Welcome from './steps/Welcome.vue'
import UserSetup from './steps/UserSetup.vue'
import DiskPartition from './steps/DiskPartition.vue'
import DiskPartitionInfo from './steps/DiskPartitionInfo.vue';
import InstallProgress from './steps/InstallProgress.vue'
import { INSTALL_INFO_KEY } from '@/utils/constant'

const { t } = useI18n()

const steps = [
  shallowRef(Welcome),
  shallowRef(UserSetup),
  shallowRef(DiskPartition),
  shallowRef(DiskPartitionInfo),
  shallowRef(InstallProgress)
];

const stepCompRef = ref();
const currentStepIndex = ref(0)
const currentStep = computed(() => steps[currentStepIndex.value].value)
const isInstalling = ref(false)

const installInfo = reactive({
  username: '',
  password: '',
  adminPassword: '',
  disk: '',
  installType: '',
  partitionType: ''
})
provide(INSTALL_INFO_KEY, installInfo)

async function nextStep() {
  if (!await stepCompRef.value?.checkValid()) {
    return
  }
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
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟安装
    // 调用开始安装成功
    currentStepIndex.value++
  } catch (error) {
    // 这里只放开始安装调用的失败，安装途中的失败在组件内处理
    console.error('Install failed:', error)
    isInstalling.value = false
  }
}

function onInstallFin() {
  isInstalling.value = false
}

function finishInstall() {
  closeApp()
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
