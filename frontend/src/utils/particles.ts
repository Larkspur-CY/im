export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private theme: 'light' | 'dark' = 'light';

  constructor(canvasId: string, particleCount: number = 80, theme: 'light' | 'dark' = 'light') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.theme = theme;
    this.init(particleCount);
    this.animate();
  }

  private init(particleCount: number) {
    this.resizeCanvas();
    this.particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 根据主题设置粒子颜色
    const particleColor = this.theme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';
    
    this.particles.forEach(particle => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 边界检测
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particleColor + particle.opacity + ')';
      this.ctx.fill();
    });
    
    // 绘制连线
    this.drawConnections();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawConnections() {
    const maxDistance = 100;
    const lineColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = lineColor;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  public updateTheme(theme: 'light' | 'dark') {
    this.theme = theme;
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export function initParticles(canvasId: string, particleCount: number = 80, theme: 'light' | 'dark' = 'light'): ParticleSystem {
  return new ParticleSystem(canvasId, particleCount, theme);
}