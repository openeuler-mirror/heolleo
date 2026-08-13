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
              type="number" style="width: 240px" :disabled="isEdit && !pForm.format"
            >
              <template #append>MiB</template>
            </el-input>
            <div class="format-warning" v-if="!isEdit || pForm.format">{{ $t('install.size_range_tip', { max: pForm.maxSize }) }}</div>
          </el-form-item>
          <el-form-item :label="$t('common.content')" prop="format" v-if="isEdit">
            <el-radio-group v-model="pForm.format">
              <el-radio :value="false">{{ $t('common.save') }}</el-radio>
              <el-radio :value="true">{{ $t('common.format') }}</el-radio>
            </el-radio-group>
            <div class="format-warning">{{ $t('install.format_warning') }}</div>
          </el-form-item>
          <el-form-item :label="$t('install.filesystem')" prop="fsType">
            <el-select v-model="pForm.fsType" :disabled="isEdit && !pForm.format">
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
            <el-input v-model="pForm.fsLabel" :disabled="isEdit && !pForm.format" />
          </el-form-item>
          <el-form-item :label="$t('install.label')" prop="label">
            <el-checkbox-group v-model="pForm.label" :disabled="isEdit && !pForm.format">
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
import { computed, reactive, ref, defineEmits, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PartInfo } from '@/utils/constant.ts'
import { formatSize } from '@/utils/utils.ts'
import { DISK_LAYOUT } from '@/utils/constant.ts'

const FS_TYPES = ['ext3', 'ext4', 'fat16', 'fat32', 'btrfs', 'xfs']
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

const MIB = DISK_LAYOUT.MIB

const {t} = useI18n();

const emit = defineEmits(['confirm'])
const showDialog = ref(false);
const loading = ref(false);
const ruleFormRef = ref();

const rowInfo = ref<PartInfo>()
const isEdit = ref(false);
const originalPartitionData = ref<{
  size: number;
  fsType: string;
  fsLabel: string;
  label: string[];
} | null>(null);

const pForm = reactive({
  size: 0,
  maxSize: 0,
  fsType: 'ext4',
  mount: '',
  format: false,
  fsLabel: '',
  label: [] as string[]
});
const rules = computed(() => ({
  size: [
    { required: true, message: t('install.size_required_tip'), trigger: 'blur' },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (!value || value < 1) {
          callback(new Error(t('install.size_min_tip')));
        } else if (value > pForm.maxSize) {
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
  const originalStart = Number(rowInfo.value.start) || DISK_LAYOUT.GPT_START_OFFSET;

  // pForm.label 是复选框组，实际是分区标志（flags），如 boot/bios-grub
  const flagsFromForm: string[] = [...pForm.label];

  let updatedPartition: PartInfo;
  if (isEdit.value && !shouldFormat) {
    // 保留模式：size/start/fs_type 保持不变，仅可改挂载点
    updatedPartition = {
      ...rowInfo.value,
      size: rowInfo.value.size,
      fs_type: rowInfo.value.fs_type,
      loadPoint: pForm.mount,
      flags: rowInfo.value.flags,
      start: originalStart,
    };
  } else {
    // 格式化模式或新建模式：使用表单中的值
    // pForm.size 单位为 MiB，转换为字节字符串（1MiB 对齐）
    const sizeInBytes = Math.floor(pForm.size) * MIB;
    updatedPartition = {
      ...rowInfo.value,
      uuid: `new-${Date.now()}`,
      tag: t('install.new_partition'),
      size: sizeInBytes.toString(),
      fs_type: pForm.fsType,
      type: 'primary',
      loadPoint: pForm.mount,
      flags: flagsFromForm,
      start: originalStart,
    };
  }
  emit('confirm', updatedPartition, isEdit.value, rowInfo.value.uuid || '', shouldFormat);
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

// 监听格式化选项变化，控制表单字段的禁用状态和数据恢复
watch(() => pForm.format, (newValue, oldValue) => {
  if (isEdit.value) {
    // 当从"格式化"切换到"保留"时，恢复原始分区数据
    if (oldValue === true && newValue === false && originalPartitionData.value) {
      pForm.size = Math.floor(Number(originalPartitionData.value.size) / MIB);
      pForm.fsType = originalPartitionData.value.fsType;
      pForm.fsLabel = originalPartitionData.value.fsLabel;
      // originalPartitionData.label 实际存储的是 flags
      pForm.label = [...originalPartitionData.value.label];
    }

    // 更新表单字段的禁用状态
    if (ruleFormRef.value) {
      ruleFormRef.value.clearValidate();
    }
  }
}, { immediate: true });

const titleInfo = computed(() => {
  let { tag, size } = rowInfo.value || {}
  tag = tag || ''
  if (!size) {
    return tag
  }
  return `${tag} (${formatSize(Number(size), true)})`
})

/**
 * 打开对话框
 * @param row 目标分区（空闲区域或已有分区）
 * @param edit 是否为编辑模式
 * @param availableSize 可用最大尺寸（字节）：
 *   - 创建模式：空闲区域大小
 *   - 编辑模式：分区当前大小 + 后方相邻空闲区域（仅允许向相邻空闲扩大）
 */
const openDialog = (row: PartInfo, edit = false, availableSize: number) => {
  rowInfo.value = row;
  isEdit.value = edit;

  const maxSizeMiB = Math.floor(availableSize / MIB);
  pForm.maxSize = maxSizeMiB;

  if (edit) {
    // 编辑模式：size 初始化为当前分区大小
    const currentSizeMiB = Math.floor(Number(row.size) / MIB);
    pForm.size = currentSizeMiB;
    pForm.fsType = row.fs_type || 'ext4';
    pForm.mount = row.loadPoint;
    pForm.format = false;
    pForm.fsLabel = row.label || '';
    // pForm.label 是复选框组，对应分区标志（flags）
    pForm.label = [...(row.flags || [])];

    // 保存原始分区数据（用于格式化↔保留切换时恢复）
    originalPartitionData.value = {
      size: row.size,
      fsType: row.fs_type || 'ext4',
      fsLabel: row.label || '',
      label: [...(row.flags || [])]
    };
  } else {
    // 创建模式：size 默认为最大可用大小
    pForm.size = maxSizeMiB;
    pForm.fsType = 'ext4';
    pForm.mount = '';
    pForm.format = false;
    pForm.fsLabel = '';
    pForm.label = [];
    originalPartitionData.value = null;
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
  margin-left: 15px;
}
</style>
