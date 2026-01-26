import * as prettier from 'prettier';

/**
 * Format TypeScript code using Prettier
 */
export async function formatCode(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
    });
  } catch {
    // If formatting fails, return original code
    return code;
  }
}

/**
 * Format JSON code using Prettier
 */
export async function formatJson(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: 'json',
      tabWidth: 2,
    });
  } catch {
    return code;
  }
}
