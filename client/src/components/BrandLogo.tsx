import darkLogo from '../assets/brand/nct-logo-dark.png';
import './BrandLogo.css';
import lightLogo from '../assets/brand/nct-logo-light.png';
import lightSurfaceLogo from '../assets/brand/nct-logo-light-surface.png';
import darkMark from '../assets/brand/nct-mark-dark.png';
import lightMark from '../assets/brand/nct-mark-light.png';

type BrandLogoProps = {
  compact?: boolean;
  tone?: 'on-dark' | 'on-light';
  className?: string;
};

export function BrandLogo({ compact = false, tone = 'on-dark', className = '' }: BrandLogoProps) {
  const classes = `neo-logo neo-logo--${tone}${compact ? ' neo-logo--compact' : ''}${className ? ` ${className}` : ''}`;

  return (
    <span className={classes} aria-label="Neo Culture Tech">
      {compact ? <>
        <img className="neo-logo__image neo-logo__image--light" src={lightMark} alt="" />
        <img className="neo-logo__image neo-logo__image--dark" src={darkMark} alt="" />
      </> : <>
        <span className="neo-logo__image neo-logo__image--light neo-logo__lockup" aria-hidden="true">
          <svg className="neo-logo__symbol" viewBox="0 3 112 98"><image href={tone === 'on-light' ? lightSurfaceLogo : lightLogo} width="480" height="104" /></svg>
          <svg className="neo-logo__wordmark" viewBox="139 40 333 42"><image href={tone === 'on-light' ? lightSurfaceLogo : lightLogo} width="480" height="104" /></svg>
        </span>
        <span className="neo-logo__image neo-logo__image--dark neo-logo__lockup" aria-hidden="true">
          <svg className="neo-logo__symbol" viewBox="0 3 112 98"><image href={darkLogo} width="500" height="104" /></svg>
          <svg className="neo-logo__wordmark" viewBox="149 38 343 44"><image href={darkLogo} width="500" height="104" /></svg>
        </span>
      </>}
    </span>
  );
}
