import { useState } from 'react';
import type { TeamGroup, TeamMember, TeamMemberFunction } from '@/types';
import { GROUP_LABELS } from '@/types';
import { parseRosterFile, rosterParseError, type ParsedRosterRow } from '@/lib/parseRosterFile';
import { PrimaryButton, SecondaryButton, Select, TextInput } from '@/components/ui';

const GROUP_OPTIONS: { value: TeamGroup; label: string }[] = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'team', label: 'Team member' },
  { value: 'external', label: 'External' },
];

const FUNCTION_OPTIONS: { value: TeamMemberFunction; label: string }[] = [
  { value: 'launch_lead', label: 'Launch lead' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'upstream_ops', label: 'Upstream ops' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'admin', label: 'Admin' },
  { value: 'external', label: 'External' },
];

export function RosterEditor({ team, onChange }: { team: TeamMember[]; onChange: (team: TeamMember[]) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<TeamGroup>('team');
  const [role, setRole] = useState<TeamMemberFunction>('marketing');
  const [permSummary, setPermSummary] = useState(true);
  const [permRetro, setPermRetro] = useState(false);

  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedRosterRow[] | null>(null);

  function nextId(): number {
    return (team.reduce((max, m) => Math.max(max, m.id), 0) || 0) + Date.now() % 100000 + 1;
  }

  function addPerson() {
    const trimmedEmail = email.trim();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) return;
    const member: TeamMember = { id: nextId(), name: name.trim(), email: trimmedEmail, title: title.trim(), group, role, permSummary, permRetro };
    onChange([...team, member]);
    setName('');
    setEmail('');
    setTitle('');
    setPermSummary(true);
    setPermRetro(false);
  }

  function updateMember(id: number, patch: Partial<TeamMember>) {
    onChange(team.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMember(id: number) {
    onChange(team.filter((m) => m.id !== id));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError('');
    setParsed(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const rows = parseRosterFile(text);
      const err = rosterParseError(text, rows);
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      setParsed(rows);
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Could not read that file.');
    };
    reader.readAsText(file);
  }

  function useParsedRows() {
    if (!parsed) return;
    let idCounter = (team.reduce((max, m) => Math.max(max, m.id), 0) || 0) + 1;
    const newMembers: TeamMember[] = parsed.map((row) => ({
      id: idCounter++,
      name: row.name,
      email: row.email,
      title: '',
      group: row.role === 'external' ? 'external' : 'team',
      role: row.role,
      permSummary: true,
      permRetro: false,
    }));
    onChange([...team, ...newMembers]);
    setParsed(null);
    setFileName('');
  }

  function discardParsed() {
    setParsed(null);
    setFileName('');
    setError('');
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="flex-[1.2]" />
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@brand.com" className="flex-[1.4]" />
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="flex-[1.2]" />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={group} onChange={(e) => setGroup(e.target.value as TeamGroup)} className="flex-1">
          {GROUP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value as TeamMemberFunction)} className="flex-1">
          {FUNCTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <PrimaryButton onClick={addPerson} className="whitespace-nowrap">
          Add
        </PrimaryButton>
      </div>
      <div className="mb-5 flex items-center gap-4.5">
        <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-secondary">
          <input type="checkbox" checked={permSummary} onChange={(e) => setPermSummary(e.target.checked)} />
          Can view launch summary
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-secondary">
          <input type="checkbox" checked={permRetro} onChange={(e) => setPermRetro(e.target.checked)} />
          Can view retrospective
        </label>
      </div>

      <div className="mb-5 rounded-card border border-border-input bg-page p-4">
        <div className="mb-1 text-[12.5px] font-bold">Upload a team roster</div>
        <div className="mb-2.5 text-[11.5px] text-ink-muted">A file with a Name:/Email:/Role: block per person — reads and builds the list below.</div>
        <input type="file" accept=".txt,.md,text/plain" onChange={handleFile} className="text-[12.5px]" />
        {loading && <div className="mt-2 text-[12.5px] text-ink-muted">Reading &quot;{fileName}&quot;…</div>}
        {error && <div className="mt-2 text-[12.5px] text-status-blocked-text">{error}</div>}
        {parsed && (
          <>
            <div className="mt-3 overflow-hidden rounded-control border border-border bg-white">
              {parsed.map((row, i) => (
                <div key={i} className="flex items-center gap-2 border-b border-border-divider px-3 py-2.5 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{row.name}</div>
                    <div className="text-[11.5px] text-ink-muted">
                      {row.email}
                      {row.reassignedFrom && <span> · reassigned from &quot;{row.reassignedFrom}&quot; (not in scope) to Marketing</span>}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-ink-tertiary">{FUNCTION_OPTIONS.find((f) => f.value === row.role)?.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex gap-2">
              <PrimaryButton onClick={useParsedRows} className="px-3.5 py-2 text-[12.5px]">
                Add this roster
              </PrimaryButton>
              <SecondaryButton onClick={discardParsed} className="px-3.5 py-2 text-[12.5px]">
                Discard
              </SecondaryButton>
            </div>
          </>
        )}
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Everyone on this launch</div>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {team.map((m) => (
          <div key={m.id} className="border-b border-border-divider px-4 py-3 last:border-b-0">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13.5px] font-semibold">{m.name}</div>
                  <div className="rounded-full bg-[#f3f1ec] px-2 py-0.5 text-[10.5px] font-bold text-ink-tertiary">{GROUP_LABELS[m.group]}</div>
                </div>
                <div className="text-[11.5px] text-ink-muted">
                  {m.email}
                  {m.title && <span> · {m.title}</span>}
                </div>
              </div>
              <Select value={m.group} onChange={(e) => updateMember(m.id, { group: e.target.value as TeamGroup })} className="w-[130px] py-1.5 text-[12.5px]">
                {GROUP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Select value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value as TeamMemberFunction })} className="w-[150px] py-1.5">
                {FUNCTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <div onClick={() => removeMember(m.id)} className="cursor-pointer text-[15px] text-ink-faint">
                ✕
              </div>
            </div>
            <div className="flex gap-4.5 pl-0.5">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-secondary">
                <input type="checkbox" checked={m.permSummary} onChange={(e) => updateMember(m.id, { permSummary: e.target.checked })} />
                Can view launch summary
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-secondary">
                <input type="checkbox" checked={m.permRetro} onChange={(e) => updateMember(m.id, { permRetro: e.target.checked })} />
                Can view retrospective
              </label>
            </div>
          </div>
        ))}
        {team.length === 0 && <div className="px-4 py-4 text-[13px] text-ink-muted">No one added yet.</div>}
      </div>
    </div>
  );
}
