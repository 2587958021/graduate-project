<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>设置与帮助</h2>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else>
        <!-- 账户设置 -->
        <div class="settings-section">
          <h3>账户设置</h3>
          
          <!-- 密码修改 -->
          <el-collapse accordion>
            <el-collapse-item title="密码修改" name="password">
              <el-form 
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
                class="settings-form"
              >
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input 
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    placeholder="请输入当前密码"
                    show-password
                  ></el-input>
                </el-form-item>
                
                <el-form-item label="新密码" prop="newPassword">
                  <el-input 
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    placeholder="请输入新密码"
                    show-password
                  ></el-input>
                </el-form-item>
                
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input 
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入新密码"
                    show-password
                  ></el-input>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="updatePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <!-- 帮助中心 -->
        <div class="settings-section">
          <h3>帮助中心</h3>
          <div class="help-center">
            <el-collapse accordion>
              <el-collapse-item title="如何修改个人资料？" name="faq1">
                <div class="faq-content">
                  <p>您可以在"个人信息"页面修改您的基本资料，包括头像、用户名和个人简介等信息。点击"编辑资料"按钮进行修改，完成后点击"保存"按钮即可。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="如何查看我的学习统计？" name="faq2">
                <div class="faq-content">
                  <p>您可以在"练习统计"页面查看您的学习数据统计，包括完成习题数量、正确率和做题时长等统计信息。系统会自动记录您的学习情况并更新统计数据。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="如何使用错题本？" name="faq3">
                <div class="faq-content">
                  <p>错题本会自动记录您做错的题目，您也可以手动添加题目到错题本中。您可以在"错题本"页面查看和复习这些题目，帮助您巩固知识点。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="如何使用AI学习助手？" name="faq4">
                <div class="faq-content">
                  <p>AI学习助手是本平台的特色功能，可以提供智能解析、学习建议、实时互动等服务。您可以在学习过程中随时点击"AI助手"进行对话，向AI提问或寻求帮助。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="忘记密码怎么办？" name="faq5">
                <div class="faq-content">
                  <p>如果您忘记了密码，可以在登录页面点击"忘记密码"链接，按照提示通过邮箱验证的方式重置密码。如果您仍无法访问您的账户，请联系我们的客服支持获取帮助。</p>
                </div>
              </el-collapse-item>
            </el-collapse>
            
            <div class="contact-support">
              <h4>联系客服</h4>
              <p>如果您有其他问题或需要帮助，请发送邮件至：<a href="mailto:2587958021@qq.com">2587958021@qq.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 加载状态
const loading = ref(false);

// 表单引用
const passwordFormRef = ref(null);

// 密码表单数据
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能小于8个字符', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 
      message: '密码必须包含大小写字母和数字', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 更新密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 这里可以调用API更新密码
      console.log('更新密码:', passwordForm);
      ElMessage.success('密码修改成功');
      
      // 清空表单
      passwordForm.currentPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      passwordFormRef.value.resetFields();
    }
  });
};

// 初始化
onMounted(() => {
  loading.value = true;
  
  // 模拟从API获取设置数据
  setTimeout(() => {
    // 在实际项目中会从API获取数据
    loading.value = false;
  }, 800);
});
</script>

<style scoped>
.settings-container {
  width: 100%;
}

.settings-card {
  margin-bottom: 24px;
}

.card-header {
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.loading-container {
  padding: 20px 0;
}

.settings-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
  border-left: 4px solid var(--el-color-primary);
  padding-left: 12px;
}

.settings-form {
  max-width: 500px;
}

.help-center {
  margin-top: 16px;
}

.faq-content {
  padding: 8px 16px;
  color: var(--el-text-color-regular);
}

.contact-support {
  margin-top: 24px;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.contact-support h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
}

.contact-support p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .settings-form {
    max-width: 100%;
  }
}
</style> 