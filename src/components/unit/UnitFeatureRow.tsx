import type { LucideIcon } from 'lucide-react';

interface UnitFeatureRowProps {
  icon: LucideIcon | string;
  text: string;
}

export function UnitFeatureRow({ icon, text }: UnitFeatureRowProps) {
  return (
    <div className="flex items-center gap-[8px]">
      {typeof icon === 'string' ? (
        <img
          src={icon}
          alt=""
          className="w-[20px] h-[20px] shrink-0 object-contain"
        />
      ) : (
        (() => {
          const Icon = icon;
          return <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: '#5A5A5A', strokeWidth: 1.5 }} />;
        })()
      )}
      <span
        className="text-[14px] font-normal leading-[21px] capitalize"
        style={{ color: '#7D7D7D', fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {text}
      </span>
    </div>
  );
}
