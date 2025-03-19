// src/components/LoadingSpinner.vue
<template>
  <div class="loading-container">
    <div class="loading-spinner"></div>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(79, 70, 229, 0.2);
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s infinite ease-in-out;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
