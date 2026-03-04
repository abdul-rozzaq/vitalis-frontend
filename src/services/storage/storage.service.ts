import { StorageKey } from "./storage.keys";

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  setItem<T>(key: StorageKey, value: T): void {
    if (!this.isBrowser()) return;

    try {
      const serializedValue = JSON.stringify(value);
      window.localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving to localStorage for key "${key}":`, error);
    }
  }

  getItem<T>(key: StorageKey, defaultValue: T | null = null): T | null {
    if (!this.isBrowser()) return defaultValue;

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  }

  removeItem(key: StorageKey): void {
    if (!this.isBrowser()) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
  }

  clear(): void {
    if (!this.isBrowser()) return;

    try {
      window.localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();
