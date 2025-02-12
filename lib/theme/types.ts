export interface ThemeColors {
  // Primary colors
  primary: {
    main: string;
    secondary: string;
    accent: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    link: {
      default: string;
      hover: string;
      visited: string;
    };
  };
  
  // Background colors
  background: {
    main: string;
    secondary: string;
    component: string;
  };
  
  // Status colors
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  
  // Component colors
  components: {
    button: {
      background: string;
      text: string;
      border: string;
    };
    input: {
      background: string;
      text: string;
      border: string;
    };
    card: {
      background: string;
    };
    header: {
      background: string;
    };
    footer: {
      background: string;
    };
  };
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
}

export type ColorPath = string[];