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
  outputDir: string;
  generateActions: boolean;
  generateServices: boolean;
}

export async function runInitPrompts(detection: DetectionResults): Promise<InitPromptAnswers | null> {
  p.intro(pc.cyan("strapi-integrate setup"));

  // Show detected info
  p.note(
    [
      `Framework: ${pc.green(getFrameworkDisplayName(detection.framework.name))} ${detection.framework.version ? pc.dim(`v${detection.framework.version}`) : ""}`,
      `TypeScript: ${detection.typescript.enabled ? pc.green("enabled") : pc.yellow("disabled")}`,
      `Package Manager: ${pc.green(detection.packageManager.name)}`,
    ].join("\n"),
    "Detected Configuration"
  );

  // Check framework support
  if (detection.framework.name === "unknown") {
    p.cancel("Could not detect a supported framework. Currently only Astro is supported.");
    return null;
  }

  if (detection.framework.name !== "astro") {
    p.cancel(`${detection.framework.name} is not yet supported. Currently only Astro is supported.`);
    return null;
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

  // Features to generate
  const features = await p.multiselect({
    message: "What would you like to generate?",
    options: [
      { value: "types", label: "Types", hint: "TypeScript interfaces for your content types" },
      { value: "services", label: "Services", hint: "Typed service functions for data fetching" },
      { value: "actions", label: "Astro Actions", hint: "Type-safe actions for client/server" },
    ],
    initialValues: ["types", "services", "actions"],
    required: true,
  });

  if (p.isCancel(features)) {
    p.cancel("Setup cancelled");
    return null;
  }

  return {
    strapiUrl: strapiUrl,
    strapiToken: trimmedToken,
    strapiVersion: strapiVersion as "v4" | "v5",
    outputDir: ((outputDir as string) || "").trim() || "src/strapi",
    generateActions: (features as string[]).includes("actions"),
    generateServices: (features as string[]).includes("services"),
  };
}

export async function confirmOverwrite(files: string[]): Promise<boolean> {
  const confirm = await p.confirm({
    message: `The following files will be overwritten:\n${files.map((f) => `  - ${f}`).join("\n")}\n\nContinue?`,
    initialValue: true,
  });

  return !p.isCancel(confirm) && confirm === true;
}
