"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | `data-${string}`;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const DEFAULT_STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function readStoredTheme(storageKey: string): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(storageKey);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // Ignore storage access errors.
  }

  return null;
}

function withTransitionGuard(disableTransitionOnChange: boolean): (() => void) | null {
  if (!disableTransitionOnChange || typeof document === "undefined") {
    return null;
  }

  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;animation:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    void window.getComputedStyle(document.body);
    requestAnimationFrame(() => {
      style.remove();
    });
  };
}

function applyThemeToDom(
  attribute: ThemeProviderProps["attribute"],
  resolvedTheme: ResolvedTheme,
  disableTransitionOnChange: boolean,
) {
  if (typeof document === "undefined") {
    return;
  }

  const restoreTransitions = withTransitionGuard(disableTransitionOnChange);
  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.toggle("dark", resolvedTheme === "dark");
  } else {
    root.setAttribute(attribute ?? "data-theme", resolvedTheme);
  }

  root.style.colorScheme = resolvedTheme;
  restoreTransitions?.();
}

function resolveTheme(theme: Theme, enableSystem: boolean, systemTheme: ResolvedTheme): ResolvedTheme {
  if (theme === "system" && enableSystem) {
    return systemTheme;
  }

  return theme === "dark" ? "dark" : "light";
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(
    () => readStoredTheme(storageKey) ?? defaultTheme,
  );
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = React.useMemo(
    () => resolveTheme(theme, enableSystem, systemTheme),
    [theme, enableSystem, systemTheme],
  );

  React.useEffect(() => {
    const media = window.matchMedia(MEDIA_QUERY);
    const onChange = () => {
      setSystemTheme(media.matches ? "dark" : "light");
    };

    onChange();
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    applyThemeToDom(attribute, resolvedTheme, disableTransitionOnChange);
  }, [attribute, resolvedTheme, disableTransitionOnChange]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage access errors.
    }
  }, [storageKey, theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
