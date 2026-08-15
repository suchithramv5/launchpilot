/** The 8-stage Beauty/CPG readiness checklist template, with role-based owner defaults. */
export interface TemplateStage {
  name: string;
  owner: string;
  durationDays: number;
  blocks: boolean;
}

export const DEFAULT_CHECKLIST_TEMPLATE: TemplateStage[] = [
  { name: 'Formulation lock', owner: 'Priya', durationDays: 5, blocks: true },
  { name: 'Stability/compatibility testing', owner: 'Priya', durationDays: 10, blocks: true },
  { name: 'Regulatory compliance review', owner: 'Rohan', durationDays: 7, blocks: true },
  { name: 'Packaging tooling', owner: 'Ananya', durationDays: 8, blocks: true },
  { name: 'Manufacturing', owner: 'Ananya', durationDays: 6, blocks: true },
  { name: 'Quality control', owner: 'Ananya', durationDays: 3, blocks: true },
  { name: 'Marketing asset production', owner: 'Karan', durationDays: 5, blocks: false },
  { name: 'Listing live', owner: 'Priya', durationDays: 2, blocks: false },
];
