"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  themeColour: Theme;
  setThemeColour: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeColour, setThemeState] = useState<Theme>("dark");

  const setThemeColour = (theme: Theme) => {
    setThemeState(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("themeColour", theme);
    }
  };

  const toggleTheme = () => {
    setThemeColour(themeColour === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeColour") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeColour, setThemeColour, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
