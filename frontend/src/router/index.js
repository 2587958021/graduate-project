import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/Login.vue')
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/auth/Register.vue')
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/auth/ForgotPassword.vue')
    },
    {
        path: '/help/guides',
        name: 'HelpGuides',
        component: () => import('../views/help/UserGuide.vue')
    },
    {
        path: '/ai-assistant',
        name: 'AIAssistant',
        component: () => import('../views/ai/AIAssistant.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/courses',
        name: 'Courses',
        component: () => import('../views/courses/Courses.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/practice',
        name: 'Practice',
        component: () => import('../views/exercises/Practice.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/exercises',
        name: 'Exercises',
        component: () => import('../views/exercises/Practice.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/exercises/:id',
        name: 'ExerciseDetail',
        component: () => import('../views/exercises/ExerciseTest.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/exercise-history',
        name: 'ExerciseHistory',
        component: () => import('../views/exercises/ExerciseHistory.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/course-player/:courseId/:chapterId/:lessonId',
        name: 'CoursePlayer',
        component: () => import('../views/courses/CoursePlayer.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/user',
        component: () => import('../views/user/UserLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'User',
                component: () => import('../views/user/UserProfile.vue')
            },
            {
                path: 'settings',
                name: 'UserSettings',
                component: () => import('../views/user/UserSettings.vue')
            },
            {
                path: 'statistics',
                name: 'UserStatistics',
                component: () => import('../views/user/ExerciseStatistics.vue')
            },
            {
                path: 'mistakes',
                name: 'UserMistakes',
                component: () => import('../views/user/UserMistakes.vue')
            }
        ]
    },
    {
        path: '/admin',
        component: () => import('../views/admin/AdminLayout.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
            {
                path: 'courses',
                name: 'AdminCourses',
                component: () => import('../views/admin/courses/CourseManager.vue'),
                meta: { requiresAuth: true, requiresAdmin: true, title: '课程管理' }
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('../views/admin/users/UserManager.vue'),
                meta: { requiresAuth: true, requiresAdmin: true, title: '用户管理' }
            },
            {
                path: 'exercises',
                name: 'AdminExercises',
                component: () => import('../views/admin/exercises/ExerciseManager.vue'),
                meta: { requiresAuth: true, requiresAdmin: true, title: '练习管理' }
            },
            {
                path: 'statistics',
                name: 'AdminStatistics',
                component: () => import('../views/admin/statistics/StatisticsManager.vue'),
                meta: { requiresAuth: true, requiresAdmin: true, title: '数据统计' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    // 检查路由是否需要认证
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
    
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    if (requiresAuth && !token) {
        // 需要认证但没有token，重定向到登录页
        next('/login')
    } else if (requiresAdmin) {
        // 检查是否为管理员
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role === 'admin') {
                next()
            } else {
                // 不是管理员，重定向到首页
                next('/')
            }
        } else {
            // 没有用户信息，重定向到登录页
            next('/login')
        }
    } else {
        next()
    }
})

export default router