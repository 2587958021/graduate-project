<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <h2>用户登录</h2>
            </template>
            
            <el-form 
                ref="loginForm"
                :model="formData"
                :rules="rules"
                label-position="top"
            >
                <el-form-item label="用户名/邮箱" prop="username">
                    <el-input 
                        v-model="formData.username"
                        placeholder="请输入用户名或邮箱"
                    >
                        <template #prefix>
                            <el-icon><user /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <el-form-item label="密码" prop="password">
                    <el-input 
                        v-model="formData.password"
                        type="password"
                        placeholder="请输入密码"
                        show-password
                        @keyup.enter="handleSubmit"
                    >
                        <template #prefix>
                            <el-icon><lock /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <div class="form-options">
                    <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                    <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
                </div>
                
                <el-form-item>
                    <el-button 
                        type="primary" 
                        class="submit-btn"
                        :loading="loading"
                        @click="handleSubmit"
                    >
                        登录
                    </el-button>
                </el-form-item>
                
                <div class="form-footer">
                    还没有账号？
                    <router-link to="/register">立即注册</router-link>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '../../store/auth';
import authAPI from '../../api/auth';

export default {
    name: 'LoginView',
    components: {
        User,
        Lock
    },
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loginForm = ref(null);
        const loading = ref(false);
        const rememberMe = ref(false);
        
        const formData = reactive({
            username: '',
            password: ''
        });
        
        const rules = {
            username: [
                { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' }
            ]
        };
        
        const handleSubmit = async () => {
            if (!loginForm.value) return;
            
            try {
                await loginForm.value.validate();
                loading.value = true;
                
                console.log('开始登录请求...');
                const response = await authAPI.login({
                    username: formData.username,
                    password: formData.password,
                    remember: rememberMe.value
                });
                
                console.log('登录响应:', response);
                
                // 简化响应处理逻辑
                if (response && response.success) {
                    // 从响应中获取token和用户信息
                    const token = response.data?.token;
                    const user = response.data?.user;
                    
                    if (token) {
                        console.log('设置认证信息, token:', token ? '已获取' : '未获取', 'user:', user ? '已获取' : '未获取');
                        
                        // 保存认证信息
                        authStore.setAuth(token, user);
                        
                        ElMessage.success('登录成功！正在跳转...');
                        
                        // 跳转到首页
                        setTimeout(() => {
                            console.log('尝试跳转到首页...');
                            router.push('/');
                        }, 500);
                    } else {
                        console.error('登录响应中缺少token:', response);
                        ElMessage.error('登录成功但获取用户信息失败，请重试');
                    }
                } else {
                    console.error('登录响应异常:', response);
                    ElMessage.error(response?.message || '登录失败，请重试');
                }
            } catch (error) {
                console.error('登录失败:', error);
                ElMessage.error(error.response?.data?.message || '登录失败，请重试');
            } finally {
                loading.value = false;
            }
        };
        
        return {
            loginForm,
            formData,
            rules,
            loading,
            rememberMe,
            handleSubmit
        };
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 60px);
    padding: 20px;
    background-color: #f5f7fa;
}

.login-card {
    width: 100%;
    max-width: 400px;
}

.login-card :deep(.el-card__header) {
    text-align: center;
    padding: 20px;
}

.login-card :deep(.el-card__header h2) {
    margin: 0;
    color: #303133;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.forgot-link {
    color: #409EFF;
    text-decoration: none;
}

.forgot-link:hover {
    color: #66b1ff;
}

.submit-btn {
    width: 100%;
    padding: 12px 0;
}

.form-footer {
    text-align: center;
    margin-top: 20px;
    color: #606266;
}

.form-footer a {
    color: #409EFF;
    text-decoration: none;
}

.form-footer a:hover {
    color: #66b1ff;
}
</style> 