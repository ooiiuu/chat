<template>
  <div id="app">
    <header>
      <h1>AI 助手</h1>
      <nav class="main-nav">
        <router-link to="/" class="nav-link">聊天</router-link>
        <router-link to="/templates" class="nav-link">海报模板</router-link>
      </nav>
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
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
  height: 100%;
  max-height: none;
  overflow-x: hidden;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.main-nav {
  display: flex;
  justify-content: center;
  margin-top: 15px;
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

footer {
  text-align: center; /* 添加这一行 */
  margin-top: 20px; /* 可选：添加一些上边距 */
}
</style>
