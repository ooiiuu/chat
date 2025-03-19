// store/modules/auth.js
export default {
    namespaced: true,
    state: {
      user: null,
      isAuthenticated: false
    },
    mutations: {
      SET_USER(state, user) {
        state.user = user;
        state.isAuthenticated = !!user;
      }
    },
    actions: {
      login({ commit }, user) {
        commit('SET_USER', user);
      },
      logout({ commit }) {
        commit('SET_USER', null);
      },
      setUser({ commit }, user) {
        commit('SET_USER', user);
      }
    },
    getters: {
      isAuthenticated: state => !!state.user,
      currentUser: state => state.user
    }
  };