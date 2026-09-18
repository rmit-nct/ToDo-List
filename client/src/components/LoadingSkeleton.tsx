import './LoadingSkeleton.css';

export function SkeletonLine({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return <span aria-hidden="true" className={`skeleton-shape ${className}`} style={{ width }} />;
}

export function LoadingSkeleton({ variant = 'list', label = 'Loading content' }: { variant?: 'list' | 'board' | 'dashboard' | 'settings' | 'account' | 'boot'; label?: string }) {
  const cards = variant === 'board' ? 3 : variant === 'settings' ? 2 : variant === 'account' ? 1 : 4;
  return <div className={`loading-skeleton loading-skeleton--${variant}`} role="status" aria-label={label} aria-busy="true">
    <div aria-hidden="true">
      {(variant === 'boot' || variant === 'account') && <div className="skeleton-heading"><SkeletonLine width="55%" className="skeleton-title" /><SkeletonLine width="80%" /></div>}
      {variant === 'dashboard' && <div className="skeleton-metrics">{[0, 1, 2, 3].map(key => <div className="skeleton-panel" key={key}><SkeletonLine width="60%" /><SkeletonLine width="35%" className="skeleton-title" /></div>)}</div>}
      <div className="skeleton-content">{Array.from({ length: cards }, (_, key) => <div key={key} className="skeleton-panel">
        {variant === 'list' || variant === 'boot' ? <div className="skeleton-task-row"><SkeletonLine className="skeleton-avatar" width="32px" /><div><SkeletonLine width={key % 2 ? '55%' : '72%'} /><SkeletonLine width="38%" /></div><SkeletonLine width="64px" /></div> : <>
          <SkeletonLine width="45%" className="skeleton-title" />
          <SkeletonLine width="80%" />
          {(variant === 'settings' || variant === 'account') ? <><SkeletonLine className="skeleton-field" /><SkeletonLine width="65%" /><SkeletonLine className="skeleton-field" /><SkeletonLine width="40%" className="skeleton-field" /></> : <><SkeletonLine className="skeleton-card" /><SkeletonLine className="skeleton-card" /></>}
        </>}
      </div>)}</div>
    </div>
  </div>;
}
