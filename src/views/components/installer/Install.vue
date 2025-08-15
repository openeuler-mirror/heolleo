<template>
  <div class="wrapper">
    <div class="container">
      <KeepAlive>
        <component ref="stepCompRef" :is="currentStep" @next="nextStep" @prev="prevStep" @finish="onInstallFin" @failed="onInstallFailed" />
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
      <div class="footer-right" v-if="currentStepIndex < IDX_INSTALLING">
        <el-button
          size="small"
          @click="prevStep"
          :disabled="currentStepIndex === 0"
        >
          {{ t('common.pre') }}
        </el-button>
        <el-button
          v-if="currentStepIndex === IDX_SHOW_INSTALL"
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
          {{ isInstalling ? '安装中' : (installFailed ? '关闭' : '完成') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, reactive, ref, shallowRef, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconX } from '@computing/opendesign-icons'
import Welcome from './steps/Welcome.vue'
import BasicSetup from './steps/BasicSetup.vue'
import DiskPartition from './steps/DiskPartition.vue'
import DiskPartitionManual from './steps/DiskPartitionManual.vue'
import DiskPartitionInfo from './steps/DiskPartitionInfo.vue'
import ConfigPreview from './steps/ConfigPreview.vue'
import InstallProgress from './steps/InstallProgress.vue'
import { INSTALL_INFO_KEY } from '@/utils/constant.ts'
import { ConfigGenerator } from '@/services/ConfigGenerator.ts'


const { t, locale } = useI18n()

const IDX_DISK_PART = 2
const IDX_SHOW_INSTALL = 5
const IDX_INSTALLING = 6

const steps = [
  shallowRef(Welcome),
  shallowRef(BasicSetup),
  shallowRef(DiskPartition),
  shallowRef(DiskPartitionManual), // 手动分区选了才会进
  shallowRef(DiskPartitionInfo),
  shallowRef(ConfigPreview), // 配置预览
  shallowRef(InstallProgress)
];

const stepCompRef = ref();
const currentStepIndex = ref(0)
const currentStep = computed(() => steps[currentStepIndex.value].value)
const isInstalling = ref(false)
const installFailed = ref(false)

const installInfo = reactive({
  timezone: '',
  disk: '',
  diskSize: 0,
  installType: '',
  partitionType: '',
  partInfo: [],
  partInfoBefore: [],
  useLvm: false,
  sector_size: 512,
  configPath: ''
})
provide(INSTALL_INFO_KEY, installInfo)

async function nextStep() {
  // 确保组件更新完成
  await nextTick()
  
  // 防御性检查：确保组件引用和方法存在
  if (stepCompRef.value && typeof stepCompRef.value.checkValid === 'function') {
    if (!await stepCompRef.value.checkValid()) {
      return
    }
  } else {
    console.warn('Skipping validation for step', currentStepIndex.value)
  }
  
  if (currentStepIndex.value === IDX_DISK_PART && installInfo.partitionType === 'auto') {
    // 自动分区则跳过下一步
    currentStepIndex.value += 2
    return
  }
  
  if (currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++
  }
  
  // 确保组件引用更新
  await nextTick()
}

function prevStep() {
  if (currentStepIndex.value === (IDX_DISK_PART + 2) && installInfo.partitionType === 'auto') {
    // 自动分区则跳过上一步的手动分区
    currentStepIndex.value -= 2
    return
  }
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

async function startInstall() {
  isInstalling.value = true
  try {
    const config = ConfigGenerator.generateConfig(installInfo, locale.value)
    
    // 保存配置文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const configPath = `/tmp/archinstall_config_${timestamp}.json`
    installInfo.configPath = configPath
    
    try {
      await ConfigGenerator.saveConfigToFile(config, configPath)
    } catch (saveError) {
      console.error('Failed to save config file:', saveError)
      // 降级到浏览器下载
      ConfigGenerator.exportConfig(config, `archinstall_config_${timestamp}.json`)
    }
    
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

function onInstallFailed() {
  isInstalling.value = false
  installFailed.value = true
}

function finishInstall() {
  closeApp()
}

function closeApp() {
  const ipc = window.electron?.ipcRenderer
  ipc?.send('close-app')
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
