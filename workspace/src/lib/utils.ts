
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compressImage(file: File, quality = 0.8, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Use 'image/webp' for better compression, fallback to 'image/jpeg'
        const dataUrl = canvas.toDataURL('image/webp', quality);
        if (dataUrl.length > 10) { // Check if webp is supported
           resolve(dataUrl);
        } else {
           resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
    };
  });
}

export const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            // If it's already formatted (like "8:49 PM"), just return it.
            if (typeof isoString === 'string' && (isoString.includes('AM') || isoString.includes('PM'))) {
              return isoString;
            }
            throw new Error('Invalid date');
        }
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (e) {
        console.error("Invalid timestamp format:", isoString);
        return '';
    }
}
    