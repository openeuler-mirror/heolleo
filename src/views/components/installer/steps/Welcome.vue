<template>
  <div class="wel-wrap">
    <div class="wel-slogan">{{ t('install.welcome') }}</div>
    <img class="wel-logo" src="@/assets/logo.svg" alt="logo" />
    <el-form ref="langFormRef" :model="form" :rules="rules" label-width="auto">
      <el-form-item :label="t('install.chooseLang')" prop="lang">
        <el-select v-model="form.lang" @change="changeLang">
          <el-option v-for="item in LANG_LIST" :key="item.val" :label="item.label" :value="item.val" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { DEFAULT_LANG, LANG_MAP } from '@/lang';

const LANG_LIST = [...LANG_MAP.values()];

const { t, locale } = useI18n();

const form = reactive({
  lang: DEFAULT_LANG
});

const rules = reactive({
  lang: [
    { required: true, trigger: 'change' }
  ]
});

function changeLang(lang: string) {
  locale.value = lang;
}

defineExpose({
  checkValid: () => true
})
</script>

<style scoped lang="scss">
.wel-wrap {
  width: 100%;
  height: 100%;
  padding: 108px 0 72px;
  border-top: 1px solid #dfe5ef;
  background: url("@/assets/img/welcome.png") bottom;
  background-size: cover;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.wel-slogan {
  font-size: 26px;
  font-weight: bold;
  line-height: 30px;
  color: #4e5865;
}

.wel-logo {
  margin-top: 72px;
  margin-bottom: 80px;
  width: 480px;
}
</style>
