// 监听来自background或面板的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 处理提取内容的请求
    if (message.action === "extractContent") {
        try {
            // 提取页面内容
            const content = extractPageContent();
            
            // 发送回请求方
            sendResponse({ content: content });
        } catch (error) {
            console.error('提取内容时出错:', error);
            sendResponse({ error: error.message });
        }
    }
    
    // 处理打开/关闭面板的请求
    else if (message.action === "togglePanel") {
        try {
            // 初始化面板（如果尚未初始化）
            if (!document.getElementById('pagetalk-panel-container')) {
                initPagetalkPanel();
            }
            
            // 切换面板显示
            togglePanel();
            sendResponse({ success: true, panelActive });
        } catch (error) {
            console.error('切换面板时出错:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    // 允许异步响应
    return true;
});

// 监听iframe内部的消息
window.addEventListener('message', (event) => {
    // 确保消息来源是我们的iframe
    const iframe = document.getElementById('pagetalk-panel-iframe');
    if (!iframe || event.source !== iframe.contentWindow) {
        return;
    }

    try {
        if (event.data.action === 'closePanel') {
            hidePanel();
        }
        else if (event.data.action === 'requestPageContent') {
            const content = extractPageContent();
            
            // 将内容发送回iframe
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ 
                    action: 'pageContentExtracted', 
                    content 
                }, '*');
            }
        }
        // 添加处理复制文本的功能
        else if (event.data.action === 'copyText') {
            // 使用Clipboard API复制文本
            const text = event.data.text;
            
            // 创建一个临时的textarea元素
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';  // 避免滚动到底部
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            
            // 选择文本并复制
            textarea.select();
            textarea.setSelectionRange(0, 99999);  // 对于移动设备
            
            try {
                // 尝试使用document.execCommand进行复制 (对所有浏览器兼容)
                const success = document.execCommand('copy');
                if (success) {
                    // 获取iframe元素并通知复制成功
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            action: 'copySuccess'
                        }, '*');
                    }
                } else {
                    throw new Error('复制失败');
                }
            } catch (err) {
                console.error('复制时出错:', err);
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        action: 'copyError',
                        error: err.message
                    }, '*');
                }
            } finally {
                // 移除临时元素
                document.body.removeChild(textarea);
            }
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'error',
                error: error.message
            }, '*');
        }
    }
});

const iframe = document.createElement('iframe');
iframe.id = 'pagetalk-panel-iframe';

// 设置iframe源为插件中的HTML文件
const extensionURL = chrome.runtime.getURL('html/sidepanel.html'); // html 文件夹现在在同一目录下
iframe.src = extensionURL; 