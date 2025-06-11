<template>
<div class="wrapper">
  <div class="nav">
    <img class="logo" src="@/assets/logo_s.svg" alt="logo_s">
    <div class="close">
      <el-icon size="16" color="#8d98aa" style="cursor: pointer;" @click.stop="closeApp">
        <IconX />
      </el-icon>
    </div>
  </div>
  <div class="container">
    <Welcome />
  </div>
  <div class="footer">
    <div class="footer-left">&nbsp;</div>
    <div class="footer-right">
      <el-button type="primary" size="small">{{ t('common.pre') }}</el-button>
      <el-button type="primary" size="small">{{ t('common.next') }}</el-button>
      <el-button size="small">{{ t('common.cancel') }}</el-button>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { IconX } from '@computing/opendesign-icons'
import Welcome from '@/views/components/installer/steps/Welcome.vue'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

function closeApp() {
  const ipc = window['electronAPI'];
  ipc?.closeApp();
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
  //padding: 56px 0 72px;
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
