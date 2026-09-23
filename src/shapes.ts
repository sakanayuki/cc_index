import { SHAPES, type ShapeName } from './design';

const POINTS = 96;

/**
 * viewBox 0 0 100 100 に収まる形状の SVG パスを返す。
 * morph = 1 で本来の形、0 で円（押下時のモーフィングに使う）。
 */
export function shapePath(name: ShapeName, morph = 1): string {
  const { n, a } = SHAPES[name];
  const amp = a * morph;
  const radius = 48 / (1 + amp);
  let d = '';
  for (let i = 0; i < POINTS; i++) {
    const t = (i / POINTS) * Math.PI * 2;
    const r = radius * (1 + amp * Math.cos(n * t));
    const x = 50 + r * Math.cos(t - Math.PI / 2);
    const y = 50 + r * Math.sin(t - Math.PI / 2);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + 'Z';
}
