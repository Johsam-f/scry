import { glob } from 'glob';
import { readFile } from 'fs/promises';
import type { Ignore } from 'ignore';
import ignore from 'ignore';
import { join } from 'path';

export interface ScanOptions {
  path: string;
  ignore?: string[];
  extensions?: string[];
}

// Scan directory for matching files
export async function scanFiles(options: ScanOptions): Promise<string[]> {
  const { path, ignore: ignorePatterns = [], extensions = ['.js', '.ts', '.jsx', '.tsx'] } = options;

  const pattern = `${path}/**/*{${extensions.join(',')}}`;

  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.next/**',
      '**/coverage/**',
      ...ignorePatterns
    ],
    absolute: true,
    nodir: true
  });

  return files;
}

// Read file content
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

// Get file extension
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.[^.]*$/);
  return match ? match[0] : '';
}

// Check if file should be scanned
export function shouldScanFile(
  filePath: string,
  extensions: string[],
  ignorePatterns: string[]
): boolean {
  const ext = getFileExtension(filePath);
  
  if (!extensions.includes(ext)) {
    return false;
  }

  const ig = ignore().add(ignorePatterns);
  return !ig.ignores(filePath);
}
