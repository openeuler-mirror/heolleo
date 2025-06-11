import { createApp } from 'vue'
import App from './App.vue'
import i18n from './lang/i18n'
import router from './router'
import './style/normalize.css'
import './style/reset.scss'

const app = createApp(App)
app.use(router)
app.use(i18n as any)
app.mount('#app')
