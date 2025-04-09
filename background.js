// 切换面板显示
async function togglePagetalkPanel(tabId) {
    // 首先检查扩展是否有效 
    if (!chrome.runtime?.id) {
        console.error('扩展上下文已失效，请刷新页面');
        return;
    }

    try {
        // 首先获取当前标签页的URL
        const tab = await chrome.tabs.get(tabId);
        
        // 检查是否是chrome://页面或其他受限URL
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
            tab.url.startsWith('devtools://') || tab.url.startsWith('about:')) {
            console.error('无法在浏览器内部页面上运行扩展');
            try {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '00003-3515475522.png',
                    title: 'Pagetalk',
                    message: '无法在浏览器内部页面上运行扩展'
                });
            } catch (notificationError) {
                console.error('无法创建通知:', notificationError);
            }
            return;
        }

        // 尝试注入content script
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['js/content.js']
            });
        } catch (injectError) {
            console.error('注入脚本失败:', injectError);
            throw new Error('无法注入脚本，请刷新页面后重试');
        }

        // 等待一小段时间确保脚本加载完成
        await new Promise(resolve => setTimeout(resolve, 300));

        // 尝试发送消息
        try {
            const response = await chrome.tabs.sendMessage(tabId, { action: "togglePanel" });
            if (!response) {
                throw new Error('未收到响应');
            }
        } catch (messageError) {
            console.error('发送消息失败:', messageError);
            throw new Error('无法与页面通信，请刷新页面后重试');
        }
    } catch (error) {
        console.error('切换面板失败:', error);
        
        // 显示友好的错误消息
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: '00003-3515475522.png',
                title: 'Pagetalk',
                message: error.message || '无法打开面板，请刷新页面后重试'
            });
        } catch (notificationError) {
            console.error('无法创建通知:', notificationError);
        }
    }
} 