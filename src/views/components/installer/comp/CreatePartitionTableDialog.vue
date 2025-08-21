<template>
  <el-dialog
    v-model="showDialog"
    :title="t('install.create_partition_table')"
    width="500px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="dialog-content">
      <p>{{ t('install.create_partition_table_confirm', { disk: diskName }) }}</p>
      <p>{{ t('install.create_partition_table_warning') }}</p>
      <div class="partition-type-selector">
        <p>{{ t('install.partition_type_select_label') }}</p>
        <el-radio-group v-model="partitionType">
          <el-radio label="mbr">{{ t('install.mbr') }}</el-radio>
          <el-radio label="gpt">{{ t('install.gpt') }}</el-radio>
        </el-radio-group>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ t('common.ok') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const showDialog = ref(false)
const diskName = ref('')
const partitionType = ref('gpt')

const emit = defineEmits(['confirm'])

const openDialog = (disk: string) => {
  diskName.value = disk
  partitionType.value = 'gpt'
  showDialog.value = true
}

const handleConfirm = () => {
  emit('confirm', partitionType.value)
  showDialog.value = false
}

defineExpose({
  openDialog
})
</script>

<style scoped lang="scss">
.dialog-content {
  p {
    margin-bottom: 16px;
    line-height: 1.5;
  }
}
.partition-type-selector {
  margin-top: 24px;
  p {
    margin-bottom: 8px;
  }
}
</style>