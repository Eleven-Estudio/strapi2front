import { strapi, type StrapiClient as OfficialStrapiClient } from '@strapi/client';

export interface StrapiClientConfig {
  url: string;
  token?: string;
  apiPrefix?: string;
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
 * A typed wrapper around @strapi/client
 * @see https://docs.strapi.io/cms/api/client
 */
export class StrapiClient {
  private client: OfficialStrapiClient;
  private authToken?: string;

  constructor(config: StrapiClientConfig) {
    const baseURL = config.url + (config.apiPrefix || '/api');

    this.client = strapi({
      baseURL,
      auth: config.token,
    });

    this.authToken = config.token;
  }

  /**
   * Find multiple entries for a content type
   */
  async find<T>(contentType: string, params?: Record<string, unknown>): Promise<StrapiListResponse<T>> {
    const col = this.client.collection(contentType);
    const response = await col.find(params) as any;
    return response as StrapiListResponse<T>;
  }

  /**
   * Find one entry by documentId
   */
  async findOne<T>(contentType: string, documentId: string, params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const col = this.client.collection(contentType);
    const response = await col.findOne(documentId, params) as any;
    return response as StrapiResponse<T>;
  }

  /**
   * Create a new entry
   */
  async create<T>(contentType: string, data: Partial<T>, _params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const col = this.client.collection(contentType);
    const response = await col.create(data as any) as any;
    return response as StrapiResponse<T>;
  }

  /**
   * Update an entry
   */
  async update<T>(contentType: string, documentId: string, data: Partial<T>, _params?: Record<string, unknown>): Promise<StrapiResponse<T>> {
    const col = this.client.collection(contentType);
    const response = await col.update(documentId, data as any) as any;
    return response as StrapiResponse<T>;
  }

  /**
   * Delete an entry
   */
  async delete(contentType: string, documentId: string): Promise<void> {
    const col = this.client.collection(contentType);
    await col.delete(documentId);
  }

  /**
   * Get the underlying client instance for advanced usage
   */
  getClient(): OfficialStrapiClient {
    return this.client;
  }

  /**
   * Set or update the authentication token
   * Note: Creates a new client instance with the new token
   */
  setToken(token: string): void {
    this.authToken = token;
    // @strapi/client doesn't support dynamic token updates,
    // so we store the token for reference
  }

  /**
   * Remove the authentication token
   */
  removeToken(): void {
    this.authToken = undefined;
  }

  /**
   * Get the current token
   */
  getToken(): string | undefined {
    return this.authToken;
  }
}

/**
 * Create a new Strapi client instance
 */
export function createStrapiClient(config: StrapiClientConfig): StrapiClient {
  return new StrapiClient(config);
}
