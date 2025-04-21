<template>
  <div id="app">
    <div class="nav-buttons">
      <button @click="goPrev" :disabled="currentPageIndex === 0">上一页</button>
      <button @click="goNext" :disabled="currentPageIndex === pages.length - 1">下一页</button>
    </div>
    
    <div class="slider-container">
      <transition :name="transitionName">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const pages = ['/', '/timezone']
const currentPageIndex = ref(pages.indexOf(route.path))
const transitionName = ref('slide-next')

watch(() => route.path, (newPath) => {
  const newIndex = pages.indexOf(newPath)
  transitionName.value = newIndex > currentPageIndex.value ? 'slide-next' : 'slide-prev'
  currentPageIndex.value = newIndex
})

const goPrev = () => {
  if (currentPageIndex.value > 0) {
    router.push(pages[currentPageIndex.value - 1])
  }
}

const goNext = () => {
  if (currentPageIndex.value < pages.length - 1) {
    router.push(pages[currentPageIndex.value + 1])
  }
}
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
}

.nav-buttons {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
  z-index: 100;
}

.nav-buttons button {
  padding: 10px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.nav-buttons button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.slider-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.5s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

.slide-next-enter-from {
  transform: translateX(100%);
}

.slide-next-leave-to {
  transform: translateX(-100%);
}

.slide-prev-enter-from {
  transform: translateX(-100%);
}

.slide-prev-leave-to {
  transform: translateX(100%);
}
</style>
