import * as exercises from './exercises';
import * as courses from './courses';
import * as auth from './auth';
import * as user from './user';
import * as learning from './learning';
import * as ai from './ai'; // 导入AI相关API
import mistakeAPI from './mistakes';
import usersAPI from './users';

// 将所有API统一导出
export default {
    auth: auth,
    exercise: exercises,
    mistake: mistakeAPI,
    course: courses,
    users: usersAPI,
    user: user,
    learning: learning,
    ai // 导出AI相关API
}; 