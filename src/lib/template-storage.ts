// GitHub Pages projects under fleezappm-ux.github.io share one browser origin.
// Keep this template's cache, session and connection key separate from the live pharmacy site.
const namespace = "pharmacy-shift-template:v1:";

export const templateStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(namespace + key);
  },
  setItem(key: string, value: string): void {
    localStorage.setItem(namespace + key, value);
  },
  removeItem(key: string): void {
    localStorage.removeItem(namespace + key);
  },
  clearBusinessData(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(namespace) && key !== namespace + "shift_api_key") localStorage.removeItem(key);
    }
  }
};
