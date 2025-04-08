<template>
  <div class="chat-container">
    <div class="chat-content">
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="content">{{ msg.content }}</div>
          <img v-if="msg.imageSrc" :src="msg.imageSrc" alt="Generated Image" class="message-image">
          <!-- 添加下载和编辑按钮 -->
          <div v-if="msg.imageSrc" class="image-options">
            <button @click="saveImage(msg.imageSrc)">下载图片</button>
            <button @click="editImage(msg.imageSrc)">编辑图片</button>
          </div>
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
          <label class="auto-text-option">
            <input type="checkbox" v-model="autoAddText" :disabled="loading || imageLoading" />
            自动添加文案到图片
          </label>

          <div v-if="autoAddText" class="text-style-options">
            <select v-model="textStyle">
              <option value="classic">经典样式</option>
              <option value="modern">现代样式</option>
              <option value="minimalist">极简样式</option>
            </select>
          </div>
        </div>
        <textarea v-model="inputMessage" placeholder="Type your message..." :disabled="loading"
          @keydown="handleKeydown"></textarea>
        <button type="submit" :disabled="loading || !inputMessage.trim()">
          Send
        </button>
      </form>
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
      messagesContainer: null,
      currentConversationId: null,
      isNewConversation: true,
      autoAddText: true, // 是否自动添加文案
      textStyle: 'classic' // 文本样式预设
    };
  },
  computed: {
    ...mapState(['messages']),
    // 从Vuex中获取当前用户ID
    currentUserId() {
      return this.$store.getters['auth/currentUser']?.id;
    }
  },
  methods: {
    ...mapActions(['updateMessages', 'appendMessage']),
    // 处理键盘事件
    handleKeydown(event) {
      // 检查是否按下Enter键，并且没有同时按下Shift键（允许Shift+Enter换行）
      if (event.key === 'Enter' && !event.shiftKey) {
        // 阻止默认的换行行为
        event.preventDefault();
        // 检查消息是否为空，以及是否正在加载中
        if (this.inputMessage.trim() && !this.loading) {
          // 调用发送消息方法
          this.sendMessage();
        }
      }
    },
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
    // 创建新会话
    async createConversation() {
      if (!this.currentUserId) {
        console.error('用户未登录');
        return null;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: "新会话",
            user_id: this.currentUserId
          })
        });

        const data = await response.json();
        if (data.status === 'success') {
          this.currentConversationId = data.conversation.id;
          this.isNewConversation = false;
          // 清空现有消息
          this.updateMessages([]);
          return data.conversation.id;
        }
      } catch (error) {
        console.error('创建会话失败:', error);
      }
      return null;
    },

    // 加载特定会话
    async loadConversation(conversationId) {
      if (!this.currentUserId) {
        console.error('用户未登录');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/conversations/${conversationId}/messages?user_id=${this.currentUserId}`);
        const data = await response.json();

        if (data.status === 'success') {
          this.currentConversationId = conversationId;
          this.isNewConversation = false;

          // 转换消息格式以匹配应用中的格式
          const messages = data.conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            imageSrc: msg.has_image ? `data:image/png;base64,${msg.image_data}` : null
          }));

          this.updateMessages(messages);
        }
      } catch (error) {
        console.error('加载会话失败:', error);
      }
    },

    async sendMessage() {
      if (!this.inputMessage.trim()) return;

      if (!this.currentUserId) {
        console.error('用户未登录');
        return;
      }

      // 如果是新对话，先创建会话
      let conversationId = this.currentConversationId;
      if (this.isNewConversation) {
        conversationId = await this.createConversation();
        if (!conversationId) {
          console.error('创建会话失败');
          return;
        }
      }

      const userMessage = this.inputMessage;
      this.appendMessage({ role: 'user', content: userMessage });
      this.scrollToBottom();
      this.inputMessage = '';
      this.loading = true;
      this.imageLoading = this.selectedOption === '背景';

      try {
        // 发送文本消息
        const textResponse = await fetch('http://127.0.0.1:5000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage,
            option: this.selectedOption,
            user_id: this.currentUserId,
            conversation_id: conversationId
          })
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

        // 将得到的消息发送给 remove_think 端点
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

        // 仅当选中"背景"选项时，才发送图像生成请求
        if (this.selectedOption === '背景') {
          const imageResponse = await fetch('http://127.0.0.1:5000/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: this.prompt,
              user_id: this.currentUserId,
              conversation_id: conversationId
            })
          });

          const imageData = await imageResponse.json();
          if (imageData.status === 'success' && imageData.respond && imageData.respond.img_base64) {
            const newImageSrc = `data:image/png;base64,${imageData.respond.img_base64}`;
            // 如果启用了自动添加文案选项
            if (this.autoAddText) {
              // 调用自动添加文案方法
              await this.autoAddCopywritingToImage(newImageSrc, assistantMessage);
            } else {
              // 原有的代码：直接显示图片
              this.imageSrcs.push(newImageSrc);
              this.appendMessage({
                role: 'assistant',
                content: '背景图片已生成',
                imageSrc: newImageSrc
              });
            }
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
    saveImage(imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = 'image.png';
      link.click();
    },
    editImage(imageSrc) {
      const encodedImageSrc = encodeURIComponent(imageSrc);
      const conversationId = this.currentConversationId || this.$route.params.conversationId;
      this.$router.push({
        name: 'ImageEditor',
        params: { imageSrc: encodedImageSrc },
        query: { conversationId: conversationId }
      });
    },
    closeDialog() {
      this.showDialog = false;
      this.currentImageSrc = '';
    },
    goToTemplateGenerator() {
      this.$router.push({ name: 'TemplateGenerator' });
    },
    async autoAddCopywritingToImage(imageSrc, copywritingText) {
      try {
        // 引入图像处理服务
        const imageService = await import('@/services/imageService');

        // 使用默认的"经典"布局风格处理图像
        const resultImageSrc = await imageService.processImageWithText(
          imageSrc,
          copywritingText,
          this.textStyle || 'classic' // 使用用户选择的样式，默认为经典
        );

        // 将处理后的图像添加到消息中
        this.appendMessage({
          role: 'assistant',
          content: '已自动添加文案到图片上',
          imageSrc: resultImageSrc
        });

        // 滚动到底部显示新消息
        this.scrollToBottom();

        // 保存处理后的图像URL
        this.processedImageSrc = resultImageSrc;

        return resultImageSrc;
      } catch (error) {
        console.error('自动添加文案到图片失败:', error);
        this.appendMessage({
          role: 'assistant',
          content: '添加文案到图片时出错，您可以尝试手动编辑'
        });
        return null;
      }
    }
  },
  // 挂载时检查是否有会话ID参数
  mounted() {
    // 更新消息
    this.updateMessages(this.messages);

    // 检查是否有编辑后的图片
    const editedImage = this.$store.state.editedImage;
    if (editedImage) {
      this.appendMessage({
        role: 'assistant',
        content: '编辑后的图片',
        imageSrc: editedImage
      });
      this.scrollToBottom();
      this.$store.dispatch('setEditedImage', null);
    }

    // 加载指定的会话
    const conversationId = this.$route.params.conversationId;
    if (conversationId) {
      this.loadConversation(conversationId);
    } else {
      this.isNewConversation = true;
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
  flex-direction: column;
  height: calc(100vh - 60px);
  /* 调整高度以适应头部和页脚 */
  gap: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

/* 响应式调整 */
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: calc(100vh - 60px);
    /* 调整高度以适应头部和页脚 */
  }

  button {
    padding: 0 20px;
  }
}

.image-options {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.image-options button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #2196f3;
  color: white;
  font-size: 14px;
}

.image-options button:hover {
  background: #1976d2;
}

.auto-text-option {
  margin-left: 20px;
}

.text-style-options {
  margin-top: 10px;
}
</style>