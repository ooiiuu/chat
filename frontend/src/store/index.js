import { createStore } from 'vuex';

export default createStore({
    state: {
        messages: [],
        editedImage: null,
        templates: [],
        currentTemplate: null
    },
    mutations: {
        // 现有的 mutations
        setMessages(state, messages) {
            state.messages = messages;
        },
        addMessage(state, message) {
            state.messages.push(message);
        },
        SET_EDITED_IMAGE(state, imageData) {
            state.editedImage = imageData;
        },
        
        // 新增的 mutations
        SET_TEMPLATES(state, templates) {
            state.templates = templates;
        },
        ADD_TEMPLATE(state, template) {
            state.templates.push(template);
        },
        SET_CURRENT_TEMPLATE(state, template) {
            state.currentTemplate = template;
        },
        UPDATE_CURRENT_TEMPLATE(state, updates) {
            state.currentTemplate = { ...state.currentTemplate, ...updates };
        }
    },
    actions: {
        // 现有的 actions
        updateMessages({ commit }, messages) {
            commit('setMessages', messages);
        },
        appendMessage({ commit }, message) {
            commit('addMessage', message);
        },
        setEditedImage({ commit }, imageData) {
            commit('SET_EDITED_IMAGE', imageData);
        },
        
        // 新增的 actions
        setTemplates({ commit }, templates) {
            commit('SET_TEMPLATES', templates);
        },
        addTemplate({ commit }, template) {
            commit('ADD_TEMPLATE', template);
        },
        setCurrentTemplate({ commit }, template) {
            commit('SET_CURRENT_TEMPLATE', template);
        },
        updateCurrentTemplate({ commit }, updates) {
            commit('UPDATE_CURRENT_TEMPLATE', updates);
        },
        saveTemplateToStorage({ state }) {
            // 保存模板到本地存储
            localStorage.setItem('savedTemplates', JSON.stringify(state.templates));
        },
        loadTemplatesFromStorage({ commit }) {
            const savedTemplates = localStorage.getItem('savedTemplates');
            if (savedTemplates) {
                commit('SET_TEMPLATES', JSON.parse(savedTemplates));
            }
        }
    },
    getters: {
        getMessages: state => state.messages,
        getTemplates: state => state.templates,
        getCurrentTemplate: state => state.currentTemplate
    }
});
