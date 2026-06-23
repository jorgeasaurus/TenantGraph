export type SampleGuideStep = {
  body: string;
  id: string;
  scrollBlock?: ScrollLogicalPosition;
  target?: string;
  title: string;
};

export const sampleGuideSteps = [
  {
    id: 'orientation',
    scrollBlock: 'center',
    target: '[data-guide="graph-canvas"]',
    title: 'Start with the topology',
    body: 'The canvas is the relationship map. Drag to rotate, scroll to zoom, and click nodes or clusters to focus the view.',
  },
  {
    id: 'search',
    scrollBlock: 'center',
    target: '[data-guide="toolbar-search"]',
    title: 'Search sample tenant objects',
    body: 'Try Company Portal, SAP Concur, Miguel, Windows, Finance, or Block legacy auth. Search results use the same flow as Microsoft Graph.',
  },
  {
    id: 'filters',
    scrollBlock: 'center',
    target: '[data-guide="object-types"]',
    title: 'Filter by object family',
    body: 'Use object-type filters to explain the tenant in layers: people, devices, groups, apps, policies, privileged access, and guardrails.',
  },
  {
    id: 'relationships',
    scrollBlock: 'center',
    target: '[data-guide="relationships"]',
    title: 'Control relationship noise',
    body: 'Turn relationship types on and off to isolate assignments, group membership, sign-ins, Conditional Access decisions, filters, and scope tags.',
  },
  {
    id: 'details',
    scrollBlock: 'center',
    target: '[data-guide="details"]',
    title: 'Expand the selected object',
    body: 'The selection panel explains the object in plain language. Use Expand to progressively load nearby relationships without flooding the graph.',
  },
  {
    id: 'path',
    scrollBlock: 'center',
    target: '[data-guide="path-finder"]',
    title: 'Explain why something applies',
    body: 'After expanding a user, device, app, or policy, the path finder turns graph relationships into a step-by-step explanation.',
  },
  {
    id: 'signins',
    scrollBlock: 'center',
    target: '[data-guide="signins"]',
    title: 'Investigate Conditional Access',
    body: 'Load sign-in logs from the inspector, filter by applied or blocked policies, then project an event onto the graph.',
  },
  {
    id: 'return',
    scrollBlock: 'center',
    target: '[data-guide="guide-button"]',
    title: 'Reopen this guide anytime',
    body: 'The sample tenant is local example data. Exit sample mode from the account menu when you are ready to sign in to a real tenant.',
  },
] as const satisfies readonly SampleGuideStep[];
