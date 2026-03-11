// 异步处理中间件
// 包装异步控制器函数，统一处理错误
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 