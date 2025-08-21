<template>
  <div class="config-preview">
    <div class="config-preview-hr" />
    <div class="config-preview-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="config-preview-content">
      <div class="config-header">
        <h3>{{ t('install.configPreview') }}</h3>
        <p>{{ t('install.configPreviewDesc') }}</p>
      </div>
      <div class="config-json">
        <el-input
          v-model="configJson"
          type="textarea"
          :rows="15"
          readonly
          :placeholder="t('install.configLoading')"
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import { INSTALL_INFO_KEY, InstallInfo } from '@/utils/constant.ts'
import { ConfigGenerator } from '@/services/ConfigGenerator.ts'

const { t, locale } = useI18n()

const installInfo = inject(INSTALL_INFO_KEY, reactive({} as InstallInfo))

const configJson = computed(() => {
  try {
    const config = ConfigGenerator.generateConfig(installInfo, locale.value)
    return JSON.stringify(config, null, 2)
  } catch (error) {
    console.error('Failed to generate config:', error)
    return JSON.stringify({ error: 'Failed to generate configuration' }, null, 2)
  }
})



async function checkValid() {
  return true
}

// 暴露需要的方法
defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.config-preview {
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
    width: calc(100% - 32px);
    max-width: 800px;
  }
}

.config-header {
  margin-bottom: 20px;
  text-align: center;

  h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.config-json {
  margin-bottom: 20px;

  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
  }
}


</style> 