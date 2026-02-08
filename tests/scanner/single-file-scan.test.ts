import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { scanFiles } from '../../src/scanner/fileScanner';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

const testDir = join(process.cwd(), '.test-single-file');
const testFile = join(testDir, 'test.js');
const testFileNoExt = join(testDir, 'test-no-ext');

beforeAll(async () => {
  await mkdir(testDir, { recursive: true });
  await writeFile(testFile, 'console.log("test");');
  await writeFile(testFileNoExt + '.js', 'console.log("test");');
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('Single File Scanning', () => {
  test('should scan single file with extension', async () => {
    const files = await scanFiles({ path: testFile });
    expect(files.length).toBe(1);
    expect(files[0]).toBe(testFile);
  });

  test('should scan single file without extension', async () => {
    const files = await scanFiles({ path: testFileNoExt });
    expect(files.length).toBe(1);
    expect(files[0]).toEndWith('.js');
  });

  test('should scan directory', async () => {
    const files = await scanFiles({ path: testDir });
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  test('should reject unsupported file extensions', async () => {
    const txtFile = join(testDir, 'test.txt');
    await writeFile(txtFile, 'test content');

    try {
      await scanFiles({ path: txtFile });
      expect(true).toBe(false); // Should not reach here
    } catch (error: unknown) {
      expect((error as Error).message).toContain('not supported');
    }
  });

  test('should throw error for non-existent path', async () => {
    try {
      await scanFiles({ path: '/non/existent/path' });
      expect(true).toBe(false); // Should not reach here
    } catch (error: unknown) {
      expect((error as Error).message).toContain('not found');
    }
  });
});
