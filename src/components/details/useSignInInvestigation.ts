import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { GraphError, type GraphClient } from '../../graph/client';
import { loadSignInLogs, signInLogSubject } from '../../graph/signInLogs';
import type {
  ConditionalAccessFilter,
  SignInEvent,
  SignInQueryResult,
  SignInResultFilter,
} from '../../models/signInLog';
import type { TenantNode } from '../../models/tenantGraph';

const defaultRangeDays = 7;
const pageSize = 25;

type SignInSummary = {
  caFailures: number;
  failures: number;
  reportOnly: number;
  total: number;
};

type SignInInvestigationState = {
  caFilter: ConditionalAccessFilter;
  error?: string;
  events: SignInEvent[];
  hasLoaded: boolean;
  includePolicyDetails: boolean;
  loading: boolean;
  nextLink?: string;
  rangeDays: number;
  resultFilter: SignInResultFilter;
  selectedEventId?: string;
};

type SignInInvestigationAction =
  | { type: 'loadFailed'; error: string }
  | { type: 'loadStarted' }
  | { type: 'loadSucceeded'; mode: 'append' | 'replace'; result: SignInQueryResult }
  | { type: 'reset' }
  | { type: 'selectEvent'; eventId: string }
  | { type: 'setCaFilter'; caFilter: ConditionalAccessFilter }
  | { type: 'setIncludePolicyDetails'; includePolicyDetails: boolean }
  | { type: 'setRangeDays'; rangeDays: number }
  | { type: 'setResultFilter'; resultFilter: SignInResultFilter };

export function useSignInInvestigation(client: GraphClient, node: TenantNode | undefined) {
  const [state, dispatch] = useReducer(signInInvestigationReducer, undefined, initialSignInInvestigationState);
  const subject = signInLogSubject(node);
  const supported = Boolean(subject);
  const selectedEvent = state.events.find((event) => event.id === state.selectedEventId) ?? state.events[0];
  const summary = useMemo(() => summarizeSignIns(state.events), [state.events]);

  useEffect(() => {
    dispatch({ type: 'reset' });
  }, [node?.id]);

  const load = useCallback(
    async (mode: 'append' | 'replace') => {
      if (!subject) {
        return;
      }

      dispatch({ type: 'loadStarted' });

      try {
        const result = await loadSignInLogs(
          client,
          {
            caFilter: state.caFilter,
            includePolicyDetails: state.includePolicyDetails,
            node: subject,
            rangeDays: state.rangeDays,
            resultFilter: state.resultFilter,
            top: pageSize,
          },
          mode === 'append' ? state.nextLink : undefined,
        );
        dispatch({ type: 'loadSucceeded', mode, result });
      } catch (loadError) {
        dispatch({ type: 'loadFailed', error: signInErrorMessage(loadError) });
      }
    },
    [
      client,
      subject,
      state.caFilter,
      state.includePolicyDetails,
      state.nextLink,
      state.rangeDays,
      state.resultFilter,
    ],
  );

  const resetAndLoad = useCallback(() => {
    dispatch({ type: 'reset' });
    void load('replace');
  }, [load]);

  return {
    actions: {
      load,
      resetAndLoad,
      selectEvent: (eventId: string) => dispatch({ type: 'selectEvent', eventId }),
      setCaFilter: (caFilter: ConditionalAccessFilter) => dispatch({ type: 'setCaFilter', caFilter }),
      setIncludePolicyDetails: (includePolicyDetails: boolean) =>
        dispatch({ type: 'setIncludePolicyDetails', includePolicyDetails }),
      setRangeDays: (rangeDays: number) => dispatch({ type: 'setRangeDays', rangeDays }),
      setResultFilter: (resultFilter: SignInResultFilter) => dispatch({ type: 'setResultFilter', resultFilter }),
    },
    selectedEvent,
    state,
    summary,
    supported,
  };
}

function initialSignInInvestigationState(): SignInInvestigationState {
  return {
    caFilter: 'all',
    events: [],
    hasLoaded: false,
    includePolicyDetails: false,
    loading: false,
    rangeDays: defaultRangeDays,
    resultFilter: 'all',
  };
}

function signInInvestigationReducer(
  state: SignInInvestigationState,
  action: SignInInvestigationAction,
): SignInInvestigationState {
  switch (action.type) {
    case 'loadFailed':
      return { ...state, error: action.error, loading: false };
    case 'loadStarted':
      return { ...state, error: undefined, loading: true };
    case 'loadSucceeded':
      return {
        ...state,
        events: action.mode === 'append' ? [...state.events, ...action.result.events] : action.result.events,
        hasLoaded: true,
        loading: false,
        nextLink: action.result.nextLink,
        selectedEventId:
          action.mode === 'append'
            ? state.selectedEventId ?? action.result.events[0]?.id
            : action.result.events[0]?.id,
      };
    case 'reset':
      return {
        ...state,
        error: undefined,
        events: [],
        hasLoaded: false,
        nextLink: undefined,
        selectedEventId: undefined,
      };
    case 'selectEvent':
      return { ...state, selectedEventId: action.eventId };
    case 'setCaFilter':
      return { ...state, caFilter: action.caFilter };
    case 'setIncludePolicyDetails':
      return { ...state, includePolicyDetails: action.includePolicyDetails };
    case 'setRangeDays':
      return { ...state, rangeDays: action.rangeDays };
    case 'setResultFilter':
      return { ...state, resultFilter: action.resultFilter };
    default:
      return state;
  }
}

function summarizeSignIns(events: SignInEvent[]): SignInSummary {
  return {
    total: events.length,
    failures: events.filter((event) => event.status.errorCode !== 0).length,
    caFailures: events.filter((event) => event.ca.state === 'failed').length,
    reportOnly: events.filter((event) => event.ca.state === 'reportOnly').length,
  };
}

export function signInErrorMessage(error: unknown): string {
  if (error instanceof GraphError && (error.status === 401 || error.status === 403)) {
    return 'Missing sign-in log access. Grant AuditLog.Read.All and use an account with Reports Reader or Security Reader. CA details also require Policy.Read.ConditionalAccess.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to load sign-in logs.';
}
