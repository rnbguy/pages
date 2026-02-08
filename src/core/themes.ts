import type { ThemePair } from "./types.ts";

export const THEMES: Record<string, ThemePair> = {
  "high contrast": {
    light: { id: "github-light-high-contrast" },
    dark: { id: "github-dark-high-contrast" },
  },
  ayu: {
    light: { id: "ayu-light" },
    dark: { id: "ayu-dark" },
  },
  catppuccin: {
    light: { id: "catppuccin-latte" },
    dark: { id: "catppuccin-mocha" },
  },
  everforest: {
    light: { id: "everforest-light" },
    dark: { id: "everforest-dark" },
  },
  github: {
    light: { id: "github-light" },
    dark: { id: "github-dark" },
  },
  gruvbox: {
    light: { id: "gruvbox-light-medium" },
    dark: { id: "gruvbox-dark-medium" },
  },
  kanagawa: {
    light: { id: "kanagawa-lotus" },
    dark: { id: "kanagawa-wave" },
  },
  material: {
    light: { id: "material-theme-lighter" },
    dark: { id: "material-theme-darker" },
  },
  min: {
    light: { id: "min-light" },
    dark: { id: "min-dark" },
  },
  "night owl": {
    light: { id: "night-owl-light" },
    dark: { id: "night-owl" },
  },
  one: {
    light: { id: "one-light" },
    dark: { id: "one-dark-pro" },
  },
  "rose pine": {
    light: { id: "rose-pine-dawn" },
    dark: { id: "rose-pine" },
  },
  slack: {
    light: { id: "slack-ochin" },
    dark: { id: "slack-dark" },
  },
  solarized: {
    light: { id: "solarized-light" },
    dark: { id: "solarized-dark" },
  },
  vitesse: {
    light: { id: "vitesse-light" },
    dark: { id: "vitesse-dark" },
  },
  "vs code": {
    light: { id: "light-plus" },
    dark: { id: "dark-plus" },
  },
};

export const DEFAULT_THEME = "github";

export function allThemeIds(): string[] {
  return Object.values(THEMES).flatMap((p) => [p.light.id, p.dark.id]);
}

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}
