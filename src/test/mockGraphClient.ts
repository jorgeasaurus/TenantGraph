import type { GraphClient, GraphPage, GraphRequestOptions, GraphVersion } from '../graph/client';

export function mockGraphClient(overrides: Partial<GraphClient> = {}): GraphClient {
  return {
    get<T>(
      path: string,
      scopes?: string[],
      version?: GraphVersion,
      options?: GraphRequestOptions,
    ): Promise<T> {
      if (overrides.get) {
        return overrides.get<T>(path, scopes, version, options);
      }
      return Promise.reject(new Error(`Unexpected Graph get call: ${path}`));
    },
    getDataUrl(path: string, scopes?: string[], version?: GraphVersion): Promise<string> {
      if (overrides.getDataUrl) {
        return overrides.getDataUrl(path, scopes, version);
      }
      return Promise.reject(new Error(`Unexpected Graph media call: ${path}`));
    },
    getPage<T>(
      path: string,
      scopes?: string[],
      version?: GraphVersion,
      options?: GraphRequestOptions,
    ): Promise<GraphPage<T>> {
      if (overrides.getPage) {
        return overrides.getPage<T>(path, scopes, version, options);
      }
      return Promise.reject(new Error(`Unexpected Graph page call: ${path}`));
    },
    getPaged<T>(
      path: string,
      scopes?: string[],
      version?: GraphVersion,
      maxPages?: number,
      options?: GraphRequestOptions,
    ): Promise<T[]> {
      if (overrides.getPaged) {
        return overrides.getPaged<T>(path, scopes, version, maxPages, options);
      }
      return Promise.reject(new Error(`Unexpected Graph paged call: ${path}`));
    },
  };
}
