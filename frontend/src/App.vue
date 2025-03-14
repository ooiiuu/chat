<template>
  <div id="app">
    <header>
      <h1>ChatGPT-like Chatbot</h1>
    </header>
    <main>
      <router-view></router-view>
    </main>
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
</style>
