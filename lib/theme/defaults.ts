import { ThemeColors } from './types';

export const defaultTheme: ThemeColors = {
  primary: {
    main: '#574964',
    secondary: '#9F8383',
    accent: '#C39898',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    link: {
      default: '#2563EB',
      hover: '#1D4ED8',
      visited: '#4338CA',
    },
  },
  background: {
    main: '#F5F5F5',
    secondary: '#FFFFFF',
    component: '#FFFFFF',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  components: {
    button: {
      background: '#574964',
      text: '#FFFFFF',
      border: '#4A3D54',
    },
    input: {
      background: '#FFFFFF',
      text: '#1A1A1A',
      border: '#E5E7EB',
    },
    card: {
      background: '#FFFFFF',
    },
    header: {
      background: '#FFFFFF',
    },
    footer: {
      background: '#F9FAFB',
    },
  },
};