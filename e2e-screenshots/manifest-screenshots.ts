import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Reads the screenshot list from src/manifest.json so the capture sizes and file names can
// never drift from what the manifest declares.
interface IManifestScreenshot {
  src: string;
  sizes: string;
  form_factor: 'narrow' | 'wide';
}

const SRC_DIR = join(__dirname, '..', 'src');
const manifest = JSON.parse(readFileSync(join(SRC_DIR, 'manifest.json'), 'utf8')) as { screenshots: IManifestScreenshot[] };

export type FormFactor = IManifestScreenshot['form_factor'];
export const SCREENSHOT_FORM_FACTORS: FormFactor[] = ['narrow', 'wide'];

export const SCREENSHOT_ENTRIES = manifest.screenshots.map(entry => {
  const [width, height] = entry.sizes.split('x').map(Number);
  return { formFactor: entry.form_factor, width, height, file: join(SRC_DIR, entry.src), name: entry.src.split('/').pop()!.replace('.png', '') };
});

export const SCREENSHOT_SIZES = Object.fromEntries(
  SCREENSHOT_FORM_FACTORS.map(factor => {
    const entry = SCREENSHOT_ENTRIES.find(e => e.formFactor === factor)!;
    return [factor, { width: entry.width, height: entry.height }];
  })
) as Record<FormFactor, { width: number; height: number }>;
