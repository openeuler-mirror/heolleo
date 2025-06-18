<template>
  <div class="install-progress">
    <div class="install-progress-hr" />
    <div class="install-progress-bar">
      <StepBar :step-num="3" />
    </div>
    <div class="install-progress-content">
      <el-carousel :interval="4000" arrow="always" indicator-position="none">
        <el-carousel-item v-for="idx in 3" :key="idx">
          <el-empty :description="`pic-${idx}`"></el-empty>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div class="install-progress-percent">
      <el-progress class="progress-comp" :percentage="progress" :stroke-width="8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'

const emit = defineEmits(['finish'])

const { t } = useI18n()

const progress = ref(0)

function reqProgress() {
  progress.value += Math.floor(Math.random() * 20)
  if (progress.value >= 100) {
    progress.value = 100
    emit('finish')
  } else {
    setTimeout(reqProgress, 500)
  }
}

onMounted(() => {
  reqProgress()
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
  }

  &-percent {
    width: calc(100% - 64px);
    margin-top: 24px;
  }
}
:deep(.progress-comp) {
  .el-progress__text {
    margin-left: 0;
    text-align: right;
  }
}
</style>
