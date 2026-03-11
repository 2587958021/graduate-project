<template>
    <div class="forgot-password-container">
        <el-card class="forgot-password-card">
            <template #header>
                <h2>找回密码</h2>
            </template>
            
            <div v-if="step === 1">
                <el-form 
                    ref="emailForm"
                    :model="formData"
                    :rules="emailRules"
                    label-position="top"
                >
                    <el-form-item label="邮箱地址" prop="email">
                        <el-input 
                            v-model="formData.email"
                            placeholder="请输入注册时使用的邮箱地址"
                        >
                            <template #prefix>
                                <el-icon><message /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            class="submit-btn"
                            :loading="loading"
                            @click="handleSendCode"
                        >
                            发送验证码
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
            
            <div v-else-if="step === 2">
                <el-form 
                    ref="verifyForm"
                    :model="formData"
                    :rules="verifyRules"
                    label-position="top"
                >
                    <el-form-item label="验证码" prop="code">
                        <el-input 
                            v-model="formData.code"
                            placeholder="请输入邮箱收到的验证码"
                            maxlength="6"
                        >
                            <template #prefix>
                                <el-icon><key /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input 
                            v-model="formData.newPassword"
                            type="password"
                            placeholder="请输入新密码（至少6个字符）"
                            show-password
                        >
                            <template #prefix>
                                <el-icon><lock /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    
                    <el-form-item label="确认新密码" prop="confirmPassword">
                        <el-input 
                            v-model="formData.confirmPassword"
                            type="password"
                            placeholder="请再次输入新密码"
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
                            @click="handleResetPassword"
                        >
                            重置密码
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
            
            <div v-else class="success-step">
                <el-result
                    icon="success"
                    title="密码重置成功"
                    sub-title="请使用新密码登录"
                >
                    <template #extra>
                        <el-button type="primary" @click="$router.push('/login')">
                            去登录
                        </el-button>
                    </template>
                </el-result>
            </div>
            
            <div class="form-footer">
                <router-link to="/login">返回登录</router-link>
            </div>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Message, Key, Lock } from '@element-plus/icons-vue';
import authAPI from '../../api/auth';

export default {
    name: 'ForgotPasswordView',
    components: {
        Message,
        Key,
        Lock
    },
    setup() {
        const router = useRouter();
        const emailForm = ref(null);
        const verifyForm = ref(null);
        const loading = ref(false);
        const step = ref(1);
        
        const formData = reactive({
            email: '',
            code: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        const validatePass = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请输入新密码'));
            } else if (value.length < 6) {
                callback(new Error('密码长度不能小于6个字符'));
            } else {
                if (formData.confirmPassword !== '') {
                    verifyForm.value.validateField('confirmPassword');
                }
                callback();
            }
        };
        
        const validatePass2 = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入新密码'));
            } else if (value !== formData.newPassword) {
                callback(new Error('两次输入密码不一致'));
            } else {
                callback();
            }
        };
        
        const emailRules = {
            email: [
                { required: true, message: '请输入邮箱地址', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
            ]
        };
        
        const verifyRules = {
            code: [
                { required: true, message: '请输入验证码', trigger: 'blur' },
                { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
            ],
            newPassword: [
                { validator: validatePass, trigger: 'blur' }
            ],
            confirmPassword: [
                { validator: validatePass2, trigger: 'blur' }
            ]
        };
        
        const handleSendCode = async () => {
            if (!emailForm.value) return;
            
            try {
                await emailForm.value.validate();
                loading.value = true;
                
                const response = await authAPI.sendResetCode({
                    email: formData.email
                });
                
                if (response.data.success) {
                    ElMessage.success('验证码已发送到您的邮箱');
                    step.value = 2;
                }
            } catch (error) {
                console.error('发送验证码失败:', error);
                ElMessage.error(error.response?.data?.message || '发送验证码失败，请重试');
            } finally {
                loading.value = false;
            }
        };
        
        const handleResetPassword = async () => {
            if (!verifyForm.value) return;
            
            try {
                await verifyForm.value.validate();
                loading.value = true;
                
                const response = await authAPI.resetPassword({
                    email: formData.email,
                    code: formData.code,
                    newPassword: formData.newPassword
                });
                
                if (response.data.success) {
                    ElMessage.success('密码重置成功');
                    step.value = 3;
                }
            } catch (error) {
                console.error('重置密码失败:', error);
                ElMessage.error(error.response?.data?.message || '重置密码失败，请重试');
            } finally {
                loading.value = false;
            }
        };
        
        return {
            emailForm,
            verifyForm,
            formData,
            loading,
            step,
            emailRules,
            verifyRules,
            handleSendCode,
            handleResetPassword
        };
    }
};
</script>

<style scoped>
.forgot-password-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 60px);
    padding: 20px;
    background-color: #f5f7fa;
}

.forgot-password-card {
    width: 100%;
    max-width: 400px;
}

.forgot-password-card :deep(.el-card__header) {
    text-align: center;
    padding: 20px;
}

.forgot-password-card :deep(.el-card__header h2) {
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

.success-step {
    padding: 20px 0;
}
</style> 