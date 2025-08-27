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
  public x: number;
  public y: number;
  private size: number;
  private speedX: number;
  private speedY: number;
  private opacity: number;

  constructor(canvas: HTMLCanvasElement, options: ParticleOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.x = options.x || Math.random() * canvas.width;
    this.y = options.y || Math.random() * canvas.height;
    this.size = options.size || Math.random() * 3 + 1;
    this.speedX = options.speedX || (Math.random() - 0.5) * 1;
    this.speedY = options.speedY || (Math.random() - 0.5) * 1;
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

  draw(colorScheme: 'light' | 'dark'): void {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    
    // 根据主题动态设置颜色
    const color = colorScheme === 'dark' 
      ? 'rgba(255, 255, 255, 0.6)' 
      : 'rgba(102, 126, 234, 0.8)';
    
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = this.opacity;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

}

// 全局粒子系统管理器
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private colorScheme: 'light' | 'dark' = 'light';

  constructor(canvasId: string, particleCount: number = 100, colorScheme: 'light' | 'dark' = 'light') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas with id "${canvasId}" not found`);
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.colorScheme = colorScheme;
    
    this.init(particleCount);
    this.animate();
    this.setupResize();
  }

  private init(particleCount: number): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.particles = [];
    
    // 创建粒子
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(this.canvas));
    }
  }

  private connectParticles(): void {
    const maxDistance = 150;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          this.ctx.beginPath();
          
          // 根据主题设置连线颜色
          const lineColor = this.colorScheme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(102, 126, 234, 0.2)';
          
          this.ctx.strokeStyle = lineColor;
          this.ctx.globalAlpha = 1 - (distance / maxDistance);
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
          this.ctx.globalAlpha = 1;
        }
      }
    }
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const particle of this.particles) {
      particle.update();
      particle.draw(this.colorScheme);
    }
    
    this.connectParticles();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  public updateTheme(colorScheme: 'light' | 'dark'): void {
    this.colorScheme = colorScheme;
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// 全局粒子系统实例
let globalParticleSystem: ParticleSystem | null = null;

export function initParticles(canvasId: string, particleCount: number = 100, colorScheme: 'light' | 'dark' = 'light'): void {
  // 销毁之前的实例
  if (globalParticleSystem) {
    globalParticleSystem.destroy();
  }
  
  try {
    globalParticleSystem = new ParticleSystem(canvasId, particleCount, colorScheme);
  } catch (error) {
    console.error('Failed to initialize particles:', error);
  }
}

// 更新主题的函数
export function updateParticleTheme(colorScheme: 'light' | 'dark'): void {
  if (globalParticleSystem) {
    globalParticleSystem.updateTheme(colorScheme);
  }
}
