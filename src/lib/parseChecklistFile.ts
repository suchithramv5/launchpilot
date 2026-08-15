import { OWNERS } from '@/types';

export interface ParsedSubtask {
  name: string;
  durationDays: number | null;
  assignee: string;
}

export interface ParsedTask {
  name: string;
  durationDays: number | null;
  owner: string;
  subtasks: ParsedSubtask[];
}

/**
 * Best-effort owner assignment by keyword, ported from the prototype's
 * `bestFallbackOwner` heuristic and narrowed to this build's 4 fixed
 * task-owner names (no legal/external roles in scope).
 */
export function bestFallbackOwner(taskName: string): string {
  const t = taskName.toLowerCase();
  if (/complian|regulat|fda|legal/.test(t)) return 'Rohan';
  if (/packag|manufactur|upstream|vendor|tooling|quality/.test(t)) return 'Ananya';
  if (/market|social|influencer|campaign|creative|listing|retail/.test(t)) return 'Karan';
  return 'Priya';
}

const TOP_LEVEL_RE = /^(\d+)\.\s+(.+?)(?:\s+[—–-]\s*(\d+)\s*days?)?\s*$/;
const SUB_ITEM_RE = /^\s*-\s+(.+?)(?:\s+[—–-]\s*(\d+)\s*days?)?\s*$/;

/**
 * Deterministic (non-AI) parser for the launch-checklist upload formats
 * documented in sample-launch-checklist.txt / sample-launch-checklist-with-timelines.txt:
 *   N. Task name[ — X days]
 *      - Sub-item[ — X days]
 * Prose lines between items are ignored for structure.
 */
export function parseChecklistFile(text: string): ParsedTask[] {
  const lines = text.split(/\r?\n/);
  const tasks: ParsedTask[] = [];
  let current: ParsedTask | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '    ');
    if (!line.trim()) continue;

    const topMatch = TOP_LEVEL_RE.exec(line.trim());
    const isIndented = /^\s{2,}/.test(line) || /^\s*-\s+/.test(line.trim());

    if (topMatch && !isIndented) {
      const name = topMatch[2].trim();
      current = {
        name,
        durationDays: topMatch[3] ? parseInt(topMatch[3], 10) : null,
        owner: bestFallbackOwner(name),
        subtasks: [],
      };
      tasks.push(current);
      continue;
    }

    const subMatch = SUB_ITEM_RE.exec(line.trim());
    if (subMatch && current) {
      const name = subMatch[1].trim();
      current.subtasks.push({
        name,
        durationDays: subMatch[2] ? parseInt(subMatch[2], 10) : null,
        assignee: bestFallbackOwner(name),
      });
    }
    // other prose lines are ignored — they don't define structure
  }

  return tasks;
}

export function checklistParseError(text: string, parsed: ParsedTask[]): string | null {
  if (!text.trim()) return 'That file looks empty.';
  if (parsed.length === 0) {
    return 'Could not find any numbered checklist items (expected lines like "1. Task name" or "1. Task name — 5 days").';
  }
  return null;
}

export const CHECKLIST_OWNER_CHOICES = OWNERS;
