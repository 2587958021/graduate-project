<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo-container">
        <router-link to="/" class="logo">
          <span class="logo-text">前端学习平台</span>
        </router-link>
      </div>

      <div class="nav-container">
        <nav class="main-nav">
          <router-link to="/" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/courses" class="nav-item" active-class="active">课程中心</router-link>
          <router-link to="/practice" class="nav-item" active-class="active">练习中心</router-link>
          <router-link v-if="authStore.isAuthenticated" to="/ai-assistant" class="nav-item" active-class="active">AI助手</router-link>
          <!-- 个人中心直接链接，不使用下拉菜单 -->
          <router-link v-if="authStore.isAuthenticated" to="/user" class="nav-item" active-class="active">个人中心</router-link>
          <!-- 管理入口，仅管理员可见 -->
          <router-link 
            v-if="authStore.isAuthenticated && authStore.user?.role === 'admin'" 
            to="/admin/courses" 
            class="nav-item admin-link" 
            active-class="active"
          >
            管理控制台
          </router-link>
        </nav>
      </div>

      <div class="right-container">
        <!-- 未登录用户显示 -->
        <div v-if="!authStore.isAuthenticated" class="auth-buttons">
          <router-link to="/login" class="btn-login">登录</router-link>
          <router-link to="/register" class="btn-register">注册</router-link>
        </div>
        <!-- 已登录用户显示用户头像和下拉菜单 -->
        <div v-else class="user-dropdown">
          <el-dropdown trigger="click">
            <div class="user-info">
              <span class="username">{{ authStore.user?.username || '用户' }}</span>
              <el-avatar 
                :size="32" 
                :src="authStore.user?.avatar || ''" 
                class="user-avatar"
              >
                {{ authStore.user?.username ? authStore.user.username.charAt(0).toUpperCase() : 'U' }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/user" class="dropdown-link">个人信息</router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/user/settings" class="dropdown-link">设置</router-link>
                </el-dropdown-item>
                <!-- 管理员控制台入口 -->
                <el-dropdown-item v-if="authStore.user?.role === 'admin'">
                  <router-link to="/admin/courses" class="dropdown-link admin-dropdown-link">管理控制台</router-link>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <span class="logout-text">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User } from '@element-plus/icons-vue';

// 状态管理
const router = useRouter();
const authStore = useAuthStore();

// 退出登录处理
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout();
    ElMessage.success('已成功退出登录');
    router.push('/login');
  }).catch(() => {
    // 取消退出登录
  });
};
</script>

<style scoped>
.app-header {
  background-color: var(--card-background);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-speed) ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 24px;
  height: 68px;
}

/* Logo样式 */
.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  position: relative;
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #4a6cf7, #00bcf9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

/* 导航菜单 */
.nav-container {
  margin: 0 20px;
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-nav {
  display: flex;
  gap: 6px;
}

.nav-item {
  padding: 8px 16px;
  color: var(--text-regular);
  text-decoration: none;
  font-weight: 500;
  border-radius: 24px;
  transition: all 0.2s ease;
  position: relative;
  font-size: 15px;
  display: inline-block;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--primary-color);
  background-color: rgba(74, 108, 247, 0.08);
}

.nav-item.active {
  color: var(--primary-color);
  font-weight: 600;
  background-color: rgba(74, 108, 247, 0.08);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

/* 右侧容器 */
.right-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 认证按钮 */
.auth-buttons {
  display: flex;
  gap: 10px;
}

.btn-login, .btn-register, .btn-logout {
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-login {
  color: var(--primary-color);
  background: transparent;
  border: 1px solid var(--primary-color);
}

.btn-login:hover {
  background-color: rgba(74, 108, 247, 0.08);
}

.btn-register {
  color: white;
  background: linear-gradient(135deg, #4a6cf7, #00bcf9);
  border: none;
  box-shadow: 0 2px 10px rgba(74, 108, 247, 0.3);
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(74, 108, 247, 0.4);
}

.btn-logout {
  color: var(--danger-color);
  background: transparent;
  border: 1px solid var(--danger-color);
}

.btn-logout:hover {
  background-color: rgba(247, 74, 74, 0.08);
}

/* 用户下拉菜单 */
.user-dropdown {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 24px;
  transition: all 0.2s ease;
}

.user-info:hover {
  background-color: rgba(74, 108, 247, 0.08);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-regular);
}

.user-avatar {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.dropdown-link {
  display: block;
  width: 100%;
  color: inherit;
  text-decoration: none;
}

.logout-text {
  color: var(--danger-color);
}

.admin-link {
  color: #ff6b00;
}

.admin-link:hover {
  color: #ff6b00;
  background-color: rgba(255, 107, 0, 0.08);
}

.admin-link.active {
  color: #ff6b00;
  background-color: rgba(255, 107, 0, 0.08);
}

.admin-link.active::after {
  background-color: #ff6b00;
}

.admin-dropdown-link {
  color: #ff6b00;
  font-weight: 500;
}
</style> 