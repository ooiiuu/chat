<!-- HomeView.vue -->
<template>
    <div class="login-container">
      <div class="login-card">
        <div class="brand">
          <h1>AI Chat</h1>
        </div>
        
        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <h2>欢迎回来</h2>
          <p class="subtitle">请登录您的账号继续使用</p>
          
          <div class="form-group">
            <label for="username">用户名/邮箱</label>
            <div class="input-container">
              <i class="icon user-icon"></i>
              <input 
                id="username"
                v-model="loginForm.usernameOrEmail" 
                placeholder="请输入用户名或邮箱"
                required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <div class="input-container">
              <i class="icon lock-icon"></i>
              <input 
                id="password"
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码"
                required
              >
            </div>
          </div>
          
          <div v-if="loginError" class="error-message">
            <i class="icon error-icon"></i>
            {{ loginError }}
          </div>
          
          <button type="submit" class="btn btn-primary">登录</button>
          <button type="button" @click="showRegisterDialog = true" class="btn btn-outline">
            注册新用户
          </button>
        </form>
      </div>
  
      <!-- 注册对话框 -->
      <transition name="fade">
        <div v-if="showRegisterDialog" class="dialog-overlay" @click.self="cancelRegister">
          <div class="dialog-card">
            <div class="dialog-header">
              <h2>创建新账号</h2>
              <button class="close-btn" @click="cancelRegister">×</button>
            </div>
            
            <form @submit.prevent="handleRegister" class="register-form">
              <div class="form-group">
                <label for="reg-username">用户名</label>
                <div class="input-container">
                  <i class="icon user-icon"></i>
                  <input 
                    id="reg-username"
                    v-model="registerForm.username" 
                    placeholder="请设置用户名 (至少4个字符)"
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label for="reg-email">邮箱</label>
                <div class="input-container">
                  <i class="icon email-icon"></i>
                  <input 
                    id="reg-email"
                    v-model="registerForm.email" 
                    type="email" 
                    placeholder="请输入有效邮箱地址"
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label for="reg-password">密码</label>
                <div class="input-container">
                  <i class="icon lock-icon"></i>
                  <input 
                    id="reg-password"
                    v-model="registerForm.password" 
                    type="password" 
                    placeholder="至少8位，包含字母和数字"
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label for="reg-confirm">确认密码</label>
                <div class="input-container">
                  <i class="icon lock-icon"></i>
                  <input 
                    id="reg-confirm"
                    v-model="registerForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入密码"
                    required
                  >
                </div>
              </div>
              
              <div v-if="registerError" class="error-message">
                <i class="icon error-icon"></i>
                {{ registerError }}
              </div>
              
              <div class="button-group">
                <button type="submit" class="btn btn-primary">创建账号</button>
                <button type="button" @click="cancelRegister" class="btn btn-outline">取消</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  import axios from 'axios'
  import { onMounted } from 'vue'

  onMounted(() => {
  // 检查URL是否包含重定向参数
  const redirect = router.currentRoute.value.query.redirect
  if (redirect) {
    // 可以显示提示信息
    loginError.value = "请先登录后访问该页面"
  }
})

  const router = useRouter()
  const store = useStore()
  // 登录表单数据
  const loginForm = ref({
    usernameOrEmail: '',
    password: ''
  })
  
  // 注册表单数据
  const registerForm = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const loginError = ref('')
  const registerError = ref('')
  const showRegisterDialog = ref(false)
  
  // 处理登录
  const handleLogin = async () => {
  loginError.value = ''
  
  try {
    const response = await axios.post('/login', {
      identifier: loginForm.value.usernameOrEmail,
      password: loginForm.value.password
    }, {
      withCredentials: true
    })

    if (response.data.status === 'success') {
      // 保存用户信息到 Vuex
      store.commit('auth/SET_USER', response.data.user)
      
      // 如果有重定向的URL，优先导航到那里
      const redirectPath = router.currentRoute.value.query.redirect || '/chat'
      router.push(redirectPath)
    }
  } catch (error) {
    if (error.response?.status === 401) {
      loginError.value = error.response.data.message
    } else {
      loginError.value = '登录失败，请检查网络连接'
    }
  }
}
  
  // 处理注册
  const handleRegister = async () => {
    // 清空错误信息
    registerError.value = ''
  
    // 前端基础验证
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
      registerError.value = '两次输入的密码不一致'
      return
    }
  
    try {
      const response = await axios.post('/register', {
        username: registerForm.value.username,
        email: registerForm.value.email,
        password: registerForm.value.password,
        confirm_password: registerForm.value.confirmPassword
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
  
      if (response.data.status === 'success') {
        // 注册成功处理
        showRegisterDialog.value = false
        alert('注册成功，请登录')
        // 自动填充登录表单
        loginForm.value.usernameOrEmail = registerForm.value.username
        // 清空注册表单
        registerForm.value = {
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        // 处理字段级错误
        const errors = error.response.data.errors
        registerError.value = Object.values(errors).flat().join('\n')
      } else {
        registerError.value = error.response?.data?.message || '注册失败'
      }
    }
  }
  
  // 取消注册
  const cancelRegister = () => {
    showRegisterDialog.value = false
    registerForm.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
    registerError.value = ''
  }
  </script>
  
  <style scoped>
  /* 全局样式 */
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
  }
  
  .login-card {
  width: 100%;
  max-width: 380px; /* 从420px减小到380px */
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  padding: 40px 30px; /* 左右内边距从40px减小到30px */
  transition: all 0.3s ease;
}
  
  .brand {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .brand h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    color: #64748b;
    margin-bottom: 24px;
    font-size: 14px;
  }
  
  .form-group {
  margin-bottom: 16px; /* 从20px减小到16px */
}
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 6px;
  }
  
  .input-container {
    position: relative;
  }
  
  .icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    opacity: 0.5;
  }
  
  input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px; /* 从15px减小到14px */
  transition: all 0.2s;
  background-color: #f8fafc;
  box-sizing: border-box; /* 确保padding不会增加宽度 */
}
  
  input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background-color: white;
  }
  
  input::placeholder {
  color: #94a3b8;
  font-size: 13px; /* 减小占位符文本大小 */
}
  
  .btn {
    display: block;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    margin-bottom: 12px;
    border: none;
  }
  
  .btn-primary {
    background-color: #4f46e5;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #4338ca;
  }
  
  .btn-outline {
    background-color: transparent;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }
  
  .btn-outline:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .error-message {
    background-color: #fee2e2;
    color: #b91c1c;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }
  
  .error-icon {
    margin-right: 8px;
  }
  
  /* 对话框样式 */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }
  
  .dialog-card {
  width: 100%;
  max-width: 420px; /* 从480px减小到420px */
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .dialog-header h2 {
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #64748b;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .close-btn:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  
  .register-form {
    padding: 24px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }
  
  .button-group .btn {
    margin-bottom: 0;
  }
  
  /* 动画效果 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* 图标样式 - 使用伪元素模拟图标 */
  .user-icon::before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /%3E%3C/svg%3E");
  }
  
  .lock-icon::before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /%3E%3C/svg%3E");
  }
  
  .email-icon::before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' /%3E%3C/svg%3E");
  }
  
  .error-icon::before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23b91c1c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' /%3E%3C/svg%3E");
  }
  
  /* 响应式设计 */
  @media (max-width: 480px) {
  .login-card {
    padding: 25px 20px; /* 进一步减小移动设备上的内边距 */
  }
  
  .dialog-card {
    max-width: 95%; /* 在移动设备上使用百分比宽度 */
  }
  
  input {
    padding: 10px 10px 10px 36px; /* 减小输入框内边距 */
  }
  
  .icon {
    left: 10px; /* 调整图标位置 */
  }
}
  </style>
  