import * as p from "@clack/prompts";
import pc from "picocolors";
import { getFrameworkDisplayName, type FrameworkInfo } from "../detectors/framework.js";
import type { TypeScriptInfo } from "../detectors/typescript.js";
import type { PackageManagerInfo } from "../detectors/package-manager.js";

export interface DetectionResults {
  framework: FrameworkInfo;
  typescript: TypeScriptInfo;
  packageManager: PackageManagerInfo;
}

export interface InitPromptAnswers {
  strapiUrl: string;
  strapiToken: string;
  strapiVersion: "v4" | "v5";
  apiPrefix: string;
  outputFormat: "typescript" | "jsdoc";
  outputDir: string;
  generateTypes: boolean;
  generateServices: boolean;
  generateActions: boolean;
  generateSchemas: boolean;
  generateUpload: boolean;
}

/**
 * Parse version string to get major version number
 */
function getMajorVersion(version: string | null): number | null {
  if (!version) return null;
  // Remove ^ or ~ prefix and get first number
  const match = version.replace(/^[\^~]/, "").match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export async function runInitPrompts(detection: DetectionResults): Promise<InitPromptAnswers | null> {
  p.intro(pc.cyan("strapi2front setup"));

  // Show detected info
  p.note(
    [
      `Framework: ${pc.green(getFrameworkDisplayName(detection.framework.name))} ${detection.framework.version ? pc.dim(`v${detection.framework.version}`) : ""}`,
      `TypeScript: ${detection.typescript.enabled ? pc.green("enabled") : pc.yellow("disabled")}`,
      `Package Manager: ${pc.green(detection.packageManager.name)}`,
    ].join("\n"),
    "Detected Configuration"
  );

  // Track feature availability
  let canGenerateActions = true;

  // Check framework support for additional features
  if (detection.framework.name === "unknown") {
    // Unknown framework - generate types and services only
    canGenerateActions = false;
  } else if (detection.framework.name !== "astro") {
    // Non-Astro framework - generate types and services only (for now)
    canGenerateActions = false;
  } else {
    // Astro - check version for Actions support (requires v4+)
    const majorVersion = getMajorVersion(detection.framework.version);
    if (majorVersion !== null && majorVersion < 4) {
      p.log.warn(pc.yellow(`Astro v${majorVersion} detected. Upgrade to v4+ to enable Actions.`));
      canGenerateActions = false;
    }
  }

  // Determine output format based on TypeScript support
  let outputFormat: "typescript" | "jsdoc" = "typescript";

  if (!detection.typescript.enabled) {
    p.log.info(pc.dim("TypeScript not detected. Files will be generated as JavaScript with JSDoc annotations."));
    outputFormat = "jsdoc";
  }

  // Prompt for Strapi connection
  const defaultUrl = "http://localhost:1337";
  const strapiUrlInput = await p.text({
    message: "What is your Strapi URL?",
    placeholder: `${defaultUrl} (press Enter for default)`,
    validate: (value): string | undefined => {
      const trimmed = (value || "").trim();
      // Allow empty (will use default)
      if (trimmed === "") return undefined;
      try {
        new URL(trimmed);
        return undefined;
      } catch {
        return "Please enter a valid URL";
      }
    },
  });

  if (p.isCancel(strapiUrlInput)) {
    p.cancel("Setup cancelled");
    return null;
  }

  // Use default if empty or whitespace only
  const strapiUrl = ((strapiUrlInput as string) || "").trim() || defaultUrl;

  // Show token permissions hint
  p.log.message(
    pc.dim(
      `\n  To generate a token: Strapi Admin > Settings > API Tokens > Create new API Token\n` +
      `  Required permissions:\n` +
      `    Content-type-builder:\n` +
      `      - Components: getComponents, getComponent\n` +
      `      - Content-types: getContentTypes, getContentType\n` +
      `    I18n (if using localization):\n` +
      `      - Locales: listLocales\n`
    )
  );

  const strapiToken = await p.text({
    message: "What is your Strapi API token?",
    placeholder: "Press Enter to skip (you can add it later in .env)",
  });

  if (p.isCancel(strapiToken)) {
    p.cancel("Setup cancelled");
    return null;
  }

  // Trim and check if empty
  const trimmedToken = ((strapiToken as string) || "").trim();

  // Show hint if token is empty
  if (trimmedToken === "") {
    p.log.info(pc.dim("Token skipped. Remember to add STRAPI_TOKEN to your .env file later."));
  }

  // Strapi version
  const strapiVersion = await p.select({
    message: "What version of Strapi are you using?",
    options: [
      { value: "v5", label: "Strapi v5", hint: "Recommended - Latest version" },
      { value: "v4", label: "Strapi v4", hint: "Legacy version" },
    ],
    initialValue: "v5",
  });

  if (p.isCancel(strapiVersion)) {
    p.cancel("Setup cancelled");
    return null;
  }

  p.log.info(pc.dim(`Using Strapi ${strapiVersion}. This can be changed later in strapi.config.ts`));

  // API Prefix
  const defaultPrefix = "/api";
  const apiPrefixInput = await p.text({
    message: "What is your Strapi API prefix?",
    placeholder: `${defaultPrefix} (press Enter for default)`,
    validate: (value): string | undefined => {
      const trimmed = (value || "").trim();
      if (trimmed === "") return undefined;
      if (!trimmed.startsWith("/")) {
        return "API prefix must start with /";
      }
      return undefined;
    },
  });

  if (p.isCancel(apiPrefixInput)) {
    p.cancel("Setup cancelled");
    return null;
  }

  const apiPrefix = ((apiPrefixInput as string) || "").trim() || defaultPrefix;

  if (apiPrefix !== defaultPrefix) {
    p.log.info(pc.dim(`Using custom API prefix: ${apiPrefix}`));
  }

  // Output directory
  const outputDir = await p.text({
    message: "Where should we generate the Strapi files?",
    placeholder: "src/strapi",
    defaultValue: "src/strapi",
  });

  if (p.isCancel(outputDir)) {
    p.cancel("Setup cancelled");
    return null;
  }

  // Features to generate - labels depend on output format
  const isTypeScript = outputFormat === "typescript";
  const featureOptions = [
    {
      value: "types",
      label: isTypeScript ? "Types" : "Type Definitions",
      hint: isTypeScript
        ? "TypeScript interfaces for your content types"
        : "JSDoc type definitions for your content types"
    },
    {
      value: "services",
      label: "Services",
      hint: isTypeScript
        ? "Typed service functions for data fetching"
        : "Service functions with JSDoc annotations"
    },
  ];

  // Schemas require TypeScript (generated code uses `export type` and `z.infer<typeof>`)
  if (isTypeScript) {
    featureOptions.push({
      value: "schemas",
      label: "Schemas",
      hint: "Zod validation schemas for forms (React Hook Form, TanStack Form, etc.)"
    });
  }

  featureOptions.push({
    value: "upload",
    label: "Upload",
    hint: "File upload helpers (action + public client for browser uploads)"
  });

  // Only show Astro Actions if available (requires TypeScript)
  if (canGenerateActions && isTypeScript) {
    featureOptions.push({ value: "actions", label: "Astro Actions", hint: "Type-safe actions for client/server" });
  }

  const initialFeatures: string[] = ["types", "services"];
  if (isTypeScript) initialFeatures.push("schemas");
  if (canGenerateActions && isTypeScript) initialFeatures.push("actions");

  const features = await p.multiselect({
    message: "What would you like to generate?",
    options: featureOptions,
    initialValues: initialFeatures,
    required: true,
  });

  if (p.isCancel(features)) {
    p.cancel("Setup cancelled");
    return null;
  }

  // Validate feature dependencies and auto-enable required features
  const selectedFeatures = new Set(features as string[]);

  // Dependency chain: types ← services ← actions
  if (selectedFeatures.has("services") && !selectedFeatures.has("types")) {
    selectedFeatures.add("types");
    p.log.info(pc.dim("Auto-enabled Types (required by Services)"));
  }
  if (selectedFeatures.has("actions") && !selectedFeatures.has("services")) {
    selectedFeatures.add("services");
    p.log.info(pc.dim("Auto-enabled Services (required by Actions)"));
    if (!selectedFeatures.has("types")) {
      selectedFeatures.add("types");
      p.log.info(pc.dim("Auto-enabled Types (required by Services)"));
    }
  }

  return {
    strapiUrl: strapiUrl,
    strapiToken: trimmedToken,
    strapiVersion: strapiVersion as "v4" | "v5",
    apiPrefix: apiPrefix,
    outputFormat: outputFormat,
    outputDir: ((outputDir as string) || "").trim() || "src/strapi",
    generateTypes: selectedFeatures.has("types"),
    generateServices: selectedFeatures.has("services"),
    generateActions: canGenerateActions && isTypeScript && selectedFeatures.has("actions"),
    generateSchemas: selectedFeatures.has("schemas"),
    generateUpload: selectedFeatures.has("upload"),
  };
}

export async function confirmOverwrite(files: string[]): Promise<boolean> {
  const confirm = await p.confirm({
    message: `The following files will be overwritten:\n${files.map((f) => `  - ${f}`).join("\n")}\n\nContinue?`,
    initialValue: true,
  });

  return !p.isCancel(confirm) && confirm === true;
}
