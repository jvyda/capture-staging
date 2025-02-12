export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Remove # if present
    color = color.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16) / 255;
    const g = parseInt(color.substr(2, 2), 16) / 255;
    const b = parseInt(color.substr(4, 2), 16) / 255;
    
    // Calculate luminance
    const [rr, gg, bb] = [r, g, b].map(c => {
      if (c <= 0.03928) {
        return c / 12.92;
      }
      return Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function hexToRGB(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `${r}, ${g}, ${b}`;
}

export function generateCssVariables(colors: Record<string, any>, prefix = ''): Record<string, string> {
  const variables: Record<string, string> = {};
  
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.assign(variables, generateCssVariables(value, prefix ? `${prefix}-${key}` : key));
    } else if (typeof value === 'string' && value.startsWith('#')) {
      // Convert hex colors to RGB values for theme variables
      const path = prefix ? `${prefix}-${key}` : key;
      if (path.includes('color-')) {
        variables[`--${path}`] = hexToRGB(value);
      } else {
        variables[`--${path}`] = value;
      }
    } else {
      const path = prefix ? `${prefix}-${key}` : key;
      variables[`--${path}`] = value;
    }
  });
  
  return variables;
}

export function applyThemeVariables(variables: Record<string, string>): void {
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}