export const themes = {
  default: {
    primary: '#F1E5D1',
    secondary: '#DBB5B5',
    accent: '#C39898',
    highlight: '#987070',
  }
} as const;

export type ThemeColors = keyof typeof themes.default;