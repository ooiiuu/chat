import { createStore } from 'vuex';

export default createStore({
    state: {
        messages: []
    },
    mutations: {
        setMessages(state, messages) {
            state.messages = messages;
        },
        addMessage(state, message) {
            state.messages.push(message);
        },
        SET_EDITED_IMAGE(state, imageData) {
            state.editedImage = imageData;
        }
    },
    actions: {
        updateMessages({ commit }, messages) {
            commit('setMessages', messages);
        },
        appendMessage({ commit }, message) {
            commit('addMessage', message);
        },
        setEditedImage({ commit }, imageData) {
            commit('SET_EDITED_IMAGE', imageData);
        }
    },
    getters: {
        getMessages: state => state.messages
    }
});
