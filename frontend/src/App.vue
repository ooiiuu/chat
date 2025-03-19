<template>
  <div id="app">
    <header v-if="isAuthenticated">
      <div class="header-container">
        <h1>AI 助手</h1>
        <nav class="main-nav">
          <router-link to="/chat" class="nav-link">聊天</router-link>
          <router-link to="/templates" class="nav-link">海报模板</router-link>
          <a href="#" @click.prevent="handleLogout" class="nav-link logout">退出</a>
        </nav>
      </div>
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer>
      <p>&copy; 2025 刘京儒 - 北京联合大学毕业设计</p>
    </footer>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const currentUser = computed(() => store.getters['auth/currentUser'])
    
    const handleLogout = async () => {
      try {
        // 先清除前端的认证状态，无论后端操作是否成功
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        store.commit('auth/SET_USER', null)
        
        // 然后尝试调用后端的logout接口，但不要等待响应
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        
        axios.get('/logout', config).catch(error => {
          console.log('后端登出接口调用失败，但前端已成功登出', error)
        })
        
        // 无论后端操作是否成功，都跳转到登录页
        router.push('/')
      } catch (error) {
        console.error('退出失败', error)
      }
    }
    
    return {
      isAuthenticated,
      currentUser,
      handleLogout
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 15px 0;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

header h1 {
  margin: 0;
  font-size: 24px;
  color: #4f46e5;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.main-nav {
  display: flex;
  align-items: center;
}

.nav-link {
  padding: 8px 16px;
  margin: 0 10px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.router-link-active {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.logout {
  margin-left: 20px;
  background-color: #f8f9fa;
  color: #dc3545;
  border-radius: 4px;
}

.logout:hover {
  background-color: #f1f1f1;
}

main {
  flex: 1;
}

footer {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  color: #6c757d;
  margin-top: auto;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
  }
  
  .main-nav {
    margin-top: 15px;
  }
}

</style>