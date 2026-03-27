import { useState } from 'react';
import { X, MessageCircle, Phone, Mail, Globe } from 'lucide-react';
import type { Project, Media } from '@/types/hierarchy.types';

interface ContactModalProps {
  project: Project;
  logos: Media[];
  open: boolean;
  onClose: () => void;
}

const modalGlass: React.CSSProperties = {
  background: 'rgba(214, 214, 214, 0.45)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1.4px solid rgba(255, 255, 255, 0.4)',
};

const itemGlass: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow: 'inset 0px 0px 16px rgba(255, 255, 255, 0.05), inset 0px 4px 4px rgba(255, 255, 255, 0.15)',
};

const iconGlass: React.CSSProperties = {
  background: 'rgba(128, 128, 128, 0.23)',
  backgroundBlendMode: 'luminosity',
  backdropFilter: 'blur(50px)',
  WebkitBackdropFilter: 'blur(50px)',
  border: '1.4px solid rgba(255, 255, 255, 0.18)',
};

const poppins = "'Poppins', system-ui, sans-serif";

export function ContactModal({ project, logos, open, onClose }: ContactModalProps) {
  const accentColor = project.accentColor || '#1A1A1A';
  const accentIconStyle: React.CSSProperties = {
    background: accentColor,
    border: '1.4px solid rgba(255, 255, 255, 0.18)',
  };
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!open) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const phones = project.phone?.split(' / ') ?? [];
  const whatsappClean = project.whatsapp?.replace(/\D/g, '') ?? '';

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, me interesa obtener información sobre ${project.name}.`
    );
    window.open(`https://wa.me/${whatsappClean}?text=${message}`, '_blank');
  };

  const developerLogo = logos.find(l => l.purpose === 'logo_developer') ?? logos[0];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[clamp(300px,30vw,400px)] rounded-[28px] overflow-hidden p-[clamp(16px,2vw,24px)] max-h-[90vh] overflow-y-auto"
        style={modalGlass}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-[clamp(12px,1.5vw,18px)] right-[clamp(12px,1.5vw,18px)] size-[clamp(32px,3vw,40px)] flex items-center justify-center rounded-full transition-colors outline-none text-white/80 hover:text-white"
          style={iconGlass}
          aria-label="Cerrar"
        >
          <X className="size-[clamp(14px,1.2vw,18px)]" />
        </button>

        {/* Logo */}
        {developerLogo && (
          <div className="text-center mb-[clamp(16px,2vw,24px)]">
            <img
              src={developerLogo.url!}
              alt=""
              className="h-[clamp(40px,5vw,64px)] mx-auto"
            />
            {project.name && (
              <p
                className="mt-[6px] text-[clamp(11px,1vw,14px)] font-medium text-white/80 tracking-wide"
                style={{ fontFamily: poppins }}
              >
                {project.name}
              </p>
            )}
          </div>
        )}

        {/* Contact items */}
        <div className="flex flex-col gap-[clamp(8px,1vw,12px)]">
          {project.whatsapp && (
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-[clamp(10px,1vw,16px)] p-[clamp(10px,1.2vw,16px)] rounded-[16px] transition-opacity hover:opacity-90 text-left"
              style={itemGlass}
            >
              <div
                className="size-[clamp(36px,3.5vw,44px)] flex items-center justify-center rounded-full flex-shrink-0"
                style={accentIconStyle}
              >
                <MessageCircle className="size-[clamp(16px,1.5vw,20px)] text-white" />
              </div>
              <div>
                <div className="text-[clamp(13px,1.1vw,16px)] font-medium text-[#484848]" style={{ fontFamily: poppins }}>WhatsApp</div>
                <div className="text-[clamp(11px,0.9vw,13px)] text-[#757474]" style={{ fontFamily: poppins }}>{phones[0] || project.whatsapp}</div>
              </div>
            </button>
          )}

          {phones.map((phone, i) => (
            <button
              key={i}
              onClick={() => copyToClipboard(phone.trim(), `phone-${i}`)}
              className="w-full flex items-center gap-[clamp(10px,1vw,16px)] p-[clamp(10px,1.2vw,16px)] rounded-[16px] transition-opacity hover:opacity-90 text-left"
              style={itemGlass}
            >
              <div
                className="size-[clamp(36px,3.5vw,44px)] flex items-center justify-center rounded-full flex-shrink-0"
                style={accentIconStyle}
              >
                <Phone className="size-[clamp(16px,1.5vw,20px)] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[clamp(13px,1.1vw,16px)] font-medium text-[#484848]" style={{ fontFamily: poppins }}>Teléfono</div>
                <div className="text-[clamp(11px,0.9vw,13px)] text-[#757474]" style={{ fontFamily: poppins }}>{phone.trim()}</div>
              </div>
              {copiedField === `phone-${i}` && (
                <span className="text-[#484848] text-[11px] bg-white/50 px-2 py-0.5 rounded-full" style={{ fontFamily: poppins }}>
                  Copiado
                </span>
              )}
            </button>
          ))}

          {project.email && (
            <button
              onClick={() => copyToClipboard(project.email!, 'email')}
              className="w-full flex items-center gap-[clamp(10px,1vw,16px)] p-[clamp(10px,1.2vw,16px)] rounded-[16px] transition-opacity hover:opacity-90 text-left"
              style={itemGlass}
            >
              <div
                className="size-[clamp(36px,3.5vw,44px)] flex items-center justify-center rounded-full flex-shrink-0"
                style={accentIconStyle}
              >
                <Mail className="size-[clamp(16px,1.5vw,20px)] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[clamp(13px,1.1vw,16px)] font-medium text-[#484848]" style={{ fontFamily: poppins }}>Email</div>
                <div className="text-[clamp(11px,0.9vw,13px)] text-[#757474] truncate" style={{ fontFamily: poppins }}>{project.email}</div>
              </div>
              {copiedField === 'email' && (
                <span className="text-[#484848] text-[11px] bg-white/50 px-2 py-0.5 rounded-full" style={{ fontFamily: poppins }}>
                  Copiado
                </span>
              )}
            </button>
          )}

          {project.website && (
            <a
              href={project.website.startsWith('http') ? project.website : `https://${project.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-[clamp(10px,1vw,16px)] p-[clamp(10px,1.2vw,16px)] rounded-[16px] transition-opacity hover:opacity-90 text-left"
              style={itemGlass}
            >
              <div
                className="size-[clamp(36px,3.5vw,44px)] flex items-center justify-center rounded-full flex-shrink-0"
                style={accentIconStyle}
              >
                <Globe className="size-[clamp(16px,1.5vw,20px)] text-white" />
              </div>
              <div>
                <div className="text-[clamp(13px,1.1vw,16px)] font-medium text-[#484848]" style={{ fontFamily: poppins }}>Sitio Web</div>
                <div className="text-[clamp(11px,0.9vw,13px)] text-[#757474]" style={{ fontFamily: poppins }}>{project.website}</div>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
