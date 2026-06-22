import {
  AppWindow,
  Cloud,
  FileCheck2,
  Filter,
  Monitor,
  Network,
  ShieldCheck,
  Smartphone,
  Tag,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { TenantNodeType } from '../../models/tenantGraph';
import { graphZoneDefinitions, nodeColors, tenantTypePresentation } from '../../utils/typePresentation';

type GraphOverlaysProps = {
  leftStackTop?: ReactNode;
};

const legendItems = [
  { label: 'Windows', color: '#3fd1ff', icon: Monitor },
  { label: 'iOS', color: '#38bdf8', icon: Smartphone },
  legendItem('user', Users),
  legendItem('directoryRole', ShieldCheck, 'Roles'),
  legendItem('app', AppWindow),
  legendItem('cloudApp', Cloud),
  { label: graphZoneDefinitions.policies.label, color: graphZoneDefinitions.policies.color, icon: FileCheck2 },
  legendItem('assignmentFilter', Filter, 'Filters'),
  legendItem('scopeTag', Tag),
  legendItem('group', Network),
];

function legendItem(type: TenantNodeType, icon: typeof Users, label = tenantTypePresentation[type].label) {
  return { label, color: nodeColors[type], icon };
}

export function GraphOverlays({ leftStackTop }: GraphOverlaysProps) {
  return (
    <div className="graph-left-stack">
      {leftStackTop}
      <GraphLegend />
    </div>
  );
}

function GraphLegend() {
  return (
    <div className="graph-legend" aria-label="Graph legend">
      {legendItems.map(({ label, color, icon: Icon }) => (
        <span key={label}>
          <Icon size={14} style={{ color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
