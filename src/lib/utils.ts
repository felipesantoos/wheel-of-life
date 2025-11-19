import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculates the relative luminance of a color
 * @param hex - Color in hex format (e.g., "#3b82f6")
 * @returns Luminance value between 0 and 1
 */
function getLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace("#", "");
  
  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determines if text should be white or black based on background color
 * @param backgroundColor - Background color in hex format (e.g., "#3b82f6")
 * @returns "white" or "black"
 */
export function getContrastTextColor(backgroundColor: string): "white" | "black" {
  const luminance = getLuminance(backgroundColor);
  // If luminance is high (light color), use black text; otherwise use white
  return luminance > 0.5 ? "black" : "white";
}

