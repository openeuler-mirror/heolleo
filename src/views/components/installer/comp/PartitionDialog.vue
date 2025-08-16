<template>
  <el-dialog
    class="partition-dialog-unscoped" v-model="showDialog" :title="titleInfo"
    align-center destroy-on-close :close-on-click-modal="false" :close-on-press-escape="false"
    :before-close="beforeDialogClose"
  >
    <div class="code-change-box">
      <div class="code-change-form">
        <el-form
          ref="ruleFormRef" :model="pForm" :rules="rules" label-width="200px" label-position="right"
        >
          <el-form-item :label="$t('install.partitionType')" prop="pType" v-if="!isEdit">
            <el-select v-model="pForm.pType">
              <el-option label="GPT" value="GPT" />
              <el-option label="MBR" value="MBR" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('install.size')" prop="size">
            <el-input
              v-model.number="pForm.size" :min="0"
              type="number" style="width: 240px"
            >
              <template #append>MiB</template>
            </el-input>
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
            <el-select v-model="pForm.mount">
              <el-option :label="$t('common.blank')" value="" />
              <el-option
                v-for="item in MOUNT_POINTS"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.content')" prop="format" v-if="isEdit">
            <el-radio-group v-model="pForm.format">
              <el-radio :value="false">{{ $t('common.save') }}</el-radio>
              <el-radio :value="true">{{ $t('common.format') }}</el-radio>
            </el-radio-group>
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
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PartInfo } from '@/utils/constant'
import { formatSize } from '@/utils/utils'

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

const showDialog = ref(false);
const loading = ref(false);
const ruleFormRef = ref();

const rowInfo = ref<PartInfo>()
const isEdit = ref(false);

const pForm = reactive({
  pType: 'GPT',
  size: 0,
  fsType: '',
  mount: '',
  format: false
});
const rules = computed(() => ({
  // pType: [
  //   {required: true, message: t('login.pwdRequire'), trigger: 'blur'}
  // ]
}));

async function onConfirm() {
  if (loading.value) {
    return;
  }
  if (!ruleFormRef.value) {
    return;
  }
  if (!await ruleFormRef.value.validate().catch(() => false)) {
    return;
  }
  loading.value = true;
  // todo: 保存信息
  loading.value = false;
  // todo: 若失败则弹窗并return
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
  return `${tag} (${formatSize(size, true)})`
})

const openDialog = (row: PartInfo, edit = false) => {
  rowInfo.value = row;
  isEdit.value = edit;
  if (edit) {
    pForm.size = Number(row.size / 1048576).toFixed(0)
    pForm.fsType = row.type
    pForm.mount = row.loadPoint
    pForm.format = false
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
  width: 436px;
  flex-shrink: 0;

  .el-dialog__header {
    @extend %common-dialog-header;

    .el-dialog__title {
      @extend %common-dialog-title;
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
  height: 248px;
  padding-top: 24px;
}

.code-change-footer {
  @extend %common-dialog-footer;

  .el-button {
    @extend %common-dialog-footer-el-button;
  }
}

.code-change-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.code-change-form :deep(.el-form-item__label) {
  padding: 0;
  line-height: 32px;
}

.pwd-suffix {
  width: 18px;
  cursor: pointer;
}
</style>
