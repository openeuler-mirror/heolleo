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
            <img :src="`./slides/slide${idx}.png`" style="width: 100%; height: 100%; object-fit: cover;" />
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
          :show-text="false"
          :status="installStatus === 'failed' ? 'exception' : undefined"
        />
        <div class="step-info">
          <div class="step-name">{{ currentStepName }}</div>
        </div>
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
import { computed, inject, ref, onMounted, reactive, nextTick } from 'vue'
import { INSTALL_INFO_KEY, InstallInfo } from '@/utils/constant.ts'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import { IconFileText } from '@computing/opendesign-icons'

const emit = defineEmits(['finish', 'failed'])

const { t } = useI18n()

// 安装流程标准步骤序列，与 eulerinstall 安装器输出的 >>>STEP_START:<key> 标记一一对应。
// 顺序必须与安装器实际执行顺序一致；未启用的条件步骤（如加密、LVM 等）不会被标记，
// 进度位置会按标准序列跳转，但不会出现超前或延迟。
const STEP_KEYS: string[] = [
  'prepare_env', // 检查系统环境
  'format_disk', // 创建分区表并格式化磁盘
  'lvm_setup', // 配置 LVM 逻辑卷（可选）
  'init_install', // 初始化安装流程
  'mount_partitions', // 挂载目标磁盘分区
  'check_env', // 校验安装环境
  'gen_keys', // 生成加密密钥（可选）
  'set_mirrors_host', // 配置软件源镜像（可选）
  'mount_bind', // 挂载系统虚拟文件系统
  'prepare_selinux', // 配置 SELinux 安全策略
  'mount_system_img', // 挂载系统镜像
  'copy_system', // 复制系统文件（rsync）
  'trim_ssd', // 启用 SSD 定期清理
  'set_hostname', // 设置主机名
  'set_locale', // 配置系统语言环境
  'set_mirrors_target', // 更新目标系统软件源（可选）
  'install_bootloader', // 安装引导程序
  'config_network', // 配置网络（可选）
  'create_users', // 创建用户
  'auth_setup', // 配置用户认证（可选）
  'install_packages', // 安装额外软件包（可选）
  'install_apps', // 安装应用程序（可选）
  'install_profile', // 安装桌面环境（可选）
  'set_timezone', // 设置系统时区（可选）
  'enable_ntp', // 启用时间同步（可选）
  'enable_services', // 启用系统服务（可选）
  'gen_fstab', // 生成文件系统挂载表
  'rebuild_initramfs', // 重建 initramfs
  'update_grub', // 更新引导配置
  'cleanup', // 清理安装环境
  'finish' // 安装完成
]

// eulerinstall 安装器输出的步骤标记，格式：>>>STEP_START:<key>
const STEP_START_RE = /^>>>STEP_START:([A-Za-z0-9_-]+)$/

const installInfo = inject<InstallInfo>(INSTALL_INFO_KEY, reactive({} as InstallInfo))
const error = ref('')
const installStatus = ref<'installing' | 'success' | 'failed'>('installing')
const showLog = ref(false)
const logs = ref<string[]>([])
const logViewer = ref<HTMLElement | null>(null)

// 当前执行步骤在标准步骤序列中的下标（从 0 开始）
const currentStepIndex = ref(0)
const totalSteps = STEP_KEYS.length

// 保留视觉进度指示：以当前步骤在总步骤中的位置换算进度百分比
// （如处于第 3/8 步时显示约 37%），不再直接展示百分比数值。
const progress = computed(() => Math.round(((currentStepIndex.value + 1) / totalSteps) * 100))

// 当前正在执行的具体步骤名称
const currentStepName = computed(() => t(`install.step.${STEP_KEYS[currentStepIndex.value]}`))

// 解析安装日志中的步骤标记；返回 true 表示该行应进入日志视图，false 表示应过滤掉
function handleLogLine(line: string): boolean {
  const match = line.match(STEP_START_RE)
  if (match) {
    const key = match[1]
    const index = STEP_KEYS.indexOf(key)
    // 仅允许前进：忽略未知步骤与乱序/重复的旧步骤，保证显示与实际进程同步
    if (index !== -1 && index >= currentStepIndex.value) {
      currentStepIndex.value = index
    }
    return false
  }
  return true
}

async function install() {
  let finished = false

  const listener = (event, log: string) => {
    for (const line of String(log).split(/\r?\n/)) {
      if (!line) continue
      if (handleLogLine(line)) {
        logs.value.push(line)
      }
    }
    nextTick(() => {
      if (logViewer.value) {
        logViewer.value.scrollTop = logViewer.value.scrollHeight
      }
    })
    if (log.includes('Installation completed without any errors')) {
      completeInstall()
    }
  }

  function completeInstall() {
    if (finished) return
    finished = true
    currentStepIndex.value = totalSteps - 1
    installStatus.value = 'success'
    emit('finish')
    window.electron.ipcRenderer.removeListener('install-log', listener)
  }

  window.electron.ipcRenderer.on('install-log', listener)

  try {
    const { success } = await window.electron.ipcRenderer.invoke('install-system', {
      configPath: installInfo.configPath,
      userConfigPath: installInfo.userConfigPath
    })
    if (!success) {
      throw new Error(t('install.install_failed'))
    }
    // 进程正常退出时兜底标记安装完成（防止完成日志因输出差异而漏判）
    completeInstall()
  } catch (err: any) {
    error.value = (err as Error).message
    installStatus.value = 'failed'
    emit('failed')
    console.error(t('install.install_failed') + ':', err)
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
.step-info {
  min-width: 220px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  .step-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2d3d;
    line-height: 1.4;
    white-space: nowrap;
  }
}
.log-icon {
  cursor: pointer;
  color: #409eff;
  &:hover {
    color: #79bbff;
  }
}
.error-message {
  margin-top: 12px;
  color: #f56c6c;
  font-size: 13px;
  text-align: left;
}
</style>
