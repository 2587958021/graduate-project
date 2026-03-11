<template>
  <div class="user-guide-container">
    <el-page-header @back="goBack" title="返回" content="使用指南" />
    
    <div class="guide-content">
      <div class="guide-header">
        <h1>前端学习平台使用指南</h1>
        <p class="guide-intro">欢迎使用前端学习平台！本指南将帮助您了解平台的主要功能和使用方法。</p>
      </div>
      
      <el-card class="guide-section">
        <template #header>
          <div class="section-header">
            <el-icon><School /></el-icon>
            <h2>1. 课程学习</h2>
          </div>
        </template>
        <div class="section-content">
          <h3>1.1 浏览课程</h3>
          <p>在首页或课程中心，您可以浏览所有可用的课程。课程按难度级别和主题分类，您可以根据自己的学习需求选择合适的课程。</p>
          
          <h3>1.2 课程详情</h3>
          <p>点击课程卡片进入课程详情页面，您可以查看课程大纲、章节内容和学习要求。</p>
          
          <h3>1.3 学习课程</h3>
          <p>点击"开始学习"或"继续学习"按钮进入课程学习界面。您可以观看视频教程、阅读文字内容，并完成课后练习。</p>
          
          <div class="guide-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>提示：学习进度会自动保存，您可以随时中断和继续学习。</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="guide-section">
        <template #header>
          <div class="section-header">
            <el-icon><DocumentChecked /></el-icon>
            <h2>2. 练习中心</h2>
          </div>
        </template>
        <div class="section-content">
          <h3>2.1 练习题库</h3>
          <p>练习中心提供丰富的前端开发练习题，包括HTML、CSS、JavaScript等多种类型的题目。</p>
          
          <h3>2.2 完成练习</h3>
          <p>选择合适的练习题，在线编写代码并提交。系统会自动评估您的答案并提供即时反馈。</p>
          
          <h3>2.3 查看解析</h3>
          <p>完成练习后，您可以查看详细的解题思路和标准答案，帮助您更好地理解知识点。</p>
          
          <div class="guide-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>提示：建议在学习完相关知识点后再尝试对应的练习题。</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="guide-section">
        <template #header>
          <div class="section-header">
            <el-icon><ChatLineRound /></el-icon>
            <h2>3. AI学习助手</h2>
          </div>
        </template>
        <div class="section-content">
          <div class="ai-feature-introduction">
            <p>我们的AI学习助手是基于先进大语言模型打造的智能辅导工具，能够全方位提升您的学习体验。</p>
          </div>
          
          <div class="ai-feature-grid">
            <div class="ai-feature-card">
              <div class="feature-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <h3>智能答疑解惑</h3>
              <p>无论是JavaScript闭包概念、React生命周期，还是CSS Grid布局问题，AI助手都能给予清晰专业的解答，消除学习障碍。</p>
            </div>
            
            <div class="ai-feature-card">
              <div class="feature-icon">
                <el-icon><Edit /></el-icon>
              </div>
              <h3>代码分析优化</h3>
              <p>提交您的代码片段，AI助手会深入分析代码结构，找出潜在问题，并提供优化建议，帮助您编写更高质量的代码。</p>
            </div>
            
            <div class="ai-feature-card">
              <div class="feature-icon">
                <el-icon><DocumentChecked /></el-icon>
              </div>
              <h3>个性化学习规划</h3>
              <p>根据您的学习进度和薄弱环节，AI助手会制定专属学习计划，推荐适合的课程和练习，让学习更有针对性。</p>
            </div>
            
            <div class="ai-feature-card">
              <div class="feature-icon">
                <el-icon><MagicStick /></el-icon>
              </div>
              <h3>项目实战指导</h3>
              <p>在实战项目开发中遇到困难？AI助手能提供技术选型建议、架构设计思路和问题排查方法，助您攻克项目难关。</p>
            </div>
          </div>
          
          <div class="ai-chat-demo">
            <h3 class="demo-title">AI助手对话示例</h3>
            <div class="chat-container">
              <div class="chat-message user-message">
                <div class="message-avatar">
                  <span>我</span>
                </div>
                <div class="message-content">
                  <p>请解释一下JavaScript中的Promise和async/await有什么区别？</p>
                </div>
              </div>
              
              <div class="chat-message ai-message">
                <div class="message-avatar">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="message-content">
                  <p>Promise和async/await都是JavaScript处理异步操作的方式，但有以下区别：</p>
                  <ol>
                    <li><strong>语法形式</strong>：Promise使用.then()和.catch()链式调用；async/await使用更接近同步代码的写法，让异步代码更易读。</li>
                    <li><strong>错误处理</strong>：Promise通过.catch()捕获错误；async/await使用try/catch捕获错误，更符合传统的错误处理方式。</li>
                    <li><strong>本质关系</strong>：async/await实际上是Promise的语法糖，async函数始终返回Promise。</li>
                  </ol>
                  <p>简单示例对比：</p>
                  <pre><code>// Promise写法
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// async/await写法
async function getData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
getData();</code></pre>
                  <p>需要我进一步解释某个部分吗？</p>
                </div>
              </div>
              
              <div class="chat-message user-message">
                <div class="message-avatar">
                  <span>我</span>
                </div>
                <div class="message-content">
                  <p>谢谢，我明白了！能推荐一些学习异步编程的资源吗？</p>
                </div>
              </div>
              
              <div class="chat-message ai-message">
                <div class="message-avatar">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="message-content">
                  <p>当然！以下是学习JavaScript异步编程的优质资源：</p>
                  <ol>
                    <li>我们平台的《JavaScript异步编程》专题课程</li>
                    <li>MDN上的异步编程文档</li>
                    <li>《你不知道的JavaScript》中卷（深入讲解了Promise）</li>
                  </ol>
                  <p>建议您从我们平台的课程开始，学完基础后再阅读其他资源加深理解。</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ai-usage-tips">
            <div class="tips-header">
              <el-icon><Pointer /></el-icon>
              <h3>使用技巧</h3>
            </div>
            <ul>
              <li>提问时尽量具体，包含关键上下文信息</li>
              <li>代码问题请提供完整的错误信息和相关代码</li>
              <li>善用提示词引导AI，如"解释给初学者"或"提供代码示例"</li>
              <li>复杂问题可分解为多个小问题逐步提问</li>
            </ul>
          </div>
          
          <el-button type="primary" class="try-ai-button" @click="$router.push('/ai-assistant')">
            <el-icon><ChatLineRound /></el-icon>
            立即体验AI助手
          </el-button>
        </div>
      </el-card>
      
      <el-card class="guide-section">
        <template #header>
          <div class="section-header">
            <el-icon><User /></el-icon>
            <h2>4. 个人中心</h2>
          </div>
        </template>
        <div class="section-content">
          <h3>4.1 练习统计</h3>
          <p>在个人中心，您可以查看已完成题目数量、练习正确率、错误率和知识点掌握情况等统计数据。</p>
          
          <h3>4.2 收藏夹</h3>
          <p>您可以收藏感兴趣的课程和练习题，方便日后快速查找和学习。</p>
          
          <h3>4.3 错题本</h3>
          <p>系统会自动记录您做错的练习题，方便您重点复习和巩固薄弱环节。</p>
          
          <div class="guide-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>提示：定期查看练习统计和错题本可以帮助您发现学习中的不足和进步。</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="guide-section">
        <template #header>
          <div class="section-header">
            <el-icon><Service /></el-icon>
            <h2>6. 联系我们</h2>
          </div>
        </template>
        <div class="section-content">
          <p>如果您在使用过程中遇到任何问题，或有任何建议和反馈，欢迎通过以下方式联系我们：</p>
          <ul class="contact-list">
            <li>
              <el-icon><Message /></el-icon>
              <span>电子邮箱：<a href="mailto:wuyelongjobs@163.com">wuyelongjobs@163.com</a></span>
            </li>
            <li>
              <el-icon><Phone /></el-icon>
              <span>联系电话：<a href="tel:13571795875">13571795875</a></span>
            </li>
          </ul>
          <p>我们的客服团队会在工作日24小时内回复您的问题。</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { 
  School, InfoFilled, DocumentChecked, ChatLineRound, 
  User, Service, Message, Phone, ChatDotRound, 
  Edit, MagicStick, Pointer
} from '@element-plus/icons-vue';

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.user-guide-container {
  max-width: 1280px;
  margin: 20px auto 60px;
  padding: 0 20px;
}

.guide-content {
  margin-top: 30px;
}

.guide-header {
  text-align: center;
  margin-bottom: 40px;
}

.guide-header h1 {
  font-size: 32px;
  color: #4a90e2;
  margin-bottom: 15px;
}

.guide-intro {
  font-size: 18px;
  color: #666;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
}

.guide-section {
  margin-bottom: 30px;
  border-radius: 8px;
  transition: transform 0.2s;
}

.guide-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section-content {
  color: #555;
  line-height: 1.6;
}

.section-content h3 {
  font-size: 18px;
  color: #4a90e2;
  margin: 25px 0 15px;
}

.section-content p {
  margin: 10px 0 20px;
}

.guide-tip {
  background-color: rgba(74, 144, 226, 0.1);
  border-left: 4px solid #4a90e2;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 20px 0;
}

.guide-tip .el-icon {
  color: #4a90e2;
  font-size: 18px;
  margin-top: 2px;
}

.guide-tip span {
  color: #666;
}

/* AI助手特有样式 */
.ai-feature-introduction {
  text-align: center;
  margin-bottom: 30px;
}

.ai-feature-introduction p {
  font-size: 18px;
  color: #555;
  max-width: 800px;
  margin: 0 auto;
}

.ai-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 30px 0;
}

.ai-feature-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.ai-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(74, 144, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.feature-icon .el-icon {
  font-size: 24px;
  color: #4a90e2;
}

.ai-feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.ai-feature-card p {
  color: #666;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.ai-chat-demo {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin: 40px 0;
}

.demo-title {
  text-align: center;
  font-size: 20px;
  color: #333;
  margin-top: 0;
  margin-bottom: 25px;
  position: relative;
}

.demo-title:after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  background: #4a90e2;
  margin: 12px auto 0;
  border-radius: 3px;
}

.chat-container {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  overflow: hidden;
}

.chat-message {
  display: flex;
  margin-bottom: 20px;
}

.chat-message:last-child {
  margin-bottom: 0;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 15px;
}

.user-message .message-avatar {
  background: #e6f2ff;
  color: #4a90e2;
  font-weight: bold;
}

.ai-message .message-avatar {
  background: rgba(74, 144, 226, 0.1);
}

.ai-message .message-avatar .el-icon {
  font-size: 20px;
  color: #4a90e2;
}

.message-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  flex: 1;
  position: relative;
}

.message-content:before {
  content: '';
  position: absolute;
  top: 15px;
  left: -8px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #f8f9fa;
}

.user-message .message-content {
  background: #e6f2ff;
}

.user-message .message-content:before {
  border-right-color: #e6f2ff;
}

.message-content p {
  margin: 0 0 15px;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content ol, .message-content ul {
  margin: 10px 0;
  padding-left: 25px;
}

.message-content li {
  margin-bottom: 8px;
}

.message-content pre {
  background: #f1f3f5;
  border-radius: 6px;
  padding: 15px;
  overflow-x: auto;
  margin: 15px 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.message-content code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #333;
}

.ai-usage-tips {
  background: rgba(74, 144, 226, 0.08);
  border-radius: 10px;
  padding: 20px;
  margin: 30px 0;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.tips-header .el-icon {
  font-size: 20px;
  color: #4a90e2;
}

.tips-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.ai-usage-tips ul {
  margin: 0;
  padding-left: 25px;
}

.ai-usage-tips li {
  margin-bottom: 8px;
  color: #555;
}

.try-ai-button {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 30px auto 0;
  padding: 12px 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.try-ai-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(74, 144, 226, 0.3);
}

/* 联系方式样式 */
.contact-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.contact-list .el-icon {
  color: #4a90e2;
}

.contact-list a {
  color: #4a90e2;
  text-decoration: none;
}

.contact-list a:hover {
  text-decoration: underline;
}

@media screen and (max-width: 768px) {
  .guide-header h1 {
    font-size: 28px;
  }
  
  .guide-intro {
    font-size: 16px;
  }
  
  .section-header h2 {
    font-size: 18px;
  }
  
  .section-content h3 {
    font-size: 16px;
  }
  
  .ai-feature-grid {
    grid-template-columns: 1fr;
  }
  
  .ai-chat-demo {
    padding: 15px;
  }
  
  .message-content pre {
    font-size: 12px;
  }
}
</style> 