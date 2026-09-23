// M3 のカラートークンを material-color-utilities で生成し、CSS 変数として書き出す。
import {
  Hct,
  MaterialDynamicColors as C,
  SchemeVibrant,
  hexFromArgb,
  argbFromHex,
  type DynamicScheme,
} from '@material/material-color-utilities';
import { CARD_COLORS } from '../src/design';

/** サイト全体のシードカラー（サンシャインオレンジ） */
export const SEED = '#FFA000';

const SYS_ROLES = {
  primary: C.primary,
  'on-primary': C.onPrimary,
  'primary-container': C.primaryContainer,
  'on-primary-container': C.onPrimaryContainer,
  secondary: C.secondary,
  'on-secondary': C.onSecondary,
  'secondary-container': C.secondaryContainer,
  'on-secondary-container': C.onSecondaryContainer,
  tertiary: C.tertiary,
  'on-tertiary': C.onTertiary,
  'tertiary-container': C.tertiaryContainer,
  'on-tertiary-container': C.onTertiaryContainer,
  error: C.error,
  'on-error': C.onError,
  surface: C.surface,
  'on-surface': C.onSurface,
  'on-surface-variant': C.onSurfaceVariant,
  'surface-container-low': C.surfaceContainerLow,
  'surface-container': C.surfaceContainer,
  'surface-container-high': C.surfaceContainerHigh,
  'surface-container-highest': C.surfaceContainerHighest,
  outline: C.outline,
  'outline-variant': C.outlineVariant,
  'inverse-surface': C.inverseSurface,
  'inverse-on-surface': C.inverseOnSurface,
};

const scheme = (hex: string, dark: boolean): DynamicScheme =>
  new SchemeVibrant(Hct.fromInt(argbFromHex(hex)), dark, 0, '2025', 'phone');

const hex = (s: DynamicScheme, role: (typeof SYS_ROLES)[keyof typeof SYS_ROLES]) => hexFromArgb(role.getArgb(s));

function sysVars(dark: boolean): string {
  const s = scheme(SEED, dark);
  return Object.entries(SYS_ROLES)
    .map(([name, role]) => `  --md-sys-color-${name}: ${hex(s, role)};`)
    .join('\n');
}

function cardRules(dark: boolean): string {
  return Object.entries(CARD_COLORS)
    .map(([name, seed]) => {
      const s = scheme(seed, dark);
      return [
        `.c-${name} {`,
        `  --card-container: ${hex(s, C.primaryContainer)};`,
        `  --card-on-container: ${hex(s, C.onPrimaryContainer)};`,
        // 形状はカード地色とはっきり差が出るトーン（ライトは濃く、ダークは地色が明るいので中間）
        `  --card-shape: ${hexFromArgb(s.primaryPalette.tone(dark ? 50 : 40))};`,
        `}`,
      ].join('\n');
    })
    .join('\n');
}

export function generateTheme() {
  const indent = (text: string) => text.replace(/^/gm, '  ');
  const css = [
    '/* 自動生成ファイル（scripts/theme.ts）。直接編集しないでください。 */',
    `:root {\n${sysVars(false)}\n}`,
    cardRules(false),
    `@media (prefers-color-scheme: dark) {\n  :root {\n${indent(sysVars(true))}\n  }\n${indent(cardRules(true))}\n}`,
    '',
  ].join('\n');
  return {
    css,
    lightSurface: hex(scheme(SEED, false), C.surface),
    darkSurface: hex(scheme(SEED, true), C.surface),
  };
}
