import React, { createContext, useState, useEffect, useContext } from "react";
import { storageService } from "../services/storageService";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const settings = storageService.getSettings();
    return settings.appearance?.theme || "dark";
  });

  useEffect(() => {
    // Apply theme attribute/class to HTML element
    const root = window.document.documentElement;
    root.setAttribute("data-theme", theme);
    
    // Save to settings
    const settings = storageService.getSettings();
    if (settings.appearance) {
      settings.appearance.theme = theme;
      storageService.saveSettings(settings);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
