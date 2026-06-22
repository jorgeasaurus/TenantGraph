import { graphReadScopes } from '../auth/msal';

export type GraphVersion = 'v1.0' | 'beta';
export type TokenProvider = (scopes?: string[]) => Promise<string>;

export type GraphPage<T> = {
  value?: T[];
  '@odata.nextLink'?: string;
};

export type GraphRequestOptions = {
  headers?: Record<string, string>;
};

export class GraphError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'GraphError';
    this.status = status;
    this.code = code;
  }
}

export type GraphClient = ReturnType<typeof createGraphClient>;

export function createGraphClient(getToken: TokenProvider) {
  async function request<T>(
    path: string,
    scopes = graphReadScopes,
    version: GraphVersion = 'v1.0',
    options: GraphRequestOptions = {},
  ): Promise<T> {
    const token = await getToken(scopes);
    const response = await fetch(toGraphUrl(path, version), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw await graphErrorFromResponse(response);
    }

    return (await response.json()) as T;
  }

  return {
    get: request,
    getPage<T>(
      path: string,
      scopes = graphReadScopes,
      version: GraphVersion = 'v1.0',
      options: GraphRequestOptions = {},
    ): Promise<GraphPage<T>> {
      return request<GraphPage<T>>(path, scopes, version, options);
    },
    async getPaged<T>(
      path: string,
      scopes = graphReadScopes,
      version: GraphVersion = 'v1.0',
      maxPages = 2,
      options: GraphRequestOptions = {},
    ): Promise<T[]> {
      const values: T[] = [];
      let next: string | undefined = path;
      let page = 0;

      while (next && page < maxPages) {
        const result: GraphPage<T> = await request<GraphPage<T>>(next, scopes, version, options);
        values.push(...(result.value ?? []));
        next = result['@odata.nextLink'];
        page += 1;
      }

      return values;
    },
    async getDataUrl(
      path: string,
      scopes = graphReadScopes,
      version: GraphVersion = 'v1.0',
    ): Promise<string> {
      const token = await getToken(scopes);
      const response = await fetch(toGraphUrl(path, version), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'image/*',
        },
      });

      if (!response.ok) {
        throw await graphErrorFromResponse(response);
      }

      return blobToDataUrl(await response.blob(), response.headers.get('content-type'));
    },
  };
}

export function isPermissionError(error: unknown): error is GraphError {
  return error instanceof GraphError && (error.status === 401 || error.status === 403);
}

function toGraphUrl(path: string, version: GraphVersion): string {
  if (path.startsWith('https://')) {
    return path;
  }

  return `https://graph.microsoft.com/${version}${path.startsWith('/') ? path : `/${path}`}`;
}

async function graphErrorFromResponse(response: Response): Promise<GraphError> {
  let message = response.statusText;
  let code: string | undefined;

  try {
    const body = (await response.clone().json()) as {
      error?: { code?: string; message?: string };
    };
    message = body.error?.message ?? message;
    code = body.error?.code;
  } catch {
    try {
      message = (await response.text()) || message;
    } catch {
      // Keep the status text.
    }
  }

  return new GraphError(response.status, message, code);
}

async function blobToDataUrl(blob: Blob, contentType: string | null): Promise<string> {
  const typedBlob = contentType && contentType !== blob.type ? new Blob([blob], { type: contentType }) : blob;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read Microsoft Graph media.'));
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Microsoft Graph media was not readable.'));
    reader.readAsDataURL(typedBlob);
  });
}
