import type { Project } from '@/types/hierarchy.types';

interface SocialButtonsProps {
  project: Project;
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1.4px solid rgba(255, 255, 255, 0.18)',
};

/* Same clamp range as GlassArrows so bottom bar stays aligned */
const btnClass =
  'flex items-center justify-center size-[clamp(36px,3.5vw,44px)] rounded-full outline-none transition-opacity hover:opacity-80';
const iconClass = 'size-[clamp(18px,1.6vw,24px)]';

export function SocialButtons({ project }: SocialButtonsProps) {
  if (!project.whatsapp && !project.instagram && !project.website) return null;

  return (
    <div className="absolute bottom-[clamp(16px,3vh,31px)] right-[clamp(20px,2.5vw,35px)] z-40 hidden lg:flex items-center gap-[clamp(12px,1.2vw,18px)]">
      {project.whatsapp && (
        <a
          href={`https://wa.me/${project.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          style={btnStyle}
          aria-label="WhatsApp"
        >
          <svg className={iconClass} viewBox="0 0 24 24" fill="none">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.11-1.14l-.29-.174-3.01.79.8-2.93-.19-.3A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="white"/>
          </svg>
        </a>
      )}
      {project.instagram && (
        <a
          href={project.instagram.startsWith('http') ? project.instagram : `https://instagram.com/${project.instagram.replace(/^@/, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          style={btnStyle}
          aria-label="Instagram"
        >
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
          </svg>
        </a>
      )}
      {project.website && (
        <a
          href={project.website.startsWith('http') ? project.website : `https://${project.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          style={btnStyle}
          aria-label="Sitio web"
        >
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </a>
      )}
    </div>
  );
}
