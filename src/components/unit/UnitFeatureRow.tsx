import type { LucideIcon } from 'lucide-react';

interface UnitFeatureRowProps {
  icon: LucideIcon;
  text: string;
}

export function UnitFeatureRow({ icon: Icon, text }: UnitFeatureRowProps) {
  return (
    <div className="flex items-center gap-[8px]">
      <Icon className="w-[20px] h-[20px] flex-shrink-0" style={{ color: '#5A5A5A', strokeWidth: 1.5 }} />
      <span
        className="text-[14px] font-normal leading-[21px] capitalize"
        style={{ color: '#7D7D7D', fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {text}
      </span>
    </div>
  );
}
