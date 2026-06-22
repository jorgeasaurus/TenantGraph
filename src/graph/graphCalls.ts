import type { TenantGraph, TenantGraphResult } from '../models/tenantGraph';
import { emptyTenantGraph } from '../models/tenantGraph';
import { mergeTenantGraphs } from '../utils/graphUtils';
import { GraphError, isPermissionError } from './client';

type GraphCall = {
  label: string;
  run: () => Promise<TenantGraph>;
};

export async function collectGraphs(calls: ReadonlyArray<GraphCall>): Promise<TenantGraphResult> {
  const settled = await Promise.allSettled(calls.map((call) => call.run()));
  const graphs: TenantGraph[] = [];
  const warnings: string[] = [];
  let permissionError: string | undefined;

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      graphs.push(result.value);
      return;
    }

    const message = describeError(calls[index].label, result.reason);
    warnings.push(message);

    if (isPermissionError(result.reason)) {
      permissionError ??= message;
    }
  });

  return {
    graph: graphs.length > 0 ? mergeTenantGraphs(...graphs) : emptyTenantGraph,
    warnings,
    permissionError,
  };
}

function describeError(label: string, error: unknown): string {
  if (error instanceof GraphError) {
    return `${label}: ${error.status} ${error.code ?? error.message}`;
  }

  if (error instanceof Error) {
    return `${label}: ${error.message}`;
  }

  return `${label}: unknown error`;
}
