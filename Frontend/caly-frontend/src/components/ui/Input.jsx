import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  label, error, icon: Icon, className, ...props
}, ref) => (
  <div className={cn('space-y-1.5', className)}>
    {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'input-field',
          Icon && 'pl-10',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
          props.className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
