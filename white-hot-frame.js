// White Hot Frame – Welding-style custom element
// Features:
// • Moving weld puddle around the frame
// • Directional sparks and arc flash
// • Optional cooling mode via the `cooling` attribute

class WhiteHotFrame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.path = [];
        this.perimeter = 0;
        this.resizeHandler = null;
        this.rafId = 0;
        this.lastTime = 0;
        this.travel = 0;
        this.direction = -1;
        this.sparkEls = [];
    }

    connectedCallback() {
        const src = this.getAttribute('src') || '';
        const alt = (this.getAttribute('alt') || '').replace(/"/g, '&quot;');

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          line-height: 0;
        }

        img {
          display: block;
          width: 100%;
          height: auto;
        }

        svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: visible;
        }

        .steel {
          fill: none;
          stroke: rgba(142, 151, 160, 0.4);
          stroke-width: 2.5;
          stroke-linejoin: round;
        }

        .trail {
          fill: none;
          stroke: rgba(255, 159, 88, 0.3);
          stroke-width: 4.2;
          stroke-linecap: round;
          stroke-dasharray: 56 1000;
          opacity: 0.5;
          filter: blur(0.9px);
        }

        .heat {
          fill: none;
          stroke: url(#weldGradient);
          stroke-width: 3.4;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 32 1000;
          filter:
            drop-shadow(0 0 4px rgba(255, 255, 255, 0.85))
            drop-shadow(0 0 12px rgba(255, 203, 139, 0.72))
            drop-shadow(0 0 24px rgba(255, 132, 58, 0.45));
        }

        .arc {
          fill: rgba(255, 243, 214, 0.45);
          mix-blend-mode: screen;
        }

        .torch {
          fill: #fff7db;
          filter:
            drop-shadow(0 0 3px rgba(255, 255, 255, 0.9))
            drop-shadow(0 0 10px rgba(255, 186, 120, 0.8))
            drop-shadow(0 0 18px rgba(255, 124, 54, 0.65));
        }

        .spark {
          stroke: #fff4ce;
          stroke-linecap: round;
          mix-blend-mode: screen;
          opacity: 0;
        }

        :host([cooling]) .trail,
        :host([cooling]) .heat {
          stroke: #98a2aa;
          filter: none;
        }

        :host([cooling]) .torch {
          fill: #c4ccd3;
          filter: none;
        }
      </style>

      <img src="${src}" alt="${alt}" />
      <svg aria-hidden="true">
        <defs>
          <linearGradient id="weldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#ffe0b2" />
            <stop offset="72%" stop-color="#ffb06d" />
            <stop offset="100%" stop-color="#ff7a42" />
          </linearGradient>
        </defs>
        <rect class="steel" />
        <rect class="trail" />
        <rect class="heat" />
        <circle class="arc" />
        <circle class="torch" />
        <line class="spark"></line>
        <line class="spark"></line>
        <line class="spark"></line>
        <line class="spark"></line>
      </svg>
    `;

        this.img = this.shadowRoot.querySelector('img');
        this.svg = this.shadowRoot.querySelector('svg');
        this.steel = this.shadowRoot.querySelector('.steel');
        this.trail = this.shadowRoot.querySelector('.trail');
        this.heat = this.shadowRoot.querySelector('.heat');
        this.arc = this.shadowRoot.querySelector('.arc');
        this.torch = this.shadowRoot.querySelector('.torch');
        this.sparkEls = Array.from(this.shadowRoot.querySelectorAll('.spark'));

        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);

        this.img.addEventListener('load', () => this.resize(), { once: true });
        if (this.img.complete) {
            this.resize();
        }

        this.start();
    }

    disconnectedCallback() {
        this.stop();
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    start() {
        this.stop();
        this.lastTime = 0;
        this.rafId = window.requestAnimationFrame((now) => this.tick(now));
    }

    stop() {
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    resize() {
        const w = this.img.offsetWidth;
        const h = this.img.offsetHeight;

        if (w < 2 || h < 2) {
            return;
        }

        const m = 3;
        const width = Math.max(1, w - m * 2);
        const height = Math.max(1, h - m * 2);

        this.svg.setAttribute('width', String(w));
        this.svg.setAttribute('height', String(h));
        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

        this.steel.setAttribute('x', String(m));
        this.steel.setAttribute('y', String(m));
        this.steel.setAttribute('width', String(width));
        this.steel.setAttribute('height', String(height));

        this.trail.setAttribute('x', String(m));
        this.trail.setAttribute('y', String(m));
        this.trail.setAttribute('width', String(width));
        this.trail.setAttribute('height', String(height));

        this.heat.setAttribute('x', String(m));
        this.heat.setAttribute('y', String(m));
        this.heat.setAttribute('width', String(width));
        this.heat.setAttribute('height', String(height));

        this.path = [
            { x1: m, y1: m, x2: w - m, y2: m, dx: 1, dy: 0, len: width },
            { x1: w - m, y1: m, x2: w - m, y2: h - m, dx: 0, dy: 1, len: height },
            { x1: w - m, y1: h - m, x2: m, y2: h - m, dx: -1, dy: 0, len: width },
            { x1: m, y1: h - m, x2: m, y2: m, dx: 0, dy: -1, len: height }
        ];

        this.perimeter = this.path.reduce((sum, seg) => sum + seg.len, 0);

        const heatLength = Math.max(28, Math.round(this.perimeter * 0.065));
        const trailLength = Math.max(52, Math.round(this.perimeter * 0.12));
        this.heat.style.strokeDasharray = `${heatLength} ${Math.max(18, this.perimeter - heatLength)}`;
        this.trail.style.strokeDasharray = `${trailLength} ${Math.max(18, this.perimeter - trailLength)}`;
    }

    pointAt(distance) {
        if (this.path.length === 0 || this.perimeter <= 0) {
            return null;
        }

        let d = distance % this.perimeter;
        if (d < 0) {
            d += this.perimeter;
        }

        for (const seg of this.path) {
            if (d <= seg.len) {
                const t = seg.len <= 0 ? 0 : d / seg.len;
                const x = seg.x1 + (seg.x2 - seg.x1) * t;
                const y = seg.y1 + (seg.y2 - seg.y1) * t;
                return {
                    x,
                    y,
                    dx: seg.dx,
                    dy: seg.dy,
                    nx: -seg.dy,
                    ny: seg.dx
                };
            }
            d -= seg.len;
        }

        const first = this.path[0];
        return {
            x: first.x1,
            y: first.y1,
            dx: first.dx,
            dy: first.dy,
            nx: -first.dy,
            ny: first.dx
        };
    }

    tick(now) {
        this.rafId = window.requestAnimationFrame((next) => this.tick(next));

        if (this.perimeter <= 0) {
            return;
        }

        if (!this.lastTime) {
            this.lastTime = now;
        }

        const dt = Math.min(0.05, Math.max(1 / 120, (now - this.lastTime) / 1000));
        this.lastTime = now;

        const cooling = this.hasAttribute('cooling');
        const speed = cooling ? 36 : 180;
        this.travel = (this.travel + dt * speed * this.direction) % this.perimeter;

        const point = this.pointAt(this.travel);
        if (!point) {
            return;
        }

        const flicker = cooling ? 0.14 : 0.45 + Math.max(0, Math.sin(now * 0.044)) * 0.55;
        const arcRadius = cooling ? 5.5 : 8 + flicker * 7.5;

        this.torch.setAttribute('cx', point.x.toFixed(2));
        this.torch.setAttribute('cy', point.y.toFixed(2));
        this.torch.setAttribute('r', (cooling ? 3.2 : 4.2 + flicker * 1.8).toFixed(2));

        this.arc.setAttribute('cx', point.x.toFixed(2));
        this.arc.setAttribute('cy', point.y.toFixed(2));
        this.arc.setAttribute('r', arcRadius.toFixed(2));
        this.arc.style.opacity = cooling ? '0.1' : (0.2 + flicker * 0.52).toFixed(2);

        const dashOffset = -this.travel;
        this.heat.style.strokeDashoffset = dashOffset.toFixed(2);
        this.trail.style.strokeDashoffset = (dashOffset + 24).toFixed(2);
        this.heat.style.opacity = cooling ? '0.3' : (0.72 + Math.sin(now * 0.012) * 0.18).toFixed(2);
        this.trail.style.opacity = cooling ? '0.16' : (0.45 + Math.sin(now * 0.009) * 0.12).toFixed(2);

        this.sparkEls.forEach((spark, index) => {
            if (cooling) {
                spark.style.opacity = '0';
                return;
            }

            const pulse = Math.max(0, Math.sin(now * 0.022 + index * 1.7));
            const length = 9 + pulse * 23 + index * 2;
            const spread = Math.sin(now * 0.01 + index * 2.6) * (3.8 + index * 1.9);
            const side = (index - (this.sparkEls.length - 1) / 2) * 1.8;

            const sx = point.x + point.nx * side;
            const sy = point.y + point.ny * side;
            const ex = sx + point.dx * length + point.nx * spread;
            const ey = sy + point.dy * length + point.ny * spread;

            spark.setAttribute('x1', sx.toFixed(2));
            spark.setAttribute('y1', sy.toFixed(2));
            spark.setAttribute('x2', ex.toFixed(2));
            spark.setAttribute('y2', ey.toFixed(2));
            spark.style.strokeWidth = `${(1.1 + pulse * 1.1).toFixed(2)}`;
            spark.style.opacity = (0.14 + pulse * 0.82).toFixed(2);
        });
    }
}

if (!customElements.get('white-hot-frame')) {
    customElements.define('white-hot-frame', WhiteHotFrame);
}
