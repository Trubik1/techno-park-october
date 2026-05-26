import { createContext, useContext } from 'react';

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);
