<template>
  <div class="user-center-layout">
    <el-container>
      <el-aside width="200px">
        <div class="user-sidebar">
          <el-menu
            :default-active="activeMenu"
            class="user-menu"
            router
          >
            <el-menu-item index="/user">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </el-menu-item>
            <el-menu-item index="/user/statistics">
              <el-icon><DataAnalysis /></el-icon>
              <span>练习统计</span>
            </el-menu-item>
            <el-menu-item index="/user/mistakes">
              <el-icon><Warning /></el-icon>
              <span>错题本</span>
            </el-menu-item>
            <el-menu-item index="/user/settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      <el-container>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { User, DataAnalysis, Warning, Setting } from '@element-plus/icons-vue';

const route = useRoute();
const authStore = useAuthStore();

// 计算当前活动菜单项
const activeMenu = computed(() => {
  return route.path;
});

// 获取当前路由的元信息
const currentRouteMeta = computed(() => {
  return route.meta || {};
});
</script>

<style scoped>
.user-center-layout {
  height: calc(100vh - 68px); /* 减去头部高度 */
  overflow: hidden;
  width: 100%;
}

.el-container {
  height: 100%;
  overflow: hidden;
}

.user-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
}

.user-menu {
  flex-grow: 1;
  border-right: none;
  overflow-y: auto;
}

.el-main {
  background-color: var(--el-bg-color);
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.welcome-content h2 {
  font-size: 24px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.welcome-content p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}
</style> 