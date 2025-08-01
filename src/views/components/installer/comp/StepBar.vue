<template>
  <div class="step-bar">
    <div class="step-part">
      <div class="step-num">
        <StepNumberSvg class="step-svg" step-num="1" :fill="colorList[0]" />
      </div>
      <div class="step-text" :style="{color: colorList[0]}">{{ t('install.basic_setup') }}</div>
      <div class="step-line" :style="{backgroundColor: colorList[0]}" />
    </div>
    <div class="step-part">
      <div class="step-num">
        <StepNumberSvg class="step-svg" step-num="2" :fill="colorList[1]" />
      </div>
      <div class="step-text" :style="{color: colorList[1]}">{{ t('install.disk_setup') }}</div>
      <div class="step-line" :style="{backgroundColor: colorList[1]}" />
    </div>
    <div class="step-part">
      <div class="step-num">
        <StepNumberSvg class="step-svg" step-num="3" :fill="colorList[2]" />
      </div>
      <div class="step-text" :style="{color: colorList[2]}">{{ t('install.install') }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n'
import StepNumberSvg from "@/views/components/svg/StepNumberSvg.vue";

const props = defineProps<{
  stepNum: number;
}>();

const { t } = useI18n()

const colorList = computed(
  () => [0, 1, 2].map(v => (props.stepNum > v ? '#0077ff' : '#8d98aa'))
);
</script>

<style scoped lang="scss">
.step-bar {
  width: 100%;
  height: 40px;
  padding: 8px;
  background-color: #f4f6fa;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.step-part {
  width: 33%;
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.step-num {
  width: 24px;
  height: 24px;
}
.step-svg {
  height: 100%;
}
.step-text {
  padding-left: 4px;
  font-size: 16px;
  line-height: 22px;
}
.step-line {
  margin: 0 4px;
  height: 2px;
  flex-grow: 1;
}
</style>
