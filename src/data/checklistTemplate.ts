/** The 8-stage Beauty/CPG readiness checklist template. Every task defaults to
 * whoever is creating the launch — real per-task owners get assigned afterward
 * once the roster has real teammates on it. */
export interface TemplateStage {
  name: string;
  durationDays: number;
  blocks: boolean;
}

export const DEFAULT_CHECKLIST_TEMPLATE: TemplateStage[] = [
  { name: 'Formulation lock', durationDays: 5, blocks: true },
  { name: 'Stability/compatibility testing', durationDays: 10, blocks: true },
  { name: 'Regulatory compliance review', durationDays: 7, blocks: true },
  { name: 'Packaging tooling', durationDays: 8, blocks: true },
  { name: 'Manufacturing', durationDays: 6, blocks: true },
  { name: 'Quality control', durationDays: 3, blocks: true },
  { name: 'Marketing asset production', durationDays: 5, blocks: false },
  { name: 'Listing live', durationDays: 2, blocks: false },
];
