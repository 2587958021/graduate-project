/**
 * 简单的Markdown格式化工具
 * 将Markdown文本转换为HTML
 */

/**
 * 格式化Markdown文本为HTML
 * @param {string} text - Markdown文本
 * @returns {string} - 格式化后的HTML
 */
export function formatMarkdown(text) {
  if (!text) return '';
  
  // 转义HTML特殊字符，防止XSS攻击
  text = escapeHtml(text);
  
  // 处理标题: # 标题文本
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  
  // 处理强调: **粗体** 和 *斜体*
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 处理链接: [链接文本](链接URL)
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // 处理图片: ![替代文本](图片URL)
  text = text.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');
  
  // 处理代码块: ```code```
  text = text.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
  
  // 处理行内代码: `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理有序列表
  text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.+<\/li>\n)+/g, '<ol>$&</ol>');
  
  // 处理无序列表
  text = text.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.+<\/li>\n)+/g, '<ul>$&</ul>');
  
  // 处理段落: 连续的文本行
  text = text.replace(/^(?!<[ho]|<li|<p|<img|<pre).+$/gm, '<p>$&</p>');
  
  // 处理换行: 行尾两个空格+换行，或者直接双换行
  text = text.replace(/  \n/g, '<br>');
  text = text.replace(/\n\n/g, '</p><p>');
  
  return text;
}

/**
 * 转义HTML特殊字符
 * @param {string} text - 原始文本
 * @returns {string} - 转义后的文本
 */
function escapeHtml(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, match => escapeMap[match] || match);
} 