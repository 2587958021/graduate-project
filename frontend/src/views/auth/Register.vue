<template>
    <div class="register-container">
        <el-card class="register-card">
            <template #header>
                <h2>注册账号</h2>
            </template>
            
            <el-form 
                ref="registerForm"
                :model="formData"
                :rules="rules"
                label-position="top"
            >
                <el-form-item label="用户名" prop="username">
                    <el-input 
                        v-model="formData.username"
                        placeholder="请输入用户名（3-20个字符）"
                    >
                        <template #prefix>
                            <el-icon><user /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <el-form-item label="邮箱" prop="email">
                    <el-input 
                        v-model="formData.email"
                        placeholder="请输入邮箱地址"
                    >
                        <template #prefix>
                            <el-icon><message /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <el-form-item label="密码" prop="password">
                    <el-input 
                        v-model="formData.password"
                        type="password"
                        placeholder="请输入密码（至少6个字符）"
                        show-password
                    >
                        <template #prefix>
                            <el-icon><lock /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input 
                        v-model="formData.confirmPassword"
                        type="password"
                        placeholder="请再次输入密码"
                        show-password
                    >
                        <template #prefix>
                            <el-icon><lock /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                
                <el-form-item>
                    <el-button 
                        type="primary" 
                        class="submit-btn"
                        :loading="loading"
                        @click="handleSubmit"
                    >
                        注册
                    </el-button>
                </el-form-item>
                
                <div class="form-footer">
                    已有账号？
                    <router-link to="/login">立即登录</router-link>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Message, Lock } from '@element-plus/icons-vue';
import authAPI from '../../api/auth';

export default {
    name: 'RegisterView',
    components: {
        User,
        Message,
        Lock
    },
    setup() {
        const router = useRouter();
        const registerForm = ref(null);
        const loading = ref(false);
        
        const formData = reactive({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        
        const validatePass = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请输入密码'));
            } else if (value.length < 6) {
                callback(new Error('密码长度不能小于6个字符'));
            } else {
                if (formData.confirmPassword !== '') {
                    registerForm.value.validateField('confirmPassword');
                }
                callback();
            }
        };
        
        const validatePass2 = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入密码'));
            } else if (value !== formData.password) {
                callback(new Error('两次输入密码不一致'));
            } else {
                callback();
            }
        };
        
        const rules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' },
                { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
            ],
            email: [
                { required: true, message: '请输入邮箱地址', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
            ],
            password: [
                { validator: validatePass, trigger: 'blur' }
            ],
            confirmPassword: [
                { validator: validatePass2, trigger: 'blur' }
            ]
        };
        
        const handleSubmit = async () => {
            if (!registerForm.value) return;
            
            try {
                await registerForm.value.validate();
                loading.value = true;
                
                const response = await authAPI.register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
                
                if (response.data.success) {
                    ElMessage.success('注册成功！');
                    router.push('/login');
                }
            } catch (error) {
                console.error('注册失败:', error);
                ElMessage.error(error.response?.data?.message || '注册失败，请重试');
            } finally {
                loading.value = false;
            }
        };
        
        return {
            registerForm,
            formData,
            rules,
            loading,
            handleSubmit
        };
    }
};
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 60px);
    padding: 20px;
    background-color: #f5f7fa;
}

.register-card {
    width: 100%;
    max-width: 400px;
}

.register-card :deep(.el-card__header) {
    text-align: center;
    padding: 20px;
}

.register-card :deep(.el-card__header h2) {
    margin: 0;
    color: #303133;
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