import { useCallback, useEffect, useRef, useState } from 'react';
import type { TenantNode } from '../../models/tenantGraph';
import { useLazyRef } from '../../utils/useLazyRef';

type NodeImageCacheEntry = {
  image?: HTMLImageElement;
  loading?: boolean;
  src: string;
};

export function useNodeImageCache(nodes: TenantNode[]) {
  const cacheRef = useLazyRef(() => new Map<string, NodeImageCacheEntry>());
  const mountedRef = useRef(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const cache = cacheRef.current;
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cache.clear();
    };
  }, [cacheRef]);

  useEffect(() => {
    for (const node of nodes) {
      const src = nodeImageDataUrl(node);
      if (!src) {
        continue;
      }

      const cached = cacheRef.current.get(node.id);
      if (cached?.src === src && (cached.image || cached.loading)) {
        continue;
      }

      const image = new Image();
      cacheRef.current.set(node.id, { src, loading: true });
      image.onload = () => {
        cacheRef.current.set(node.id, { src, image });
        if (mountedRef.current) {
          setVersion((current) => current + 1);
        }
      };
      image.onerror = () => {
        cacheRef.current.delete(node.id);
        if (mountedRef.current) {
          setVersion((current) => current + 1);
        }
      };
      image.src = src;
    }
  }, [cacheRef, nodes]);

  const getImage = useCallback((nodeId: string) => cacheRef.current.get(nodeId)?.image, [cacheRef]);

  return { getImage, version };
}

function nodeImageDataUrl(node: TenantNode): string | undefined {
  if (node.type !== 'app' && node.type !== 'user') {
    return undefined;
  }

  const value = node.iconDataUrl;
  return typeof value === 'string' && isImageSource(value) ? value : undefined;
}

function isImageSource(value: string): boolean {
  return value.startsWith('data:image/') || /^\/[\w./-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value);
}
