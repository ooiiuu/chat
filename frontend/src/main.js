// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'

// 全局axios配置
axios.defaults.withCredentials = true
axios.defaults.baseURL = 'http://localhost:5000'

// 创建axios响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // 直接使用导入的 store 和 router 实例
      store.commit('auth/SET_USER', null)
      router.push('/')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(router)
app.use(store)

app.mount('#app')