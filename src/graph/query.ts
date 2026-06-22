import { graphText } from '../utils/graphUtils';
import type { GraphObject } from './adapters';

export function localMatch(items: GraphObject[], query: string, keys: string[]): GraphObject[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => keys.some((key) => graphText(item, key)?.toLowerCase().includes(normalized)));
}

export function odataFilter(keys: string[], query: string): string {
  const escaped = odataString(query);
  return encodeURIComponent(keys.map((key) => `startswith(${key},'${escaped}')`).join(' or '));
}

export function odataString(value: string): string {
  return value.replaceAll("'", "''");
}
