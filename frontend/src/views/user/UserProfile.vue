<template>
  <div class="user-profile-container">
    <!-- 学习功能快速入口 -->
    <el-card class="profile-card quick-links-card">
      <template #header>
        <div class="card-header">
          <h2>学习统计</h2>
        </div>
      </template>

      <div class="quick-links">
        <router-link to="/user/statistics" class="quick-link-item">
          <div class="quick-link-icon">
            <el-icon>
              <DataAnalysis />
            </el-icon>
          </div>
          <div class="quick-link-content">
            <h3>学习数据统计</h3>
            <p>查看你的学习时长、完成习题数量和正确率等统计信息</p>
          </div>
          <el-button type="primary" plain>查看统计</el-button>
        </router-link>
      </div>
    </el-card>

    <!-- 基本信息编辑卡片 -->
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>基本信息编辑</h2>
          <el-button type="primary" @click="startEditing" v-if="!isEditing">编辑资料</el-button>
          <div v-else>
            <el-button type="success" @click="saveProfile">保存</el-button>
            <el-button @click="cancelEditing">取消</el-button>
          </div>
        </div>
      </template>

      <div class="profile-content">
        <div class="profile-avatar">
          <el-avatar :src="form.avatar || defaultAvatar" :size="120"></el-avatar>
          <el-button v-if="isEditing" class="change-avatar-btn" size="small" @click="handleAvatarClick">
            更换头像
          </el-button>
          <input type="file" ref="fileInput" style="display: none;" accept="image/*" @change="handleFileChange" />
        </div>

        <div class="profile-form">
          <el-form :model="form" label-width="100px" :disabled="!isEditing">
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </el-form-item>

            <el-form-item label="个人简介">
              <el-input v-model="form.bio" type="textarea" :rows="4" placeholder="请输入个人简介" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <!-- 联系方式管理卡片 -->
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>联系方式管理</h2>
          <el-button type="primary" @click="startEditingContact" v-if="!isEditingContact">编辑联系方式</el-button>
          <div v-else>
            <el-button type="success" @click="saveContact">保存</el-button>
            <el-button @click="cancelEditingContact">取消</el-button>
          </div>
        </div>
      </template>

      <div class="contact-form">
        <el-form :model="contactForm" label-width="100px" :disabled="!isEditingContact">
          <el-form-item label="邮箱">
            <el-input v-model="contactForm.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="手机号码">
            <el-input v-model="contactForm.phone" placeholder="请输入手机号码" />
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../store/auth';
import { ElMessage } from 'element-plus';
import { DataAnalysis } from '@element-plus/icons-vue';
import userAPI from '../../api/users';

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const authStore = useAuthStore();
const isEditing = ref(false);
const isEditingContact = ref(false);
const fileInput = ref(null);

// 基本信息表单
const form = ref({
  username: '',
  bio: '',
  avatar: ''
});

// 联系方式表单
const contactForm = ref({
  email: '',
  phone: ''
});

// 初始化表单数据
onMounted(async () => {
  if (authStore.user) {
    form.value = {
      username: authStore.user.username || '',
      bio: authStore.user.bio || '',
      avatar: authStore.user.avatar || defaultAvatar
    };

    contactForm.value = {
      email: authStore.user.email || '',
      phone: authStore.user.phone || ''
    };
  }
});

// 开始编辑基本信息
const startEditing = () => {
  isEditing.value = true;
};

// 取消编辑基本信息
const cancelEditing = () => {
  isEditing.value = false;
  // 重置表单
  if (authStore.user) {
    form.value = {
      username: authStore.user.username || '',
      bio: authStore.user.bio || '',
      avatar: authStore.user.avatar || defaultAvatar
    };
  }
};

// 开始编辑联系方式
const startEditingContact = () => {
  isEditingContact.value = true;
};

// 取消编辑联系方式
const cancelEditingContact = () => {
  isEditingContact.value = false;
  // 重置联系方式表单
  if (authStore.user) {
    contactForm.value = {
      email: authStore.user.email || '',
      phone: authStore.user.phone || ''
    };
  }
};

// 保存基本信息
const saveProfile = async () => {
  try {
    // 这里可以添加更新用户资料的 API 请求
    // await updateUserProfile(form.value);

    // 模拟更新成功
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新 authStore 中的用户信息
    authStore.user = {
      ...authStore.user,
      ...form.value
    };

    ElMessage.success('个人资料更新成功');
    isEditing.value = false;
  } catch (error) {
    console.error('更新个人资料失败', error);
    ElMessage.error('更新个人资料失败，请重试');
  }
};

// 保存联系方式
const saveContact = async () => {
  try {
    // 这里可以添加更新联系方式的 API 请求
    // await updateUserContact(contactForm.value);

    // 模拟更新成功
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新 authStore 中的用户信息
    authStore.user = {
      ...authStore.user,
      ...contactForm.value
    };

    ElMessage.success('联系方式更新成功');
    isEditingContact.value = false;
  } catch (error) {
    console.error('更新联系方式失败', error);
    ElMessage.error('更新联系方式失败，请重试');
  }
};

// 处理头像点击事件
const handleAvatarClick = () => {
  // 触发文件输入框的点击事件
  fileInput.value.click();
};

// 处理文件变化事件
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.log('未选择文件');
    return;
  }

  console.log('选择的文件:', file.name, '类型:', file.type, '大小:', file.size);

  // 检查文件类型和大小
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('头像必须是图片格式!');
    return;
  }

  if (!isLt5M) {
    ElMessage.error('头像大小不能超过 5MB!');
    return;
  }

  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('avatar', file);
    console.log('已创建FormData并添加文件');

    // 显示上传中提示
    ElMessage.info('正在上传头像，请稍候...');

    // 调用API上传头像
    console.log('开始调用上传API...');
    const response = await userAPI.uploadAvatar(formData);
    console.log('上传API响应:', response);

    if (response.success) {
      console.log('上传成功，处理响应数据:', response.data);

      // 更新头像URL，添加安全检查
      let avatarUrl = '';

      try {
        if (response.data && response.data.fullUrl) {
          console.log('使用fullUrl:', response.data.fullUrl);
          avatarUrl = response.data.fullUrl;
        } else if (response.data && response.data.url) {
          console.log('使用url:', response.data.url);
          avatarUrl = `http://localhost:3000${response.data.url}`;
        } else if (response.data && response.data.user && response.data.user.avatar) {
          console.log('使用user.avatar:', response.data.user.avatar);
          // 如果返回了用户对象且包含avatar
          avatarUrl = response.data.user.avatar.startsWith('http')
            ? response.data.user.avatar
            : `http://localhost:3000${response.data.user.avatar}`;
        } else if (typeof response.data === 'string' && response.data.includes('/')) {
          // 可能直接返回了路径
          console.log('响应数据可能是路径:', response.data);
          avatarUrl = response.data.startsWith('http')
            ? response.data
            : `http://localhost:3000${response.data}`;
        }
      } catch (err) {
        console.error('处理头像URL时出错:', err);
      }

      // 只有在成功获取到URL时才更新
      if (avatarUrl) {
        console.log('设置新头像URL:', avatarUrl);
        form.value.avatar = avatarUrl;

        // 更新authStore中的用户头像
        if (authStore.user) {
          authStore.user = {
            ...authStore.user,
            avatar: avatarUrl
          };
          localStorage.setItem('user', JSON.stringify(authStore.user));
          console.log('已更新用户头像并保存到localStorage');
        }

        ElMessage.success('头像上传成功');
      } else {
        console.error('服务器返回数据中没有有效的头像URL:', response.data);
        // 尝试使用备用方法获取URL
        try {
          if (response.data) {
            const backupUrl = `/uploads/avatars/${file.name}`;
            console.log('尝试使用备用URL:', backupUrl);
            form.value.avatar = `http://localhost:3000${backupUrl}`;

            if (authStore.user) {
              authStore.user = {
                ...authStore.user,
                avatar: form.value.avatar
              };
              localStorage.setItem('user', JSON.stringify(authStore.user));
            }

            ElMessage.success('头像已上传，使用备用URL');
          } else {
            ElMessage.warning('头像已上传，但无法获取URL，请刷新页面');
          }
        } catch (err) {
          console.error('使用备用URL时出错:', err);
          ElMessage.warning('头像已上传，但无法获取URL，请刷新页面');
        }
      }
    } else {
      console.error('上传失败:', response.message);
      ElMessage.error(response.message || '头像上传失败');
    }
  } catch (error) {
    console.error('头像上传错误:', error);
    ElMessage.error('头像上传失败，请重试');
  } finally {
    // 清空文件输入框，以便可以再次选择同一文件
    event.target.value = '';
    console.log('已清空文件输入框');
  }
};
</script>

<style scoped>
.user-profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.profile-content {
  display: flex;
  align-items: flex-start;
  margin-top: 20px;
}

.profile-avatar {
  margin-right: 40px;
  text-align: center;
  position: relative;
}

.change-avatar-btn {
  margin-top: 10px;
}

.profile-form {
  flex-grow: 1;
}

.quick-links-card {
  margin-bottom: 30px;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.quick-link-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-decoration: none;
  color: inherit;
}

.quick-link-icon {
  font-size: 32px;
  color: #409EFF;
  margin-right: 16px;
}

.quick-link-content {
  flex-grow: 1;
}

.quick-link-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.quick-link-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>