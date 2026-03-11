<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { useAuthStore } from '@/store/auth';

// 组件设置
const showHeader = ref(true);
const router = useRouter();
const authStore = useAuthStore();

// 监听路由变化，决定是否显示头部
onMounted(() => {
  // 根据当前路由决定是否显示头部
  updateHeaderVisibility(router.currentRoute.value);
  
  // 监听路由变化
  router.afterEach((to) => {
    updateHeaderVisibility(to);
  });
  
  // 从localStorage加载用户信息
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      authStore.setAuth(token, user);
      console.log('已从localStorage加载用户信息:', user.username, '角色:', user.role);
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
});

// 更新头部可见性
function updateHeaderVisibility(route) {
  // 在登录、注册页面隐藏头部
  showHeader.value = !['Login', 'Register'].includes(route.name);
}
</script>

<template>
  <div id="app">
    <AppHeader v-if="showHeader" />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" class="page-enter" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

:root {
  --primary-color: #4a6cf7;
  --primary-light: #00bcf9;
  --success-color: #4ADE80;
  --warning-color: #FBBF24;
  --danger-color: #F87171;
  --info-color: #94A3B8;
  
  --text-primary: #1E293B;
  --text-regular: #475569;
  --text-secondary: #64748B;
  
  --border-color: #E2E8F0;
  --border-light: #F1F5F9;
  
  --background-color: #F8FAFC;
  --card-background: #FFFFFF;
  
  --shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  --shadow-regular: 0 4px 18px 0 rgba(0, 0, 0, 0.08);
  
  --transition-speed: 0.3s;
  --border-radius: 12px;
  
  --primary-color-rgb: 74, 108, 247;
}

.dark-mode {
  --primary-color: #60a5fa;
  --primary-light: #93c5fd;
  --success-color: #4ADE80;
  --warning-color: #FBBF24;
  --danger-color: #F87171;
  --info-color: #94A3B8;
  
  --text-primary: #F1F5F9;
  --text-regular: #E2E8F0;
  --text-secondary: #CBD5E1;
  
  --border-color: #334155;
  --border-light: #1E293B;
  
  --background-color: #0F172A;
  --card-background: #1E293B;
  
  --shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  --shadow-regular: 0 4px 18px 0 rgba(0, 0, 0, 0.4);
}

/* 添加html和body样式，防止双重滚动条 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 保持为hidden，防止整体页面出现滚动条 */
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-regular);
  background-color: var(--background-color);
  transition: background-color var(--transition-speed) ease, color var(--transition-speed) ease;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 0;
  width: 100%;
  overflow: hidden; /* 修改为hidden，由子组件控制滚动 */
  height: calc(100vh - 68px); /* 与头部高度一致 */
}

/* 统一样式调整 */
h1, h2, h3, h4, h5, h6 {
  color: var(--text-primary);
  line-height: 1.3;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-speed) ease;
}

a:hover {
  color: rgba(var(--primary-color-rgb), 0.8);
}

.card {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-light);
  overflow: hidden;
  transition: all var(--transition-speed) ease;
}

.card:hover {
  box-shadow: var(--shadow-regular);
}

button {
  cursor: pointer;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-speed) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Element Plus 覆盖样式 */
.el-button {
  border-radius: var(--border-radius) !important;
  font-weight: 500 !important;
  transition: all var(--transition-speed) ease !important;
}

.el-button:hover {
  transform: translateY(-2px);
}

.el-card {
  border-radius: var(--border-radius) !important;
  box-shadow: var(--shadow-light) !important;
  transition: all var(--transition-speed) ease !important;
  overflow: hidden;
}

.el-input__wrapper {
  border-radius: var(--border-radius) !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background-color);
}

::-webkit-scrollbar-thumb {
  background-color: var(--info-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary);
}
</style>
