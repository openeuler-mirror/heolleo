import { createRouter, createWebHashHistory } from 'vue-router'
import LanguageSelect from '../views/LanguageSelect.vue'
import TimezoneSelect from '../views/TimezoneSelect.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: LanguageSelect },
    { path: '/timezone', component: TimezoneSelect }
  ]
})

export default router