import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names safely with tailwind-merge and clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
