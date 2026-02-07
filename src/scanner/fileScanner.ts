import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import type { Ignore } from 'ignore';
import ignore from 'ignore';
import { join, resolve, extname } from 'path';
import { FileError } from '../errors';

export interface ScanOptions {
  path: string;
  ignore?: string[];
  extensions?: string[];
}

// Scan directory or single file for matching files
export async function scanFiles(options: ScanOptions): Promise<string[]> {
  const { path, ignore: ignorePatterns = [], extensions = ['.js', '.ts', '.jsx', '.tsx'] } = options;

  // Check if path is a file or directory
  let stats;
  try {
    stats = await stat(path);
  } catch (error) {
    // Try adding extensions if file doesn't exist
    for (const ext of extensions) {
      try {
        const pathWithExt = path + ext;
        stats = await stat(pathWithExt);
        // If we found it with an extension, scan that file
        return [resolve(pathWithExt)];
      } catch {
        continue;
      }
    }
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new FileError(
      `Path not found`,
      { path, triedExtensions: extensions },
      cause
    );
  }

  // If it's a file, return just that file
  if (stats.isFile()) {
    const filePath = resolve(path);
    const ext = getFileExtension(filePath);
    
    // Check if file has a valid extension
    if (!extensions.includes(ext)) {
      throw new FileError(
        `File extension not supported`,
        { path: filePath, extension: ext, supportedExtensions: extensions }
      );
    }
    
    return [filePath];
  }

  // If it's a directory, scan all matching files
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
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new FileError(
      `Failed to read file`,
      { filePath, error: cause.message },
      cause
    );
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
