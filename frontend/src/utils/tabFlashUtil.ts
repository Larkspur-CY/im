// 浏览览器标签页favicon闪烁工具

let faviconFlashInterval: number | null = null;
let originalFaviconHref: string | null = null;
let flashFaviconHref: string | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// 初始化favicon路径
function initFavicons() {
  if (!originalFaviconHref) {
    const originalFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    originalFaviconHref = originalFavicon ? originalFavicon.href : '/favicon.ico';
  }
  
  if (!flashFaviconHref) {
    // 使用红色背景的favicon作为闪烁效果
    flashFaviconHref = '/images/favicon/favicon-32x32.png'; // 这里可以替换为一个特殊设计的闪烁favicon
  }
  
  // 创建canvas元素用于绘制动画favicon
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    ctx = canvas.getContext('2d');
  }
}

// 创建一个更美观醒目的动画favicon
function createAnimatedFavicon(frame: number, maxFrames: number): string {
  // 检查canvas和ctx是否都存在
  if (!ctx || !canvas) return originalFaviconHref || '/favicon.ico';
  
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 计算动画参数
  const progress = frame / maxFrames;
  
  // 创建更醒目的蓝色背景
  ctx.fillStyle = '#1E90FF'; // 鲜艳的蓝色
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加脉冲效果
  const pulse = Math.abs(Math.sin(progress * Math.PI * 4)) * 5;
  if (pulse > 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制未读消息数字（使用更清晰的字体）
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  
  // 添加阴影效果使数字更突出
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText('未', canvas.width / 2, canvas.height / 2);
  
  // 清除阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 返回data URL
  return canvas.toDataURL('image/png');
}

// 闪烁浏览器标签页favicon
export function flashBrowserTab() {
  // 如果页面不可见，才执行闪烁效果
  if (document.visibilityState !== 'visible') {
    // 初始化favicon路径
    initFavicons();
    
    // 如果已经有闪烁定时器在运行，则不重复创建
    if (faviconFlashInterval) {
      return;
    }
    
    let flashCount = 0;
    const maxFlashes = 30; // 增加闪烁次数
    
    // 创建favicon闪烁定时器
    faviconFlashInterval = window.setInterval(() => {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      // 交替显示原始favicon和动画favicon
      if (favicon) {
        if (flashCount % 2 === 0) {
          // 显示动画favicon
          favicon.href = createAnimatedFavicon(flashCount, maxFlashes);
        } else {
          // 显示原始favicon
          favicon.href = originalFaviconHref || '/favicon.ico';
        }
      }
      
      flashCount++;
      
      // 达到最大闪烁次数或页面变为可见时停止闪烁
      if (flashCount >= maxFlashes || document.visibilityState === 'visible') {
        stopTabFlashing();
      }
    }, 200); // 更快的闪烁频率
    
    // 监听页面可见性变化，当用户回到页面时停止闪烁
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        stopTabFlashing();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}

// 停止标签页favicon闪烁
export function stopTabFlashing() {
  if (faviconFlashInterval) {
    clearInterval(faviconFlashInterval);
    faviconFlashInterval = null;
    
    // 恢复原始favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && originalFaviconHref) {
      favicon.href = originalFaviconHref;
    }
  }
}