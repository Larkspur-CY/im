interface ParticleOptions {
  x?: number;
  y?: number;
  size?: number;
  speedX?: number;
  speedY?: number;
  color?: string;
  opacity?: number;
}

class Particle {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private x: number;
  private y: number;
  private size: number;
  private speedX: number;
  private speedY: number;
  private color: string;
  private opacity: number;

  constructor(canvas: HTMLCanvasElement, options: ParticleOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.x = options.x || Math.random() * canvas.width;
    this.y = options.y || Math.random() * canvas.height;
    this.size = options.size || Math.random() * 3 + 1;
    this.speedX = options.speedX || (Math.random() - 0.5) * 1;
    this.speedY = options.speedY || (Math.random() - 0.5) * 1;
    this.color = options.color || '#667eea';
    this.opacity = options.opacity || Math.random() * 0.5 + 0.3;
  }

  update(): void {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 边界检查
    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX = -this.speedX;
    }
    
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY = -this.speedY;
    }
  }

  draw(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = this.opacity;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
}

export function initParticles(canvasId: string, particleCount: number = 100, colorScheme: 'light' | 'dark' = 'light'): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles: Particle[] = [];
  
  // 根据配色方案设置颜色
  const colors = colorScheme === 'dark' 
    ? ['#764ba2', '#667eea', '#a29bfe', '#6c5ce7'] 
    : ['#667eea', '#764ba2', '#a29bfe', '#6c5ce7'];
  
  // 创建粒子
  for (let i = 0; i < particleCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(canvas, { color }));
  }
  
  // 连接粒子的函数
  function connectParticles(): void {
    const maxDistance = 150;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.strokeStyle = colorScheme === 'dark' ? '#4a5568' : '#667eea';
          ctx.globalAlpha = 1 - (distance / maxDistance);
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }
  
  // 动画循环
  function animate(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const particle of particles) {
      particle.update();
      particle.draw();
    }
    
    connectParticles();
    requestAnimationFrame(animate);
  }
  
  // 处理窗口大小变化
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  
  animate();
}