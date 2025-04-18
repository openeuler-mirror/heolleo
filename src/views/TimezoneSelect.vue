<template>
  <div class="container">
    <h1 class="logo">
      <span class="round">h</span>
      <span class="round blue">e</span>
      <span class="round">o</span>
      <span class="round">l</span>
      <span class="round">l</span>
      <span class="round">e</span>
      <span class="round blue">o</span>
    </h1>
    <div class="timezone-select">
      <h2>请选择时区</h2>
      <select v-model="selectedTimezone">
        <option value="UTC+8">UTC+8 (北京时间)</option>
        <option value="UTC">UTC</option>
        <option value="UTC-5">UTC-5 (纽约时间)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const selectedTimezone = ref('UTC+8')
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.logo {
  font-size: 4rem;
  margin-bottom: 2rem;
  letter-spacing: 2px;
}

.round {
  font-family: 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
  font-weight: 500;
}

.blue {
  color: #4285f4;
}

.timezone-select {
  text-align: center;
  margin-top: 2rem;
}

select {
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border-radius: 25px;
  border: 1px solid #ddd;
  min-width: 250px;
  background-color: white;
}
</style>