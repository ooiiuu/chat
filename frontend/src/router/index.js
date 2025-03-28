// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Chat from '../components/Chat.vue'
import ImageEditor from '../components/ImageEditor.vue'
import axios from 'axios'
import { useStore } from 'vuex'

const routes = [
    { 
        path: '/',
        name: 'Home',
        component: () => import('../views/HomeView.vue')
    },
    { 
        path: '/chat',
        name: 'Chat',
        component: Chat,
        meta: { requiresAuth: true }
    },
    { 
        path: '/edit/:imageSrc',
        name: 'ImageEditor',
        component: ImageEditor,
        props: true,
        meta: { requiresAuth: true }
    },
    {
        path: '/conversations',
        name: 'ConversationHistory',
        component: () => import('../views/ConversationHistory.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/conversations/:conversationId',
        name: 'ConversationView',
        component: Chat,  // 重用Chat组件
        props: true,      // 传递路由参数作为props
        meta: { requiresAuth: true }
    },
    {
        path: '/search',
        name: 'SearchHistory',
        component: () => import('../views/SearchHistory.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫配置保持不变
router.beforeEach(async (to, from, next) => {
    const store = useStore()
    
    // 检查页面是否需要认证
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // 先检查Vuex中的认证状态
      if (store.getters['auth/isAuthenticated']) {
        // 已登录，验证会话有效性
        try {
          await axios.get('/dashboard')
          next() // 会话有效
        } catch (error) {
          // 会话已过期，清除本地状态
          store.dispatch('auth/logout')
          next({
            path: '/',
            query: { redirect: to.fullPath } // 记住原本要去的页面
          })
        }
      } else {
        // 未登录，重定向到登录页
        next({
          path: '/',
          query: { redirect: to.fullPath } // 记住原本要去的页面
        })
      }
    } else {
      // 不需要认证的页面
      if (to.path === '/' && store.getters['auth/isAuthenticated']) {
        // 如果已登录但访问登录页，重定向到首页
        next('/chat')
      } else {
        next() // 正常导航
      }
    }
  })

export default router