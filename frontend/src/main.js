import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './assets/css/main.css'
import { useAuthStore } from './store/auth'
import { initBilibiliFixes } from './utils/bilibiliFixes'

// 初始化B站视频错误处理
initBilibiliFixes()

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    // 排除问号图标组件
    if (key !== 'QuestionFilled' && key !== 'Question' && key !== 'QuestionCircle') {
        app.component(key, component)
    }
}

// 配置警告处理器
app.config.warnHandler = (msg, instance, trace) => {
    // 忽略 Element Plus 的 type.text 废弃警告
    if (msg.includes('type.text is about to be deprecated')) {
        return
    }
    // 忽略B站相关警告
    if (msg.includes('bilibili') || msg.includes('fingerprint')) {
        return
    }
    // 保留其他警告
    console.warn('[Vue warn]:', msg, instance, trace)
}

app.use(router)
app.use(pinia)
app.use(ElementPlus, {
  locale: zhCn
})

// 初始化认证信息
const initAuth = async () => {
  const authStore = useAuthStore()
  // 如果有token但没有用户信息，尝试获取用户信息
  if (authStore.token && !authStore.user) {
    // 尝试从本地存储获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        authStore.user = JSON.parse(userStr)
        console.log('从本地存储恢复用户信息:', authStore.user)
      } catch (e) {
        console.error('解析本地存储的用户信息失败:', e)
      }
    }
    
    // 如果本地存储没有用户信息，则从服务器获取
    if (!authStore.user) {
      try {
        console.log('应用启动时尝试获取用户信息...')
        await authStore.fetchCurrentUser()
        console.log('成功获取并设置用户信息')
      } catch (error) {
        console.error('获取用户信息失败，可能需要重新登录:', error)
        // 即使获取失败，也不跳转到登录页，让路由守卫处理这种情况
      }
    }
  }
}

// 启动应用前初始化认证信息
initAuth().finally(() => {
  app.mount('#app')
})
