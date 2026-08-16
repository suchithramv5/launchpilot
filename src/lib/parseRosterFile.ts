import type { TeamMemberFunction } from '@/types';

export interface ParsedRosterRow {
  name: string;
  email: string;
  role: TeamMemberFunction;
  reassignedFrom: string | null;
}

const ROLE_MATCHERS: { re: RegExp; role: TeamMemberFunction }[] = [
  { re: /launch\s*lead|npd\s*manager/i, role: 'launch_lead' },
  { re: /complian/i, role: 'compliance' },
  { re: /upstream|ops|manufactur|packaging/i, role: 'upstream_ops' },
  { re: /market/i, role: 'marketing' },
  { re: /admin/i, role: 'admin' },
  { re: /external|vendor/i, role: 'external' },
];

/** Roles this build doesn't support as real login roles — mapped to the closest in-scope fallback. */
const OUT_OF_SCOPE_RE = /legal/i;

function mapRole(raw: string): { role: TeamMemberFunction; reassignedFrom: string | null } {
  const trimmed = raw.trim();
  if (OUT_OF_SCOPE_RE.test(trimmed)) {
    return { role: 'marketing', reassignedFrom: trimmed };
  }
  for (const { re, role } of ROLE_MATCHERS) {
    if (re.test(trimmed)) return { role, reassignedFrom: null };
  }
  return { role: 'marketing', reassignedFrom: trimmed || null };
}

/**
 * Deterministic (non-AI) parser for the team-roster upload format
 * documented in sample-team-roster.txt:
 *   Name: Full Name
 *   Email: person@brand.com
 *   Role: Some Role Label
 * blocks separated by blank lines.
 */
export function parseRosterFile(text: string): ParsedRosterRow[] {
  const blocks = text.split(/\r?\n\s*\r?\n/);
  const rows: ParsedRosterRow[] = [];

  for (const block of blocks) {
    const nameMatch = /^\s*Name:\s*(.+)$/im.exec(block);
    const emailMatch = /^\s*Email:\s*(.+)$/im.exec(block);
    const roleMatch = /^\s*Role:\s*(.+)$/im.exec(block);
    if (!nameMatch || !emailMatch) continue;
    const { role, reassignedFrom } = mapRole(roleMatch?.[1] ?? '');
    rows.push({
      name: nameMatch[1].trim(),
      email: emailMatch[1].trim().toLowerCase(),
      role,
      reassignedFrom,
    });
  }

  return rows;
}

export function rosterParseError(text: string, parsed: ParsedRosterRow[]): string | null {
  if (!text.trim()) return 'That file looks empty.';
  if (parsed.length === 0) {
    return 'Could not find any roster entries (expected blocks with "Name:", "Email:", and "Role:" lines).';
  }
  return null;
}
