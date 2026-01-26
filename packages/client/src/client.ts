import Strapi from 'strapi-sdk-js';

export interface StrapiClientConfig {
  url: string;
  token?: string;
  axiosOptions?: Record<string, unknown>;
}

/**
 * Strapi response types
 */
export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface StrapiResponse<T> {
  data: T;
  meta: StrapiMeta;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: StrapiMeta & {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Strapi Client
 * A typed wrapper around strapi-sdk-js
 */
export class StrapiClient {
  private sdk: Strapi;

  constructor(config: StrapiClientConfig) {
    this.sdk = new Strapi({
      url: config.url,
      axiosOptions: config.axiosOptions,
    });

    // Set token if provided
    if (config.token) {
      this.sdk.setToken(config.token);
    }
  }

  /**
   * Find multiple entries for a content type
   */
  async find<T>(contentType: string, params?: Record<string, unknown>): Promise<StrapiListResponse<T>> {
    const response = await this.sdk.find<T[]>(contentType, params);
    return response as unknown as StrapiListResponse<T>;
  }

  /**
   * Find one entry by documentId
   */
  async findOne<T>(contentType: string, documentId: string, params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const response = await this.sdk.findOne<T>(contentType, documentId, params);
    return response as unknown as StrapiResponse<T>;
  }

  /**
   * Create a new entry
   */
  async create<T>(contentType: string, data: Partial<T>, params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const response = await this.sdk.create<T>(contentType, data, params);
    return response as unknown as StrapiResponse<T>;
  }

  /**
   * Update an entry
   */
  async update<T>(contentType: string, documentId: string, data: Partial<T>, params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const response = await this.sdk.update<T>(contentType, documentId, data, params);
    return response as unknown as StrapiResponse<T>;
  }

  /**
   * Delete an entry
   */
  async delete(contentType: string, documentId: string): Promise<void> {
    await this.sdk.delete(contentType, documentId);
  }

  /**
   * Get the underlying SDK instance for advanced usage
   */
  getSdk(): Strapi {
    return this.sdk;
  }

  /**
   * Set or update the authentication token
   */
  setToken(token: string): void {
    this.sdk.setToken(token);
  }

  /**
   * Remove the authentication token
   */
  removeToken(): void {
    this.sdk.removeToken();
  }

  /**
   * Get the current token
   */
  getToken(): string | null {
    return this.sdk.getToken();
  }
}

/**
 * Create a new Strapi client instance
 */
export function createStrapiClient(config: StrapiClientConfig): StrapiClient {
  return new StrapiClient(config);
}
