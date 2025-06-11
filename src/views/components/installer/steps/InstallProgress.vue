<template>
  <div class="install-progress">
    <h2>{{ t('install.installation_progress') }}</h2>
    
    <el-steps :active="activeStep" finish-status="success" align-center>
      <el-step :title="t('install.user_setup')" />
      <el-step :title="t('install.disk_partition')" />
      <el-step :title="t('install.installing')" />
      <el-step :title="t('install.complete')" />
    </el-steps>
    
    <el-progress
      :percentage="progress"
      :status="installStatus"
      :stroke-width="20"
      style="margin-top: 30px"
    />
    
    <div class="log-container">
      <pre>{{ log }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { installService } from '@/services/InstallService'

const { t } = useI18n()

const progress = computed(() => installService.getProgress().value)
const installStatus = computed(() => {
  const status = installService.getStatus().value
  return status === 'error' ? 'exception' : ''
})

const activeStep = computed(() => {
  const p = progress.value
  if (p < 20) return 0
  if (p < 40) return 1
  if (p < 100) return 2
  return 3
})

const log = ref('')
</script>

<style scoped>
.install-progress {
  padding: 20px;
  text-align: center;
}

h2 {
  margin-bottom: 30px;
  color: #333;
}

.log-container {
  margin-top: 30px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  text-align: left;
}
</style>