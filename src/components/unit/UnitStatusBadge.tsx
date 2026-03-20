import type { EntityStatus } from '@/types/hierarchy.types';
import { STATUS_LABELS } from '@/lib/constants/status';

const DOT_COLORS: Record<EntityStatus, string> = {
  available: 'rgba(17, 187, 93, 0.73)',
  reserved: 'rgba(224, 124, 17, 0.73)',
  sold: '#D6254C',
  not_available: '#9ca3af',
};

const TEXT_COLORS: Record<EntityStatus, string> = {
  available: '#535E58',
  reserved: '#7D5A1A',
  sold: '#8B1A2B',
  not_available: '#6B7280',
};

interface UnitStatusBadgeProps {
  status: EntityStatus;
}

export function UnitStatusBadge({ status }: UnitStatusBadgeProps) {
  return (
    <div className="flex items-center gap-[6px]">
      <span
        className="w-[10px] h-[10px] rounded-[69px] flex-shrink-0"
        style={{ background: DOT_COLORS[status] }}
      />
      <span
        className="text-[14px] font-medium leading-[21px] capitalize"
        style={{ color: TEXT_COLORS[status], fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
}
