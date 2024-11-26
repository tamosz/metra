import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueChartkick from 'vue-chartkick'
import 'chartkick/chart.js'

const app = createApp(App)

app.use(router)
app.use(VueChartkick)
app.mount('#app')
