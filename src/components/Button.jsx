import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  outline: 'btn btn--outline',
  danger: 'btn btn--danger',
  ghost: 'btn btn--ghost',
};

const sizes = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        variants[variant],
        sizes[size],
        className,
        disabled || loading ? 'is-disabled' : '',
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && <Loader2 size={16} className="btn__loader is-spinning" />}
      {children}
    </button>
  );
}
