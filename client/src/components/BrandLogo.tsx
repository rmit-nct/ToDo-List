import darkLogo from '../assets/brand/nct-logo-dark.png';
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
      <img className="neo-logo__image neo-logo__image--light" src={compact ? lightMark : tone === 'on-light' ? lightSurfaceLogo : lightLogo} alt="" />
      <img className="neo-logo__image neo-logo__image--dark" src={compact ? darkMark : darkLogo} alt="" />
    </span>
  );
}
