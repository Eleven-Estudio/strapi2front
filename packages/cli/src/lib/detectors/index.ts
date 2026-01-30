export { detectFramework, getFrameworkDisplayName } from './framework.js';
export type { Framework, FrameworkInfo } from './framework.js';

export { detectTypeScript } from './typescript.js';
export type { TypeScriptInfo } from './typescript.js';

export { detectPackageManager, getInstallCommand, getRunCommand } from './package-manager.js';
export type { PackageManager, PackageManagerInfo } from './package-manager.js';

export { detectModuleType } from './module-type.js';
export type { ModuleType, ModuleTypeInfo } from './module-type.js';
