import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Chat from './components/Chat.vue'
import ImageEditor from './components/ImageEditor.vue'
import store from './store'

const routes = [
    { path: '/', name: 'Chat', component: Chat },
    { path: '/edit/:imageSrc', name: 'ImageEditor', component: ImageEditor, props: true }
  ]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')
