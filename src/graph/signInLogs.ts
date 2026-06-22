import { conditionalAccessDetailScopes, signInLogScopes } from '../auth/msal';
import type { SignInQueryResult } from '../models/signInLog';
import type { GraphClient } from './client';
import { type GraphSignIn, signInEventFromGraph } from './signInLogAdapter';
import {
  eventMatchesCa,
  eventMatchesNode,
  eventMatchesResult,
  signInLogPath,
  type SignInLogQuery,
} from './signInLogQuery';

const caPreferHeader = { Prefer: 'include-unknown-enum-members' };

export async function loadSignInLogs(
  client: GraphClient,
  query: SignInLogQuery,
  nextLink?: string,
): Promise<SignInQueryResult> {
  const path = nextLink ?? signInLogPath(query);
  const scopes = query.includePolicyDetails
    ? [...signInLogScopes, ...conditionalAccessDetailScopes]
    : signInLogScopes;
  const page = await client.getPage<GraphSignIn>(path, scopes, 'v1.0', {
    headers: caPreferHeader,
  });
  const events = (page.value ?? [])
    .map(signInEventFromGraph)
    .filter((event) => eventMatchesNode(event, query.node))
    .filter((event) => eventMatchesResult(event, query.resultFilter))
    .filter((event) => eventMatchesCa(event, query.caFilter));

  return {
    events,
    nextLink: page['@odata.nextLink'],
  };
}

export { classifyConditionalAccess } from './conditionalAccessEvaluation';
export {
  replaceSignInEventProjection,
  signInEventToGraph,
  signInEventNodeId,
  type ConditionalAccessPolicyGraphFilter,
} from './signInEventGraph';
export {
  signInLogPath,
  signInLogSubject,
  type SignInLogQuery,
} from './signInLogQuery';
