<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="250px">
        <div class="admin-sidebar">
          <div class="sidebar-header">
            <h2>管理控制台</h2>
          </div>
          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
          >
            <el-menu-item index="/admin/courses">
              <el-icon><Document /></el-icon>
              <span>课程管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/exercises">
              <el-icon><Notebook /></el-icon>
              <span>练习管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/statistics">
              <el-icon><DataLine /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
          </el-menu>
          <div class="sidebar-footer">
            <el-button @click="goBack" plain>
              <el-icon><Back /></el-icon>
              返回前台
            </el-button>
          </div>
        </div>
      </el-aside>
      <el-container>
        <el-header>
          <div class="admin-header">
            <div class="header-title">
              <h1>{{ currentPageTitle }}</h1>
            </div>
            <div class="header-actions">
              <el-tooltip content="退出登录">
                <el-button @click="logout" circle>
                  <el-icon><SwitchButton /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </el-header>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { Document, User, Notebook, DataLine, Back, SwitchButton } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const activeMenu = ref('');

// 设置当前活动菜单
watch(() => route.path, (path) => {
  activeMenu.value = path;
}, { immediate: true });

// 计算当前页面标题
const currentPageTitle = computed(() => {
  return route.meta.title || '管理控制台';
});

// 返回前台
const goBack = () => {
  router.push('/');
};

// 退出登录
const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
}

.el-container {
  height: 100%;
  overflow: hidden;
}

.admin-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.sidebar-menu {
  flex-grow: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  overflow: hidden;
}

.admin-header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
  position: relative;
}
</style> 