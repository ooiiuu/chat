<template>
  <div id="app">
    <header>
      <h1>ChatGPT-like Chatbot</h1>
    </header>
    <main>
      <Chat />
    </main>
  </div>
</template>

<script>
import Chat from './components/Chat.vue';
import ImageEditor from './components/ImageEditor.vue';

export default {
  name: 'App',
  components: {
    ImageEditor,
    Chat
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  width: 100%; /* 移除最大宽度限制 */
  max-width: none; /* 移除最大宽度限制 */
  margin: 0; /* 移除居中边距 */
  padding: 20px;
  box-sizing: border-box; /* 确保padding不会增加总宽度 */
  height: 100%; 
  max-height: none;
  overflow-x: hidden; /* 防止水平滚动条 */
}

header {
  text-align: center;
  margin-bottom: 30px;
}

/* 添加全局样式确保html和body也是全屏的 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
