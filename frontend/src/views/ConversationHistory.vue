<template>
    <div class="history-container">
        <h1>历史会话</h1>

        <div class="search-box">
            <input type="text" v-model="searchTerm" placeholder="搜索会话..." @input="searchConversations" />
        </div>

        <div class="loading" v-if="loading">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
        </div>

        <div class="empty-state" v-else-if="conversations.length === 0">
            <p>没有历史会话记录</p>
            <button @click="startNewConversation" class="new-chat-btn">开始新会话</button>
        </div>

        <div class="conversations-list" v-else>
            <div class="conversation-actions">
                <button @click="startNewConversation" class="new-chat-btn">开始新会话</button>
            </div>

            <div v-for="conversation in filteredConversations" :key="conversation.id" class="conversation-item"
                @click="viewConversation(conversation.id)">
                <div class="conversation-info">
                    <h3 class="conversation-title">{{ conversation.title }}</h3>
                    <p class="conversation-preview">{{ conversation.preview }}</p>
                    <span class="conversation-date">{{ formatDate(conversation.updated_at) }}</span>
                </div>

                <div class="conversation-actions">
                    <button @click.stop="renameConversation(conversation)" class="action-btn rename-btn">
                        重命名
                    </button>
                    <button @click.stop="deleteConversation(conversation.id)" class="action-btn delete-btn">
                        删除
                    </button>
                </div>
            </div>
        </div>

        <!-- 重命名对话框 -->
        <div v-if="showRenameDialog" class="dialog-overlay" @click.self="cancelRename">
            <div class="dialog-card">
                <div class="dialog-header">
                    <h2>重命名会话</h2>
                    <button class="close-btn" @click="cancelRename">×</button>
                </div>

                <div class="dialog-content">
                    <input type="text" v-model="newTitle" placeholder="输入新的会话标题" @keyup.enter="confirmRename" />

                    <div class="dialog-actions">
                        <button @click="cancelRename" class="btn btn-outline">取消</button>
                        <button @click="confirmRename" class="btn btn-primary">确认</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
    setup() {
        const router = useRouter();
        const store = useStore();

        const conversations = ref([]);
        const loading = ref(true);
        const searchTerm = ref('');
        const showRenameDialog = ref(false);
        const selectedConversation = ref(null);
        const newTitle = ref('');

        // 计算属性：过滤后的会话列表
        const filteredConversations = computed(() => {
            if (!searchTerm.value) return conversations.value;

            const term = searchTerm.value.toLowerCase();
            return conversations.value.filter(conv =>
                conv.title.toLowerCase().includes(term) ||
                (conv.preview && conv.preview.toLowerCase().includes(term))
            );
        });

        // 获取当前用户ID
        const currentUserId = computed(() => {
            return store.getters['auth/currentUser']?.id;
        });

        // 获取所有会话
        const fetchConversations = async () => {
            if (!currentUserId.value) {
                console.error('用户未登录');
                return;
            }

            loading.value = true;
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/conversations?user_id=${currentUserId.value}`);
                const data = await response.json();

                if (data.status === 'success') {
                    conversations.value = data.conversations;
                }
            } catch (error) {
                console.error('获取会话列表失败:', error);
            } finally {
                loading.value = false;
            }
        };

        // 查看特定会话
        const viewConversation = (conversationId) => {
            router.push(`/conversations/${conversationId}`);
        };

        // 开始新会话
        const startNewConversation = () => {
            // 清除聊天记录和其他相关数据
            store.commit('setMessages', []);
            store.commit('SET_EDITED_IMAGE', null);
            store.commit('SET_TEMPLATES', []);
            store.commit('SET_CURRENT_TEMPLATE', null);
            // 跳转到聊天页面
            router.push('/chat');
        };

        // 重命名会话
        const renameConversation = (conversation) => {
            selectedConversation.value = conversation;
            newTitle.value = conversation.title;
            showRenameDialog.value = true;
        };

        // 确认重命名
        const confirmRename = async () => {
            if (!newTitle.value.trim() || !selectedConversation.value) return;

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/conversations/${selectedConversation.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: newTitle.value,
                        user_id: currentUserId.value
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    // 更新本地会话列表
                    const index = conversations.value.findIndex(c => c.id === selectedConversation.value.id);
                    if (index !== -1) {
                        conversations.value[index].title = newTitle.value;
                    }

                    showRenameDialog.value = false;
                    selectedConversation.value = null;
                    newTitle.value = '';
                }
            } catch (error) {
                console.error('重命名会话失败:', error);
            }
        };

        // 取消重命名
        const cancelRename = () => {
            showRenameDialog.value = false;
            selectedConversation.value = null;
            newTitle.value = '';
        };

        // 删除会话
        const deleteConversation = async (conversationId) => {
            if (!confirm('确定要删除此会话吗？此操作不可撤销。')) return;

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/conversations/${conversationId}?user_id=${currentUserId.value}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (data.status === 'success') {
                    // 从本地列表中移除
                    conversations.value = conversations.value.filter(c => c.id !== conversationId);
                }
            } catch (error) {
                console.error('删除会话失败:', error);
            }
        };

        // 搜索会话
        const searchConversations = () => {
            // 实时过滤由计算属性处理
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

            // 一周内的日期
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            const dayDiff = Math.floor((now - date) / (24 * 60 * 60 * 1000));
            if (dayDiff < 7) {
                return `周${weekDays[date.getDay()]} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            }

            // 其他日期
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        onMounted(() => {
            fetchConversations();
        });

        return {
            conversations,
            filteredConversations,
            loading,
            searchTerm,
            showRenameDialog,
            newTitle,
            viewConversation,
            startNewConversation,
            renameConversation,
            deleteConversation,
            confirmRename,
            cancelRename,
            searchConversations,
            formatDate
        };
    }
}
</script>

<style scoped>
.history-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    margin-bottom: 30px;
    color: #333;
}

.search-box {
    margin-bottom: 20px;
}

.search-box input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
}

.loading-spinner {
    border: 3px solid rgba(33, 150, 243, 0.1);
    border-top: 3px solid #2196f3;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.empty-state {
    text-align: center;
    padding: 40px 0;
    color: #666;
}

.conversations-list {
    margin-top: 20px;
}

.conversation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.conversation-item:hover {
    background-color: #f9f9f9;
}

.conversation-info {
    flex: 1;
}

.conversation-title {
    margin: 0 0 5px 0;
    font-size: 18px;
    color: #333;
}

.conversation-preview {
    margin: 0;
    color: #666;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 500px;
}

.conversation-date {
    display: block;
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.conversation-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    background: none;
    border: none;
    font-size: 14px;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.rename-btn {
    color: #2196f3;
}

.rename-btn:hover {
    background-color: rgba(33, 150, 243, 0.1);
}

.delete-btn {
    color: #f44336;
}

.delete-btn:hover {
    background-color: rgba(244, 67, 54, 0.1);
}

.new-chat-btn {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    margin-bottom: 20px;
}

.new-chat-btn:hover {
    background-color: #4338ca;
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
}

.dialog-card {
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
}

.dialog-header h2 {
    margin: 0;
    font-size: 18px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: #666;
}

.dialog-content {
    padding: 20px;
}

.dialog-content input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    margin-bottom: 20px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
}

.btn-outline {
    background: none;
    border: 1px solid #ddd;
    color: #666;
}

.btn-primary {
    background-color: #4f46e5;
    color: white;
    border: none;
}

@media (max-width: 768px) {
    .conversation-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .conversation-actions {
        margin-top: 10px;
        align-self: flex-end;
    }

    .conversation-preview {
        max-width: 100%;
    }
}
</style>