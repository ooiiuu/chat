<!-- frontend\src\views\SearchHistory.vue -->
<template>
    <div class="search-container">
      <h1>搜索历史记录</h1>
      
      <div class="search-form">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="输入关键词搜索历史会话..." 
          @keyup.enter="performSearch"
        />
        <button @click="performSearch" :disabled="!searchTerm.trim() || searching">
          <span v-if="!searching">搜索</span>
          <span v-else class="loading-dot"></span>
        </button>
      </div>
      
      <div v-if="searching" class="search-status">
        <div class="loading-spinner"></div>
        <p>正在搜索...</p>
      </div>
      
      <div v-else-if="hasSearched && searchResults.conversations.length === 0 && searchResults.messages.length === 0" class="no-results">
        <p>未找到与 "{{ lastSearchTerm }}" 相关的结果</p>
      </div>
      
      <div v-else-if="hasSearched" class="search-results">
        <div v-if="searchResults.conversations.length > 0" class="result-section">
          <h2>会话标题匹配</h2>
          <div 
            v-for="conversation in searchResults.conversations" 
            :key="'conv-'+conversation.id" 
            class="result-item"
            @click="viewConversation(conversation.id)"
          >
            <div class="result-info">
              <h3>{{ conversation.title }}</h3>
              <span class="result-date">{{ formatDate(conversation.created_at) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="searchResults.messages.length > 0" class="result-section">
          <h2>消息内容匹配</h2>
          <div 
            v-for="message in searchResults.messages" 
            :key="'msg-'+message.conversation_id" 
            class="result-item"
            @click="viewConversation(message.conversation_id)"
          >
            <div class="result-info">
              <h3>{{ message.conversation_title }}</h3>
              <p class="result-preview" v-html="highlightMatch(message.message_preview)"></p>
              <span class="result-date">{{ formatDate(message.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="hasSearched" class="back-link">
        <a href="#" @click.prevent="goBack">返回</a>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  
  export default {
    setup() {
      const router = useRouter();
      const store = useStore();
      
      const searchTerm = ref('');
      const lastSearchTerm = ref('');
      const searching = ref(false);
      const hasSearched = ref(false);
      
      const searchResults = reactive({
        conversations: [],
        messages: []
      });
      
      // 获取当前用户ID
      const currentUserId = computed(() => {
        return store.getters['auth/currentUser']?.id;
      });
      
      // 执行搜索
      const performSearch = async () => {
        if (!searchTerm.value.trim() || searching.value) return;
        if (!currentUserId.value) {
          console.error('用户未登录');
          return;
        }
        
        searching.value = true;
        hasSearched.value = true;
        lastSearchTerm.value = searchTerm.value;
        
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/search?user_id=${currentUserId.value}&q=${encodeURIComponent(searchTerm.value)}`);
          const data = await response.json();
          
          if (data.status === 'success') {
            searchResults.conversations = data.results.conversations || [];
            searchResults.messages = data.results.messages || [];
          }
        } catch (error) {
          console.error('搜索失败:', error);
        } finally {
          searching.value = false;
        }
      };
      
      // 查看会话
      const viewConversation = (conversationId) => {
        router.push(`/conversations/${conversationId}`);
      };
      
      // 返回上一页
      const goBack = () => {
        router.go(-1);
      };
      
      // 高亮匹配文本
      const highlightMatch = (text) => {
        if (!lastSearchTerm.value.trim()) return text;
        
        const regex = new RegExp(lastSearchTerm.value, 'gi');
        return text.replace(regex, match => `<span class="highlight">${match}</span>`);
      };
      
      // 格式化日期
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        
        // 今天的日期
        if (date.toDateString() === now.toDateString()) {
          return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        
        // 昨天的日期
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
          return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        
        // 其他日期
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      return {
        searchTerm,
        lastSearchTerm,
        searching,
        hasSearched,
        searchResults,
        performSearch,
        viewConversation,
        goBack,
        highlightMatch,
        formatDate
      };
    }
  }
  </script>
  
  <style scoped>
  .search-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    margin-bottom: 30px;
    color: #333;
  }
  
  .search-form {
    display: flex;
    margin-bottom: 30px;
  }
  
  .search-form input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px 0 0 8px;
    font-size: 16px;
  }
  
  .search-form button {
    padding: 0 25px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    font-size: 16px;
  }
  
  .search-form button:disabled {
    background-color: #a5a5a5;
    cursor: not-allowed;
  }
  
  .search-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
  }
  
  .loading-spinner {
    border: 3px solid rgba(33, 150, 243, 0.1);
    border-top: 3px solid #2196f3;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-dot {
    display: inline-block;
    width: 15px;
    height: 15px;
    background-color: white;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.5; }
  }
  
  .no-results {
    text-align: center;
    padding: 40px 0;
    color: #666;
  }
  
  .result-section {
    margin-bottom: 30px;
  }
  
  .result-section h2 {
    font-size: 18px;
    color: #555;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
  }
  
  .result-item {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .result-item:hover {
    background-color: #f9f9f9;
  }
  
  .result-info h3 {
    margin: 0 0 8px 0;
    font-size: 17px;
    color: #333;
  }
  
  .result-preview {
    margin: 0 0 10px 0;
    color: #555;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .result-date {
    display: block;
    font-size: 12px;
    color: #999;
  }
  
  .highlight {
    background-color: #ffe082;
    padding: 0 2px;
    border-radius: 2px;
  }
  
  .back-link {
    margin-top: 20px;
    text-align: center;
  }
  
  .back-link a {
    color: #4f46e5;
    text-decoration: none;
  }
  
  .back-link a:hover {
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    .search-form {
      flex-direction: column;
    }
    
    .search-form input {
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .search-form button {
      border-radius: 8px;
      padding: 12px;
    }
  }
  </style>