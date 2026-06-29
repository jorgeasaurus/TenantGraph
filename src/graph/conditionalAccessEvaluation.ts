import type { AppliedConditionalAccessPolicy, ConditionalAccessEvaluation } from '../models/signInLog';

export function classifyConditionalAccess(
  conditionalAccessStatus: string | undefined,
  policies: AppliedConditionalAccessPolicy[] | undefined,
): ConditionalAccessEvaluation {
  const normalizedStatus = conditionalAccessStatus?.toLowerCase();

  if (!policies) {
    if (normalizedStatus === 'notapplied') {
      return {
        ...caEvaluation('notApplied', [], 'Not applied', 'No Conditional Access policy applied to this sign-in.'),
        missingDetails: true,
      };
    }

    if (normalizedStatus === 'failure') {
      return {
        ...caEvaluation(
          'failed',
          [],
          'CA blocked or interrupted',
          'Conditional Access reported failure for this sign-in, but policy names were omitted.',
        ),
        missingDetails: true,
      };
    }

    if (normalizedStatus?.startsWith('reportonly')) {
      return {
        ...caEvaluation(
          'reportOnly',
          [],
          'Report-only impact',
          'A report-only Conditional Access policy evaluated this sign-in, but policy names were omitted.',
        ),
        missingDetails: true,
      };
    }

    if (normalizedStatus === 'success') {
      return {
        ...caEvaluation(
          'applied',
          [],
          'CA applied',
          'Conditional Access applied, but policy names were omitted.',
        ),
        missingDetails: true,
      };
    }

    return {
      ...caEvaluation(
        'missingDetails',
        [],
        'Missing CA details',
        'Sign-in logs loaded, but Microsoft Graph omitted policy details for this caller.',
      ),
      missingDetails: true,
    };
  }

  const blockingPolicies = policies.filter((policy) => policy.result.toLowerCase() === 'failure');
  const reportOnlyPolicies = policies.filter((policy) => policy.result.toLowerCase().startsWith('reportonly'));
  const notAppliedPolicies = policies.filter((policy) =>
    ['notapplied', 'notenabled', 'reportonlynotapplied'].includes(policy.result.toLowerCase()),
  );
  const appliedPolicies = policies.filter((policy) => policy.result.toLowerCase() === 'success');

  if (normalizedStatus === 'failure' || blockingPolicies.length > 0) {
    return {
      ...caEvaluation(
        'failed',
        policies,
        'CA blocked or interrupted',
        blockingPolicies.length > 0
          ? `${blockingPolicies.length} Conditional Access policy result needs attention.`
          : 'Conditional Access reported failure for this sign-in.',
      ),
      appliedPolicies,
      blockingPolicies,
      notAppliedPolicies,
      reportOnlyPolicies,
    };
  }

  if (normalizedStatus?.startsWith('reportonly') || reportOnlyPolicies.length > 0) {
    return {
      ...caEvaluation(
        'reportOnly',
        policies,
        'Report-only impact',
        `${reportOnlyPolicies.length} report-only policy evaluated this sign-in.`,
      ),
      appliedPolicies,
      blockingPolicies,
      notAppliedPolicies,
      reportOnlyPolicies,
    };
  }

  if (normalizedStatus === 'notapplied' || (policies.length > 0 && notAppliedPolicies.length === policies.length)) {
    return {
      ...caEvaluation(
        'notApplied',
        policies,
        'CA not applied',
        policies.length > 0
          ? 'Policies were evaluated but their conditions were not met or enabled.'
          : 'No Conditional Access policy applied to this sign-in.',
      ),
      appliedPolicies,
      blockingPolicies,
      notAppliedPolicies,
      reportOnlyPolicies,
    };
  }

  if (normalizedStatus === 'success' || appliedPolicies.length > 0) {
    return {
      ...caEvaluation(
        'applied',
        policies,
        'CA applied',
        appliedPolicies.length > 0
          ? `${appliedPolicies.length} Conditional Access policy result applied.`
          : 'Conditional Access status reported success for this sign-in.',
      ),
      appliedPolicies,
      blockingPolicies,
      notAppliedPolicies,
      reportOnlyPolicies,
    };
  }

  return {
    ...caEvaluation('unknown', policies, 'CA unknown', 'Conditional Access returned an unknown evaluation state.'),
    appliedPolicies,
    blockingPolicies,
    notAppliedPolicies,
    reportOnlyPolicies,
  };
}

function caEvaluation(
  state: ConditionalAccessEvaluation['state'],
  policies: AppliedConditionalAccessPolicy[],
  label: string,
  summary: string,
): ConditionalAccessEvaluation {
  const tone: Record<ConditionalAccessEvaluation['state'], ConditionalAccessEvaluation['tone']> = {
    applied: 'success',
    failed: 'danger',
    missingDetails: 'warning',
    notApplied: 'muted',
    reportOnly: 'info',
    unknown: 'warning',
  };

  return {
    appliedPolicies: [],
    blockingPolicies: [],
    label,
    missingDetails: false,
    notAppliedPolicies: [],
    policies,
    reportOnlyPolicies: [],
    state,
    summary,
    tone: tone[state],
  };
}
