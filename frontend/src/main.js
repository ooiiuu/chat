import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

// 配置axios
axios.defaults.baseURL = 'http://localhost:5000'
axios.defaults.headers.post['Content-Type'] = 'application/json'

const app = createApp(App)
app.config.globalProperties.$http = axios
app.mount('#app')
