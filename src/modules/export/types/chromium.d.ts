// src/modules/export/types/chromium.d.ts
declare module '@sparticuz/chromium' {
  export const args: string[];
  export const headless: boolean | 'shell';
  export function executablePath(): Promise<string>;
}
