// 监听来自content script的消息
function handleContentScriptMessages(event) {
    // 确保消息来自父窗口
    if (event.source !== window.parent) {
        return;
    }

    try {
        if (event.data.action === 'pageContentLoaded') {
            // 页面内容已加载，可以开始提取
            extractPageContent();
        }
        else if (event.data.action === 'panelResized') {
            // 处理面板大小改变
            const newWidth = event.data.width;
            // 更新UI以适应新宽度
            updatePanelLayout(newWidth);
        }
        else if (event.data.action === 'panelShown') {
            // 面板已显示，可以执行初始化操作
            initializePanel();
        }
        else if (event.data.action === 'error') {
            // 处理错误消息
            showConnectionStatus(event.data.error, 'error');
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
        showConnectionStatus('处理消息时出错: ' + error.message, 'error');
    }
}

// 请求页面内容
function requestPageContent() {
    try {
        window.parent.postMessage({
            action: 'requestPageContent'
        }, '*');
    } catch (error) {
        console.error('请求页面内容失败:', error);
        showConnectionStatus('无法获取页面内容: ' + error.message, 'error');
    }
}

// 关闭面板
function closePanel() {
    try {
        window.parent.postMessage({
            action: 'closePanel'
        }, '*');
    } catch (error) {
        console.error('关闭面板失败:', error);
        showConnectionStatus('无法关闭面板: ' + error.message, 'error');
    }
}

// 更新面板布局
function updatePanelLayout(width) {
    try {
        // 更新UI元素以适应新宽度
        const container = document.querySelector('.chat-container');
        if (container) {
            container.style.width = `${width}px`;
        }
    } catch (error) {
        console.error('更新面板布局失败:', error);
    }
}

// 初始化面板
function initializePanel() {
    try {
        // 设置输入框自适应高度
        setupAutoresizeTextarea();
        
        // 检查是否需要自动提取页面内容
        if (state.autoExtract) {
            extractPageContent();
        }
    } catch (error) {
        console.error('初始化面板失败:', error);
        showConnectionStatus('初始化失败: ' + error.message, 'error');
    }
} 