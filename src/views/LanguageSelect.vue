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
    <div class="language-select">
      <h2>请选择语言</h2>
      <button>中文</button>
      <button>English</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面切换由App.vue的幻灯片控制
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

.language-select {
  text-align: center;
  margin-top: 2rem;
}

button {
  margin: 0.5rem;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border-radius: 25px;
  border: none;
  background-color: #4285f4;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background-color: #3367d6;
  transform: scale(1.05);
}
</style>