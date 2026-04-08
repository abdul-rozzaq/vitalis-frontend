import { ApiErrorShape } from "./types";

export const getInitialPhotoPreview = (apiBase: string, photo?: string | null): string | null => (photo ? `${apiBase}${photo}` : null);

export const getApiErrorMessage = (error: unknown): string | undefined => (error as ApiErrorShape)?.response?.data?.message;
