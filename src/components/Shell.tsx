import { useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { canAccessAdmin, isLaunchOwnerUser } from '@/lib/permissions';
import { Avatar } from './Avatar';
import { ROLE_LABELS } from '@/types';

export function Shell() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [open, setOpen] = useState(false);

  if (!currentUser) return <Outlet />;

  const launchId = params.id;

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <div className="relative z-20 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-white px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-control bg-accent text-sm font-bold text-white">L</div>
          <div className="text-[16px] font-bold tracking-tight">LaunchPilot</div>
          <div className="ml-0.5 border-l border-border pl-2.5 text-xs text-ink-muted">beauty &amp; personal care</div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/launches/all" className="rounded-control px-2.5 py-1.5 text-[13px] font-semibold text-ink-secondary no-underline hover:bg-[#f3f1ec]">
            All launches
          </Link>
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-control px-2.5 py-1.5 hover:bg-[#f3f1ec]">
              <Avatar initial={currentUser.initial} size={30} accent={currentUser.role === 'launch_lead'} />
              <div className="text-left">
                <div className="text-[13px] font-semibold">{currentUser.name}</div>
                <div className="text-[11px] text-ink-muted">{ROLE_LABELS[currentUser.role]}</div>
              </div>
              <div className="ml-0.5 text-[10px] text-ink-faint">▾</div>
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-[46px] z-50 w-[280px] rounded-card border border-border bg-white p-2 shadow-modal">
                  <MenuItem
                    icon="◎"
                    label="All launches"
                    sub="every product, shared view"
                    onClick={() => {
                      setOpen(false);
                      navigate('/launches/all');
                    }}
                  />
                  {isLaunchOwnerUser(currentUser) && (
                    <MenuItem
                      icon="▤"
                      label="My launches"
                      sub="switch between your products"
                      onClick={() => {
                        setOpen(false);
                        navigate('/launches');
                      }}
                    />
                  )}
                  {launchId && (
                    <MenuItem
                      icon="↻"
                      label="View retrospective"
                      sub="jump straight to the launch retro"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/launches/${launchId}/retro`);
                      }}
                    />
                  )}
                  {canAccessAdmin(currentUser) && (
                    <MenuItem
                      icon="⚙"
                      label="Manage user roles"
                      sub="admin settings"
                      onClick={() => {
                        setOpen(false);
                        navigate('/admin/users');
                      }}
                    />
                  )}
                  <MenuItem
                    icon="⏻"
                    label="Log out"
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate('/login');
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick }: { icon: string; label: string; sub?: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer items-center gap-2.5 rounded-control p-2 hover:bg-[#f3f1ec]">
      <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-control bg-[#f3f1ec] text-[13px] text-ink-tertiary">{icon}</div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold">{label}</div>
        {sub && <div className="text-[11px] text-ink-muted">{sub}</div>}
      </div>
    </div>
  );
}
