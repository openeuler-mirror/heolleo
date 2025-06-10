<template>
  <div class="frame">
    <Install />
  </div>
</template>

<script setup lang="ts">
import Install from '@/views/components/installer/Install.vue';
</script>

<style scoped lang="scss">
.frame {
  width: 768px;
  height: 568px;
  padding: 0;
  overflow: hidden;
  background-color: #ffffff;
  position: absolute;
  top: 16px;
  left: 16px;
  border-radius: 12px;
  box-shadow: 0 0 16px 4px rgba(0, 0, 0, 0.15);
}
</style>

<style lang="scss">
#app {
  overflow: hidden;
  position: relative;
}
</style>
