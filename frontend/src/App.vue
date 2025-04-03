<template>
  <div id="app">
    <header v-if="isAuthenticated">
      <div class="header-container">
        <h1>AI 助手</h1>
        <nav class="main-nav">
          <a href="#" @click.prevent="startNewChat" class="nav-link">新建会话</a>
          <router-link to="/conversations" class="nav-link">历史会话</router-link>
          <router-link to="/search" class="nav-link">搜索</router-link>
          <div class="user-menu" @mouseover="showDropdown = true" @mouseleave="showDropdown = false">
            <img src="/head1.png" alt="头像" class="avatar">
            <span class="username">{{ currentUser.username }}</span>
            <div v-if="showDropdown" class="dropdown">
              <a href="#" @click.prevent="handleLogout" class="dropdown-item">退出</a>
            </div>
          </div>
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
import { computed, ref } from 'vue'
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
    const showDropdown = ref(false)
    
    const startNewChat = () => {
      // 清除聊天记录和其他相关数据
      store.commit('setMessages', []);
      store.commit('SET_EDITED_IMAGE', null);
      store.commit('SET_TEMPLATES', []);
      store.commit('SET_CURRENT_TEMPLATE', null);
      // 跳转到聊天页面
      router.push('/chat');
    }
    
    const handleLogout = async () => {
  try {
    // 获取当前 Token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    // 调用后端登出接口
    await axios.get('/logout', config)
      .then(() => {
        // 登出成功提示（可选）
        alert('已安全退出');
      })
      .catch(error => {
        console.error('后端登出失败', error);
        alert('退出失败，请检查网络或重试');
      });

    // 清除前端认证状态
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    store.commit('auth/SET_USER', null);

    // 跳转到登录页
    router.push('/');
  } catch (error) {
    console.error('退出流程异常', error);
    alert('发生未知错误，请联系管理员');
  }
};
    
    return {
      isAuthenticated,
      currentUser,
      showDropdown,
      handleLogout,
      startNewChat
    }
  },
  mounted() {
  document.title = "AI 助手 - 公益海报智能创作平台";
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

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}

.username {
  color: #333;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  padding: 10px 20px;
  color: #333;
  text-decoration: none;
  display: block;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
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