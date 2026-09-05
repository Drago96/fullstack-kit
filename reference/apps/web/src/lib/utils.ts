import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Every primitive in src/components/ui composes its class list through this: clsx flattens
// the conditionals, tailwind-merge drops the Tailwind classes a later one overrides, so a
// `className` prop wins over the variant's own.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
