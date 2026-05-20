import { cn } from '../../lib/utils';

export function Card({ children, className, hover = true }) {
  return (
    <div className={cn('card', hover && 'hover:shadow-lg hover:-translate-y-0.5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('px-6 py-4 border-b border-slate-100', className)}>{children}</div>;
}

export function CardBody({ children, className }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/50', className)}>{children}</div>;
}
