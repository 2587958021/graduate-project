<template>
  <div class="user-manager-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
    </div>

    <div class="filter-section">
      <el-row :gutter="16" class="filter-row">
        <el-col :span="5">
          <el-select v-model="roleFilter" placeholder="角色" clearable @change="fetchUsers" class="filter-select">
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="statusFilter" placeholder="状态" clearable @change="fetchUsers" class="filter-select">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :span="10">
          <div class="search-wrapper">
            <el-input v-model="filters.search" placeholder="搜索用户" clearable @keyup.enter="fetchUsers">
              <template #suffix>
                <el-icon class="search-icon" @click="fetchUsers"><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </el-col>
        <el-col :span="4" class="reset-col">
          <el-button @click="resetFilters" type="info" plain>
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="error" class="error-container">
      <el-empty description="加载失败" :image-size="200">
        <template #description>
          <p>{{ error }}</p>
        </template>
        <el-button type="primary" @click="fetchUsers">重试</el-button>
      </el-empty>
    </div>

    <el-table
      v-else
      :data="users"
      stripe
      style="width: 100%"
      border
      v-loading="tableLoading"
    >
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag 
            type="success" 
            v-if="row.role === 'admin'" 
            @click="filterByRole(row.role)"
            class="clickable-tag"
          >管理员</el-tag>
          <el-tag 
            v-else 
            @click="filterByRole(row.role)"
            class="clickable-tag"
          >学生</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag 
            type="success" 
            v-if="row.status === 'active'" 
            @click="filterByStatus(row.status)"
            class="clickable-tag"
          >正常</el-tag>
          <el-tag 
            type="danger" 
            v-else 
            @click="filterByStatus(row.status)"
            class="clickable-tag"
          >禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="最近登录" width="180">
        <template #default="{ row }">
          {{ row.lastLogin ? formatDate(row.lastLogin) : '从未登录' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="showUserDetails(row)" type="info" plain>
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button
              size="small"
              type="primary"
              plain
              @click="editUser(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              plain
              @click="toggleUserStatus(row)"
              :disabled="row.role === 'admin' && row.status === 'active'"
            >
              <el-icon><component :is="row.status === 'active' ? 'Lock' : 'Unlock'" /></el-icon>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="totalPages > 1">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="userDetailsVisible"
      title="用户详情"
      width="580px"
    >
      <div v-if="selectedUser" class="user-details">
        <div class="user-avatar">
          <el-avatar :size="100" :src="selectedUser.avatar">
            {{ selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : 'U' }}
          </el-avatar>
        </div>
        <div class="user-info-list">
          <div class="info-item">
            <span class="label">用户名:</span>
            <span class="value">{{ selectedUser.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">邮箱:</span>
            <span class="value">{{ selectedUser.email }}</span>
          </div>
          <div class="info-item">
            <span class="label">角色:</span>
            <span class="value">
              <el-tag type="success" v-if="selectedUser.role === 'admin'">管理员</el-tag>
              <el-tag v-else>学生</el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <span class="value">
              <el-tag type="success" v-if="selectedUser.status === 'active'">正常</el-tag>
              <el-tag type="danger" v-else>禁用</el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="label">注册时间:</span>
            <span class="value">{{ formatDate(selectedUser.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">最近登录:</span>
            <span class="value">{{ selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : '从未登录' }}</span>
          </div>
        </div>
        <div class="user-stats">
          <h3>学习统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ selectedUser.stats?.coursesCompleted || 0 }}</div>
              <div class="stat-label">完成课程</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ selectedUser.stats?.exercisesCompleted || 0 }}</div>
              <div class="stat-label">完成练习</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ selectedUser.stats?.correctRate ? (selectedUser.stats.correctRate + '%') : '0%' }}</div>
              <div class="stat-label">正确率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ selectedUser.stats?.totalLearnTime || '0h' }}</div>
              <div class="stat-label">学习时长</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户"
      width="500px"
    >
      <el-form
        v-if="editingUser"
        ref="userFormRef"
        :model="editingUser"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editingUser.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editingUser.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editingUser.role" @change="handleRoleChange">
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editingUser.status">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" :disabled="editingUser.role === 'admin'" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUserEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, View, Edit, Lock, Unlock, Refresh } from '@element-plus/icons-vue';
import api from '@/api/api.js';
import usersAPI from '@/api/users.js';

// 状态变量
const users = ref([]);
const loading = ref(true);
const tableLoading = ref(false);
const selectedUser = ref(null);
const editingUser = ref(null);
const userDetailsVisible = ref(false);
const editDialogVisible = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);
const error = ref(null);

// 筛选条件
const filters = reactive({
  search: ''
});
const roleFilter = ref('');
const statusFilter = ref('');

// 用户表单规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: filters.search
    };
    
    // 处理角色筛选条件
    if (roleFilter.value) {
      params.roles = roleFilter.value;
    }
    
    // 处理状态筛选条件
    if (statusFilter.value) {
      params.statuses = statusFilter.value;
    }
    
    console.log('获取用户列表，请求参数:', params);
    
    const response = await usersAPI.getAllUsers(params);
    
    console.log('原始API响应:', response);
    
    // 检查响应格式并适配
    if (response && response.success) {
      console.log('获取用户响应:', response.data);
      
      // 检查数据结构
      if (Array.isArray(response.data)) {
        // 直接是数组格式
        users.value = response.data;
        total.value = response.data.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 标准分页格式
        users.value = response.data.data;
        total.value = response.data.total || response.data.count || response.data.data.length;
      } else {
        // 尝试直接使用response.data
        users.value = Array.isArray(response.data) ? response.data : [];
        total.value = users.value.length;
        console.warn('无法识别的响应格式，尝试直接使用response.data');
      }
      
      totalPages.value = response.data.totalPages || Math.ceil(total.value / pageSize.value) || 1;
      
      console.log('处理后的用户数据:', users.value);
      console.log('总数:', total.value, '总页数:', totalPages.value);
    } else {
      error.value = response.message || '获取用户列表失败';
      ElMessage.error(error.value);
    }
  } catch (err) {
    console.error('获取用户列表失败:', err);
    error.value = err.response?.data?.message || err.message || '获取用户列表失败';
    ElMessage.error(error.value);
    users.value = []; // 确保设置为空数组而不是undefined
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  roleFilter.value = '';
  statusFilter.value = '';
  filters.search = '';
  currentPage.value = 1;
  fetchUsers();
  ElMessage.success('已重置筛选条件');
};

// 页码改变处理
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchUsers();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 显示用户详情
const showUserDetails = async (user) => {
  tableLoading.value = true;
  
  try {
    const response = await usersAPI.getUserDetails(user._id);
    
    if (response.success) {
      selectedUser.value = response.data.user;
      selectedUser.value.stats = response.data.stats;
      userDetailsVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取用户详情失败');
    }
  } catch (err) {
    console.error('获取用户详情失败:', err);
    ElMessage.error('获取用户详情失败，请稍后再试');
  } finally {
    tableLoading.value = false;
  }
};

// 编辑用户
const editUser = (user) => {
  editingUser.value = { ...user };
  editDialogVisible.value = true;
};

// 处理角色变更
const handleRoleChange = () => {
  // 如果角色改为管理员，确保状态为正常
  if (editingUser.value.role === 'admin' && editingUser.value.status === 'disabled') {
    editingUser.value.status = 'active';
    ElMessage.info('管理员角色的用户状态已自动设置为正常');
  }
};

// 保存用户编辑
const saveUserEdit = async () => {
  if (!editingUser.value) return;
  
  // 再次检查管理员状态
  if (editingUser.value.role === 'admin' && editingUser.value.status === 'disabled') {
    editingUser.value.status = 'active';
    ElMessage.warning('管理员用户不能被禁用，状态已自动调整为正常');
  }
  
  tableLoading.value = true;
  
  try {
    const userData = {
      role: editingUser.value.role,
      status: editingUser.value.status
    };
    
    const response = await usersAPI.updateUser(
      editingUser.value._id,
      userData
    );
    
    if (response.success) {
      ElMessage.success('用户信息更新成功');
      editDialogVisible.value = false;
      
      // 更新列表中的用户数据
      const index = users.value.findIndex(u => u._id === editingUser.value._id);
      if (index !== -1) {
        users.value[index] = response.data;
      }
    } else {
      ElMessage.error(response.message || '更新用户失败');
    }
  } catch (err) {
    console.error('更新用户失败:', err);
    ElMessage.error('更新用户失败，请稍后再试');
  } finally {
    tableLoading.value = false;
  }
};

// 切换用户状态
const toggleUserStatus = async (user) => {
  // 如果是管理员且状态为活跃，不允许禁用
  if (user.role === 'admin' && user.status === 'active') {
    ElMessage.warning('系统不允许禁用管理员账户');
    return;
  }
  
  const newStatus = user.status === 'active' ? 'disabled' : 'active';
  const action = newStatus === 'active' ? '启用' : '禁用';
  
  ElMessageBox.confirm(
    `确定要${action}用户 ${user.username} 吗？`,
    `${action}用户`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: newStatus === 'active' ? 'success' : 'warning'
    }
  ).then(async () => {
    tableLoading.value = true;
    
    try {
      const response = await usersAPI.updateUser(
        user._id,
        { status: newStatus }
      );
      
      if (response.success) {
        ElMessage.success(`用户${action}成功`);
        
        // 立即更新列表中的用户数据
        const index = users.value.findIndex(u => u._id === user._id);
        if (index !== -1) {
          users.value[index].status = newStatus;
        }
        
        // 重新获取用户列表以确保数据同步
        fetchUsers();
      } else {
        ElMessage.error(response.message || `用户${action}失败`);
      }
    } catch (err) {
      console.error(`用户${action}失败:`, err);
      ElMessage.error(`用户${action}失败，请稍后再试`);
    } finally {
      tableLoading.value = false;
    }
  }).catch(() => {});
};

// 点击角色标签筛选
const filterByRole = (role) => {
  roleFilter.value = role;
  // 不再清空状态筛选，允许组合筛选
  currentPage.value = 1;  // 重置页码
  fetchUsers();           // 重新获取数据
  ElMessage.success(`已筛选角色: ${role === 'admin' ? '管理员' : '学生'}`);
};

// 点击状态标签筛选
const filterByStatus = (status) => {
  statusFilter.value = status;
  // 不再清空角色筛选，允许组合筛选
  currentPage.value = 1;       // 重置页码
  fetchUsers();                // 重新获取数据
  ElMessage.success(`已筛选状态: ${status === 'active' ? '正常' : '禁用'}`);
};

// 监听搜索框的输入，延迟执行搜索
let searchTimeout = null;
watch(() => filters.search, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 500); // 500ms延迟，减少频繁请求
});

// 初始化
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-manager-page {
  padding: 20px;
  height: 100%;
  overflow: visible; /* 不产生自己的滚动条 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.loading-container, .error-container {
  margin: 40px 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.search-icon {
  cursor: pointer;
}

.course-title-cell {
  display: flex;
  align-items: center;
}

.course-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  margin-right: 10px;
  border-radius: 4px;
}

.user-details {
  padding: 20px;
}

.user-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.user-info-list {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item .label {
  width: 100px;
  color: #606266;
}

.info-item .value {
  flex: 1;
  color: #303133;
}

.user-stats {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}

.user-stats h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  background-color: #fff;
  padding: 12px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: #606266;
}

.clickable-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable-tag:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.action-buttons .el-button {
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
  min-width: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons .el-icon {
  margin-right: 4px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #f9fafc;
}

:deep(.el-button--small) {
  padding: 8px 12px;
  font-weight: 500;
}
</style> 