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
 * Fetch content type schema from Strapi
 */
export async function fetchSchema(
  url: string,
  token?: string
): Promise<StrapiSchema> {
  const baseUrl = normalizeUrl(url);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Fetch content types from content-type-builder API
  const contentTypesResponse = await fetch(
    `${baseUrl}/api/content-type-builder/content-types`,
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
    `${baseUrl}/api/content-type-builder/components`,
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
      `${baseUrl}/api/i18n/locales`,
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

/**
 * Test connection to Strapi
 */
export async function testConnection(
  url: string,
  token?: string
): Promise<{ success: boolean; message: string; version?: string }> {
  const baseUrl = normalizeUrl(url);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Try to fetch content types (requires authentication)
    const response = await fetch(
      `${baseUrl}/api/content-type-builder/content-types`,
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
