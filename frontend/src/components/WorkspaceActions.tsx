import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Moon, Plus, Share2, Sun } from 'lucide-react';
import { useTheme } from '../themeContext';
import './WorkspaceActions.css';

export function WorkspaceActions({ onCreate, createDisabled = false }: { onCreate: () => void; createDisabled?: boolean }) {
  const { workspaceId } = useParams();
  const { dark, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/workspace/${workspaceId}`);
      setCopied(true);
      setError('');
    } catch {
      setError('Could not copy the link. Please try again.');
    }
  }
  return <div className="workspace-actions-wrap">
    <div className="workspace-actions" aria-label="Workspace actions">
      <button type="button" onClick={share} disabled={!workspaceId} aria-label={copied ? 'Link copied' : 'Share workspace'} title={copied ? 'Link copied' : 'Copy workspace invite link'}>
        {copied ? <Check /> : <Share2 />}<span>{copied ? 'Copied' : 'Share'}</span>
      </button>
      <button type="button" onClick={toggleTheme} aria-label={dark ? 'Light' : 'Dark'} title={`Switch to ${dark ? 'light' : 'dark'} theme`}>
        {dark ? <Sun /> : <Moon />}<span>{dark ? 'Light' : 'Dark'}</span>
      </button>
      <button type="button" className="primary" onClick={onCreate} disabled={createDisabled}><Plus />New task</button>
    </div>
    {error && <p role="alert" className="workspace-actions-error">{error}</p>}
    <span className="sr-only" role="status">{copied ? 'Workspace link copied' : ''}</span>
  </div>;
}
