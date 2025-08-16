<template>
  <div class="basic-setup">
    <div class="basic-setup-hr" />
    <div class="basic-setup-bar">
      <StepBar :step-num="1" />
    </div>
    <div class="basic-setup-form">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" label-position="left">
        <el-form-item prop="area" :label="t('install.area')">
          <el-select v-model="form.area" :placeholder="t('install.areaPlaceholder')" @change="form.location = ''">
            <el-option
              v-for="item in areaList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="location" :label="t('install.location')">
          <el-select v-model="form.location" filterable :placeholder="t('install.locationPlaceholder')">
            <el-option
              v-for="item in locationList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="basic-setup-result" v-show="form.location">
        {{ t('install.timezoneSetting', [form.location]) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, Reactive, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import { INSTALL_INFO_KEY, InstallInfo } from '@/utils/constant'
import { TZ_AREA_KEY_MAP } from '@/utils/timezones'

const { locale, t } = useI18n()

const formRef = ref()
const form = reactive({
  area: '',
  location: ''
})

const rules = reactive({
  area: [
    { required: true, trigger: 'change' }
  ],
  location: [
    { required: true, trigger: 'change' }
  ]
})

const areaList = computed(() => {
  const list = [...TZ_AREA_KEY_MAP.keys()]
  return list.map(k => ({
    label: t(`timezone.area.${k}`),
    value: k
  }))
})

const locationList = computed(() => {
  const areaVal = form.area
  if (!areaVal) {
    return []
  }
  const list = TZ_AREA_KEY_MAP.get(form.area)
  if (!list) {
    return []
  }
  return list.map(k => {
    const locationVal = k.split('/')[1]
    const locationLocale = t(`timezone.${areaVal}.${k.split('/')[1]}`)
    return {
      label: locale.value === 'en' ? locationLocale : `${locationVal} (${locationLocale})`,
      value: k
    }
  })
})


const installInfo = inject(INSTALL_INFO_KEY) as Reactive<InstallInfo>
async function checkValid() {
  if (!await formRef.value.validate().catch(() => false)) {
    return false
  }
  installInfo.timezone = form.location
  return true
}

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.basic-setup {
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

  &-form {
    width: calc(100% - 32px);
  }
}

.basic-setup-form {
  :deep(.el-form-item__content) {
    max-width: 320px;
  }
  :deep(.el-select) {
    width: 100%;
  }
}
</style>
