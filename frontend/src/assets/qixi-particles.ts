interface ParticleOptions {
  x?: number;
  y?: number;
  size?: number;
  speedX?: number;
  speedY?: number;
  color?: string;
  opacity?: number;
  type?: 'heart' | 'star';
  rotation?: number;
  scale?: number;
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
  private type: 'heart' | 'star';
  private rotation: number;
  private scale: number;
  private pulsePhase: number;
  private originalSize: number;

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
    this.originalSize = this.size;
    this.speedX = options.speedX || (Math.random() - 0.5) * 0.6;
    this.speedY = options.speedY || (Math.random() - 0.5) * 0.6;
    this.opacity = options.opacity || Math.random() * 0.5 + 0.3;
    this.type = options.type || (Math.random() < 0.6 ? 'heart' : 'star');
    this.rotation = options.rotation || Math.random() * Math.PI * 2;
    this.scale = options.scale || 1;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(): void {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += 0.02;
    this.pulsePhase += 0.05;
    
    // 边界检查
    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX = -this.speedX;
    }
    
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY = -this.speedY;
    }

    // 脉冲效果
    this.size = this.originalSize + Math.sin(this.pulsePhase) * 0.5;
  }

  private drawHeart(): void {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.rotate(this.rotation);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.size * 0.35);
    this.ctx.bezierCurveTo(
      -this.size * 0.6, -this.size * 0.2,
      -this.size * 0.5, -this.size * 0.9,
      0, -this.size * 0.7
    );
    this.ctx.bezierCurveTo(
      this.size * 0.5, -this.size * 0.9,
      this.size * 0.6, -this.size * 0.2,
      0, this.size * 0.35
    );
    this.ctx.fillStyle = `rgba(255, 105, 180, ${this.opacity})`;
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawStar(): void {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.rotate(this.rotation);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const outerX = Math.cos(outerAngle) * this.size;
      const outerY = Math.sin(outerAngle) * this.size;
      const innerX = Math.cos(innerAngle) * (this.size * 0.5);
      const innerY = Math.sin(innerAngle) * (this.size * 0.5);
      if (i === 0) this.ctx.moveTo(outerX, outerY);
      this.ctx.lineTo(innerX, innerY);
      this.ctx.lineTo(outerX, outerY);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
    this.ctx.fill();
    this.ctx.restore();
  }

  draw(_colorScheme: 'light' | 'dark'): void {
    if (this.type === 'heart') {
      this.drawHeart();
    } else {
      this.drawStar();
    }
  }

}

// 全局粒子系统管理器
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private colorScheme: 'light' | 'dark' = 'light';
  private time: number = 0;

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
    
    // 创建七夕主题粒子：爱心与星星
    const heartCount = Math.floor(particleCount * 0.6);
    const starCount = particleCount - heartCount;
    for (let i = 0; i < heartCount; i++) {
      this.particles.push(new Particle(this.canvas, {
        type: 'heart',
        size: Math.random() * 4 + 2,
        scale: Math.random() * 0.6 + 0.8,
        opacity: Math.random() * 0.4 + 0.4
      }));
    }
    for (let i = 0; i < starCount; i++) {
      this.particles.push(new Particle(this.canvas, {
        type: 'star',
        size: Math.random() * 3 + 1,
        scale: Math.random() * 0.5 + 0.8,
        opacity: Math.random() * 0.4 + 0.4
      }));
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
          
          // 七夕主题粉紫色连线
          const lineColor = this.colorScheme === 'dark' 
            ? 'rgba(255, 182, 193, 0.12)'
            : 'rgba(255, 105, 180, 0.22)';
          
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
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    
    for (const particle of this.particles) {
      particle.update();
      particle.draw(this.colorScheme);
    }
    
    this.connectParticles();
    this.drawQixiText();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawBackground(): void {
    // 柔和的粉紫径向渐变背景
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) / 2
    );
    if (this.colorScheme === 'dark') {
      gradient.addColorStop(0, 'rgba(30, 20, 40, 0.9)');
      gradient.addColorStop(0.6, 'rgba(50, 25, 70, 0.7)');
      gradient.addColorStop(1, 'rgba(70, 30, 90, 0.5)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 240, 245, 0.9)');
      gradient.addColorStop(0.6, 'rgba(255, 228, 235, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 218, 225, 0.5)');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawQixiText(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height * 0.22;
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    this.ctx.fillStyle = this.colorScheme === 'dark' ? '#FF69B4' : '#FF1493';
    this.ctx.shadowColor = this.colorScheme === 'dark' ? 'rgba(255,105,180,0.4)' : 'rgba(255,20,147,0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText('七夕快乐', centerX, centerY);
    this.ctx.shadowBlur = 0;
    this.ctx.font = '16px "Microsoft YaHei", sans-serif';
    this.ctx.fillStyle = this.colorScheme === 'dark' ? '#DDA0DD' : '#8A2BE2';
    this.ctx.fillText('愿天下有情人终成眷属', centerX, centerY + 28);
    this.ctx.restore();
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

export function initQixiParticles(canvasId: string, particleCount: number = 100, colorScheme: 'light' | 'dark' = 'light'): void {
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
export function updateQixiParticleTheme(colorScheme: 'light' | 'dark'): void {
  if (globalParticleSystem) {
    globalParticleSystem.updateTheme(colorScheme);
  }
}
