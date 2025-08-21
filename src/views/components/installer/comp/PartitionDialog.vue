<template>
  <el-dialog
    class="partition-dialog-unscoped" v-model="showDialog" :title="titleInfo"
    align-center destroy-on-close :close-on-click-modal="false" :close-on-press-escape="false"
    :before-close="beforeDialogClose"
  >
    <div class="code-change-box">
      <div class="code-change-form">
        <el-form
          ref="ruleFormRef" :model="pForm" :rules="rules" label-width="120px" label-position="right"
        >
          <el-form-item :label="$t('install.size')" prop="size">
            <el-input
              v-model.number="pForm.size" :min="0" :max="pForm.maxSize"
              type="number" style="width: 240px"
            >
              <template #append>MiB</template>
            </el-input>
            <div class="format-warning">{{ $t('install.size_range_tip') }} 0~{{ pForm.maxSize }}</div>
          </el-form-item>
          <el-form-item :label="$t('common.content')" prop="format" v-if="isEdit">
            <el-radio-group v-model="pForm.format">
              <el-radio :value="false">{{ $t('common.save') }}</el-radio>
              <el-radio :value="true">{{ $t('common.format') }}</el-radio>
            </el-radio-group>
            <div class="format-warning">{{ $t('install.format_warning') }}</div>
          </el-form-item>
          <el-form-item :label="$t('install.filesystem')" prop="fsType">
            <el-select v-model="pForm.fsType">
              <el-option
                v-for="item in FS_TYPES"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('install.mount_point')" prop="mount">
            <el-select v-model="pForm.mount" placeholder="无挂载点">
              <el-option :label="$t('common.blank')" value="" />
              <el-option
                v-for="item in MOUNT_POINTS"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('install.fs_label')" prop="fsLabel">
            <el-input v-model="pForm.fsLabel" />
          </el-form-item>
          <el-form-item :label="$t('install.label')" prop="label">
            <el-checkbox-group v-model="pForm.label">
              <el-checkbox value="bios-grub">bios-grub</el-checkbox>
              <el-checkbox value="boot">boot</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <div class="code-change-footer">
        <el-button type="primary" @click="onConfirm" :loading="loading">
          {{ $t('common.ok') }}
        </el-button>
        <el-button @click="beforeDialogClose(() => {showDialog = false})" :disabled="loading">
          {{ $t('common.cancel') }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PartInfo } from '@/utils/constant.ts'
import { formatSize } from '@/utils/utils.ts'

const FS_TYPES = ['ext3', 'ext4', 'fat16', 'fat32']
const MOUNT_POINTS = [
  '/',
  '/boot',
  '/boot/efi',
  '/home',
  '/opt',
  '/srv',
  '/usr',
  '/var'
]

const {t} = useI18n();

const emit = defineEmits(['confirm'])
const showDialog = ref(false);
const loading = ref(false);
const ruleFormRef = ref();

const rowInfo = ref<PartInfo>()
const isEdit = ref(false);

const pForm = reactive({
  size: 0,
  maxSize: 0,
  fsType: 'ext4',
  mount: '',
  format: false,
  fsLabel: '',
  label: []
});
const rules = computed(() => ({
  size: [
    {
      validator: (rule, value, callback) => {
        if (value > pForm.maxSize) {
          callback(new Error(t('install.size_too_large_tip')));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  fsType: [
    { required: true, message: t('install.error_fs_type_required'), trigger: 'change' }
  ]
}));

async function onConfirm() {
  if (loading.value || !rowInfo.value) {
    return;
  }
  if (!ruleFormRef.value) {
    return;
  }
  if (!await ruleFormRef.value.validate().catch(() => false)) {
    return;
  }
  loading.value = true;
  
  // 传递格式化选项
  const shouldFormat = isEdit.value && pForm.format;
  
  const updatedPartition = {
    ...rowInfo.value,
    size: Math.round(pForm.size * 1048576).toString(), // 确保是整数
    fs_type: pForm.fsType,
    type: 'primary',
    loadPoint: pForm.mount,
    label: pForm.fsLabel,
  };
  if (!isEdit.value) {
    updatedPartition.uuid = `new-${Date.now()}`;
    updatedPartition.tag = t('install.new_partition');
  }
  emit('confirm', updatedPartition, isEdit.value, rowInfo.value.uuid, shouldFormat);
  loading.value = false;
  ruleFormRef.value?.resetFields();
  showDialog.value = false;
}

function beforeDialogClose(done: () => void) {
  if (loading.value) {
    return;
  }
  ruleFormRef.value?.resetFields();
  done();
}

const titleInfo = computed(() => {
  let { tag, size } = rowInfo.value || {}
  tag = tag || ''
  if (!size) {
    return tag
  }
  return `${tag} (${formatSize(Number(size), true)})`
})

const openDialog = (row: PartInfo, edit = false, availableSize: number) => {
  rowInfo.value = row;
  isEdit.value = edit;
  const maxSize = Number((Number(availableSize) / 1048576).toFixed(0));
  pForm.maxSize = maxSize;
  if (edit) {
    pForm.size = Number((Number(row.size) / 1048576).toFixed(0));
    pForm.fsType = row.fs_type || 'ext4'
    pForm.mount = row.loadPoint
    pForm.format = false
    pForm.fsLabel = row.label || ''
  } else {
    pForm.size = maxSize
    pForm.fsType = 'ext4'
    pForm.mount = ''
    pForm.format = false
    pForm.fsLabel = ''
  }
  showDialog.value = true;
};
defineExpose({
  openDialog
});
</script>

<style lang="scss">
@import "@/style/vars.scss";

.partition-dialog-unscoped {
  width: 560px;
  flex-shrink: 0;

  .el-dialog__header {
    padding: 8px 16px;
    margin-right: 0;
    background-color: #f7f7f7;
    border-bottom: 1px solid #ebeef5;
    .el-dialog__title {
      font-size: 14px;
      font-weight: bold;
    }
    .el-dialog__headerbtn {
      top: 12px;
    }
  }

  .el-dialog__body {
    padding: 0 16px;
  }
}
</style>
<style scoped lang="scss">
@import "@/style/vars.scss";

.code-change-box {
  @extend %common-dialog-content;
  height: 360px;
  padding-top: 24px;
}

.code-change-footer {
  @extend %common-dialog-footer;
  justify-content: flex-end;
  padding-bottom: 16px;

  .el-button {
    @extend %common-dialog-footer-el-button;
  }
}

.code-change-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.code-change-form :deep(.el-form-item__label) {
  padding: 0;
  line-height: 32px;
}
.format-warning {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
}
</style>
