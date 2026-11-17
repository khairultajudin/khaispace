'use client';

import React, { useState } from 'react';
import { Building2, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';

export function WorkspaceOnboarding() {
  const { createWorkspace, acceptInvite } = useWorkspace();
  const [mode, setMode] = useState<'create' | 'invite'>('create');
  const [wsName, setWsName] = useState('Khai Space Hub');
  const [wsDesc, setWsDesc] = useState('Personal Business & Engineering Command Center');
  const [inviteToken, setInviteToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) {
      setError('Workspace name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkspace({ name: wsName.trim(), description: wsDesc.trim() });
      setSuccess('Workspace created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setError('Invitation token is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await acceptInvite(inviteToken.trim());
      setSuccess('Invitation accepted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 rounded-xl border border-[#DCD7CC] bg-white shadow-xs space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E9E5DC]/70 text-[#0C2340] text-xs font-medium">
          <Building2 className="w-3.5 h-3.5 text-[#347A63]" />
          Workspace Setup Required
        </div>
        <h2 className="text-xl font-semibold text-[#0C2340]">
          Initialize or Join a Workspace
        </h2>
        <p className="text-sm text-[#536B85]">
          Your account is authenticated, but you do not belong to an active workspace yet. Create your primary workspace or accept an invitation token.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#E9E5DC] pb-3">
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setError(null);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'create'
              ? 'bg-[#0C2340] text-white'
              : 'bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340]'
          }`}
        >
          Create Workspace
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('invite');
            setError(null);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'invite'
              ? 'bg-[#0C2340] text-white'
              : 'bg-[#FAF8F4] text-[#536B85] hover:text-[#0C2340]'
          }`}
        >
          Accept Invitation
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {mode === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#0C2340] mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              maxLength={100}
              required
              className="w-full px-3 py-2 text-sm rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0C2340] mb-1">
              Description
            </label>
            <textarea
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/20"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0C2340] text-white text-sm font-medium hover:bg-[#133258] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {isSubmitting ? 'Creating Workspace...' : 'Create Workspace as Owner'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#0C2340] mb-1">
              Invitation Token
            </label>
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Paste your invitation token"
              required
              className="w-full px-3 py-2 text-sm font-mono rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/20"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] text-white text-sm font-medium hover:bg-[#2a6350] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {isSubmitting ? 'Verifying Token...' : 'Accept Workspace Invitation'}
          </button>
        </form>
      )}
    </div>
  );
}

