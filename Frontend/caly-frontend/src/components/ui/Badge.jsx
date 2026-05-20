import { cn } from '../../lib/utils';

const statusClasses = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
  no_show: 'badge-no_show',
  paid: 'badge-confirmed',
  unpaid: 'badge-pending',
  refunded: 'badge-cancelled',
};

export default function Badge({ status, children, className }) {
  return (
    <span className={cn('badge', statusClasses[status] || 'bg-slate-100 text-slate-600', className)}>
      {children || status}
    </span>
  );
}
