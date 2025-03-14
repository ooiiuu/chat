<template>
  <div class="chat-container">
    <div class="chat-content">
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="content">{{ msg.content }}</div>
          <img v-if="msg.imageSrc" :src="msg.imageSrc" alt="Generated Image" class="message-image"
            @click="showImageOptions(msg.imageSrc)">
        </div>
        <div v-if="imageLoading" class="message assistant">
          <div class="content">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>

      <form @submit.prevent="sendMessage">
        <div class="options">
          <label>
            <input type="radio" v-model="selectedOption" value="文案" :disabled="loading || imageLoading" />
            生产文案
          </label>
          <label>
            <input type="radio" v-model="selectedOption" value="背景" :disabled="loading || imageLoading" />
            生成背景
          </label>
        </div>
        <textarea v-model="inputMessage" placeholder="Type your message..." :disabled="loading"></textarea>
        <button type="submit" :disabled="loading || !inputMessage.trim()">
          Send
        </button>
      </form>
    </div>
  </div>

  <!-- 对话框 -->
  <div v-if="showDialog" class="dialog-overlay">
    <div class="dialog">
      <p>请选择操作：</p>
      <button @click="saveImage">下载图片</button>
      <button @click="editImage">编辑图片</button>
      <button @click="closeDialog">取消</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      inputMessage: '',
      loading: false,
      imageLoading: false,
      imageSrcs: [],
      prompt: '',
      selectedOption: '文案',
      showDialog: false,
      currentImageSrc: '',
      messagesContainer: null
    };
  },
  computed: {
    ...mapState(['messages'])
  },
  methods: {
    ...mapActions(['updateMessages', 'appendMessage']),
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        } else {
          console.warn('Messages container not found');
        }
      });
    },
    async sendMessage() {
      if (!this.inputMessage.trim()) return;

      const userMessage = this.inputMessage;
      this.appendMessage({ role: 'user', content: userMessage });
      this.scrollToBottom();
      this.inputMessage = '';
      this.loading = true;
      this.imageLoading = this.selectedOption === '背景';

      try {
        // Send text message
        const textResponse = await fetch('http://127.0.0.1:5000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userMessage, option: this.selectedOption }) // 传递选项信息
        });

        if (!textResponse.ok) {
          throw new Error(`HTTP error! status: ${textResponse.status}`);
        }

        const reader = textResponse.body.getReader();
        let assistantMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          assistantMessage += text;
          this.updateAssistantMessage(assistantMessage);
        }

        // 新增: 将得到的消息发送给 remove_think 端点
        const removeThinkResponse = await fetch('http://127.0.0.1:5000/remove_think', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: assistantMessage })
        });

        if (!removeThinkResponse.ok) {
          throw new Error(`HTTP error! status: ${removeThinkResponse.status}`);
        }

        const promptData = await removeThinkResponse.json();
        this.prompt = promptData.prompt; // 将返回的提示词保存到变量中

        // 仅当选中“背景”选项时，才发送图像生成请求
        if (this.selectedOption === '背景') {
          const imageResponse = await fetch('http://127.0.0.1:5000/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: this.prompt })
          });

          const imageData = await imageResponse.json();
          if (imageData.status === 'success' && imageData.respond && imageData.respond.img_base64) {
            const newImageSrc = `data:image/png;base64,${imageData.respond.img_base64}`;
            this.imageSrcs.push(newImageSrc); // 将新图片 URL 添加到数组中
            this.appendMessage({ role: 'assistant', content: '图片已生成', imageSrc: newImageSrc }); // 添加带有图片的消息
            this.scrollToBottom();
          } else {
            console.error('Image data not found or invalid format', imageData);
            this.appendMessage({ role: 'assistant', content: '图片生成失败' });
          }
        }
      } catch (error) {
        console.error('Error:', error);
        this.appendMessage({ role: 'assistant', content: 'Error occurred' });
      } finally {
        this.loading = false;
        this.imageLoading = false;
      }
    },
    updateAssistantMessage(content) {
      const lastMessage = this.messages[this.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.content = content;
      } else {
        this.appendMessage({ role: 'assistant', content });
      }
      this.scrollToBottom();
      this.updateMessages(this.messages);
    },
    showImageOptions(imageSrc) {
      this.currentImageSrc = imageSrc;
      this.showDialog = true;
    },
    saveImage() {
      const link = document.createElement('a');
      link.href = this.currentImageSrc;
      link.download = 'image.png';
      link.click();
      this.closeDialog();
    },
    editImage() {
      const encodedImageSrc = encodeURIComponent(this.currentImageSrc);
      this.$router.push({ name: 'ImageEditor', params: { imageSrc: encodedImageSrc } });
      this.closeDialog();
    },
    closeDialog() {
      this.showDialog = false;
      this.currentImageSrc = '';
    }
  },
  // Chat.vue 中的 mounted 钩子
  mounted() {
    this.updateMessages(this.messages);

    // 检查 Vuex 中是否有编辑后的图片
    const editedImage = this.$store.state.editedImage;
    if (editedImage) {
      this.appendMessage({
        role: 'assistant',
        content: '编辑后的图片',
        imageSrc: editedImage
      });
      this.scrollToBottom();
      // 清除存储的图片，防止重复添加
      this.$store.dispatch('setEditedImage', null);
    }
  }
};
</script>

<style scoped>
.message-image {
  max-width: 100%;
  max-height: 300px;
  /* 可以根据需要调整 */
  object-fit: contain;
  margin-top: 10px;
  border-radius: 8px;
}

.chat-container {
  display: flex;
  height: 100vh;
  /* 铺满整个屏幕高度 */
  width: 100vw;
  /* 铺满整个屏幕宽度 */
  gap: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: fixed;
  /* 固定位置 */
  top: 0;
  left: 0;
  box-sizing: border-box;
  /* 确保padding不会增加总宽度 */
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background-color: white;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  margin-bottom: 0;
  border: none;
  background-color: #fff;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.message {
  margin: 12px 0;
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 75%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  background: #1e88e5;
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.message.assistant {
  background: #f1f3f4;
  color: #333;
  margin-right: auto;
  border-bottom-left-radius: 4px;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
}

form {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.options {
  display: flex;
  gap: 10px;
  align-items: center;
}

textarea {
  flex: 1;
  padding: 12px 16px;
  /* 增加内边距 */
  border: 1px solid #ddd;
  border-radius: 24px;
  resize: none;
  height: 60px;
  /* 增加高度 */
  font-family: inherit;
  font-size: 18px;
  /* 调大字体 */
  transition: border-color 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

textarea:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 1px 3px rgba(33, 150, 243, 0.2);
}

button {
  padding: 0 30px;
  /* 增加内边距 */
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 500;
  font-size: 18px;
  /* 调大字体 */
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  background: #1976d2;
}

button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.loading-spinner {
  border: 3px solid rgba(33, 150, 243, 0.1);
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 10px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dialog button {
  margin: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #2196f3;
  color: white;
  font-size: 16px;
}

.dialog button:hover {
  background: #1976d2;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: 100vh;
  }

  button {
    padding: 0 20px;
  }
}
</style>