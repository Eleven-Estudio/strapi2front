import type { StrapiSchema, ContentTypeSchema, ComponentSchema, StrapiLocale } from "./types.js";

interface ContentTypesApiResponse {
  data: ContentTypeSchema[];
}

interface ComponentsApiResponse {
  data: ComponentSchema[];
}

type LocalesApiResponse = StrapiLocale[];

/**
 * Normalize URL by removing trailing slashes
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Normalize API prefix (ensure it starts with / and has no trailing slash)
 */
function normalizeApiPrefix(prefix: string): string {
  let normalized = prefix.trim();
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized.replace(/\/+$/, '');
}

/**
 * Fetch content type schema from Strapi
 */
export async function fetchSchema(
  url: string,
  token?: string,
  apiPrefix: string = "/api"
): Promise<StrapiSchema> {
  const baseUrl = normalizeUrl(url);
  const prefix = normalizeApiPrefix(apiPrefix);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Fetch content types from content-type-builder API
  const contentTypesResponse = await fetch(
    `${baseUrl}${prefix}/content-type-builder/content-types`,
    { headers }
  );

  if (!contentTypesResponse.ok) {
    const error = await contentTypesResponse.text();
    throw new Error(
      `Failed to fetch content types: ${contentTypesResponse.status} ${error}`
    );
  }

  const contentTypesData = await contentTypesResponse.json() as ContentTypesApiResponse;

  // Fetch components
  const componentsResponse = await fetch(
    `${baseUrl}${prefix}/content-type-builder/components`,
    { headers }
  );

  if (!componentsResponse.ok) {
    const error = await componentsResponse.text();
    throw new Error(
      `Failed to fetch components: ${componentsResponse.status} ${error}`
    );
  }

  const componentsData = await componentsResponse.json() as ComponentsApiResponse;

  // Fetch locales (i18n)
  let locales: StrapiLocale[] = [];
  try {
    const localesResponse = await fetch(
      `${baseUrl}${prefix}/i18n/locales`,
      { headers }
    );

    if (localesResponse.ok) {
      locales = await localesResponse.json() as LocalesApiResponse;
    }
  } catch {
    // i18n might not be enabled, continue without locales
  }

  // Filter out internal Strapi content types
  const userContentTypes = (contentTypesData.data || []).filter((ct) => {
    return (
      ct.uid.startsWith("api::") &&
      !ct.uid.includes("strapi::") &&
      !ct.uid.includes("admin::")
    );
  });

  return {
    contentTypes: userContentTypes,
    components: componentsData.data || [],
    locales,
  };
}

export type StrapiVersion = "v4" | "v5";

export interface VersionDetectionResult {
  detected: StrapiVersion | null;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Detect Strapi version by analyzing content types unique to each version.
 *
 * V5-exclusive content types:
 * - plugin::content-releases.release
 * - plugin::content-releases.release-action
 * - plugin::review-workflows.workflow
 * - plugin::review-workflows.workflow-stage
 * - admin::session
 *
 * V5-exclusive attributes:
 * - entryDocumentId in plugin::content-releases.release-action
 */
export async function detectStrapiVersion(
  url: string,
  token?: string,
  apiPrefix: string = "/api"
): Promise<VersionDetectionResult> {
  const baseUrl = normalizeUrl(url);
  const prefix = normalizeApiPrefix(apiPrefix);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${baseUrl}${prefix}/content-type-builder/content-types`,
      { headers }
    );

    if (!response.ok) {
      return {
        detected: null,
        confidence: "low",
        reason: `Could not fetch schema: ${response.status}`,
      };
    }

    const data = await response.json() as ContentTypesApiResponse;
    const contentTypes = data.data || [];

    if (contentTypes.length === 0) {
      return {
        detected: null,
        confidence: "low",
        reason: "No content types found in schema",
      };
    }

    // V5-exclusive content type UIDs
    const v5ExclusiveUids = [
      "plugin::content-releases.release",
      "plugin::content-releases.release-action",
      "plugin::review-workflows.workflow",
      "plugin::review-workflows.workflow-stage",
      "admin::session",
    ];

    // Check for V5-exclusive content types
    const contentTypeUids = contentTypes.map((ct) => ct.uid);
    const foundV5ContentType = v5ExclusiveUids.find((uid) => contentTypeUids.includes(uid));

    if (foundV5ContentType) {
      return {
        detected: "v5",
        confidence: "high",
        reason: `Found v5-exclusive content type: ${foundV5ContentType}`,
      };
    }

    // Check for entryDocumentId attribute (v5 exclusive)
    const releaseAction = contentTypes.find((ct) => ct.uid === "plugin::content-releases.release-action");
    if (releaseAction?.schema?.attributes && "entryDocumentId" in releaseAction.schema.attributes) {
      return {
        detected: "v5",
        confidence: "high",
        reason: "Found entryDocumentId attribute (Strapi v5 feature)",
      };
    }

    // If none of the v5-exclusive features are found, it's v4
    // Check for typical v4 content types to confirm
    const hasV4AdminTypes = contentTypeUids.includes("admin::permission") &&
                           contentTypeUids.includes("admin::user") &&
                           !contentTypeUids.includes("admin::session");

    if (hasV4AdminTypes) {
      return {
        detected: "v4",
        confidence: "high",
        reason: "No v5-exclusive content types found, confirmed v4 structure",
      };
    }

    // Fallback - assume v4 since it's the legacy version
    return {
      detected: "v4",
      confidence: "medium",
      reason: "Could not find v5-specific features, assuming v4",
    };
  } catch (error) {
    return {
      detected: null,
      confidence: "low",
      reason: error instanceof Error ? error.message : "Detection failed",
    };
  }
}

/**
 * Test connection to Strapi
 */
export async function testConnection(
  url: string,
  token?: string,
  apiPrefix: string = "/api"
): Promise<{ success: boolean; message: string; version?: string }> {
  const baseUrl = normalizeUrl(url);
  const prefix = normalizeApiPrefix(apiPrefix);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Try to fetch content types (requires authentication)
    const response = await fetch(
      `${baseUrl}${prefix}/content-type-builder/content-types`,
      { headers }
    );

    if (response.ok) {
      return {
        success: true,
        message: "Connected successfully",
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        message: "Invalid or missing API token",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        message: "API token does not have permission to access content-type-builder",
      };
    }

    return {
      success: false,
      message: `Failed to connect: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
