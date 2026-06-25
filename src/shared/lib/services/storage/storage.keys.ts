// Define all local storage keys here to avoid typos and ensure type safety
export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "user_data",
  THEME: "theme",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
