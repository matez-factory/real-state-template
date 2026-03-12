import { useState } from 'react';
import { X, MessageCircle, Phone, Mail, Globe } from 'lucide-react';
import type { Project, Media } from '@/types/hierarchy.types';

interface ContactModalProps {
  project: Project;
  logos: Media[];
  open: boolean;
  onClose: () => void;
}

export function ContactModal({ project, logos, open, onClose }: ContactModalProps) {
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

  const itemClass =
    'w-full flex items-center gap-2 xl:gap-4 p-2 xl:p-4 bg-white/5 hover:bg-white/10 rounded-lg xl:rounded-xl transition-colors text-left';
  const iconClass =
    'w-8 h-8 xl:w-11 xl:h-11 flex items-center justify-center bg-white/10 rounded-full flex-shrink-0';

  const developerLogo = logos.find(l => l.purpose === 'logo_developer') ?? logos[0];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[280px] xl:max-w-sm lots-glass rounded-xl overflow-hidden p-3 xl:p-6 max-h-[90vh] overflow-y-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 xl:top-4 xl:right-4 w-7 h-7 xl:w-9 xl:h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors outline-none"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-white" />
        </button>

        {developerLogo && (
          <div className="text-center mb-3 xl:mb-6">
            <img
              src={developerLogo.url!}
              alt=""
              className="h-6 xl:h-8 mx-auto"
            />
          </div>
        )}

        <div className="space-y-1.5 xl:space-y-2">
          {project.whatsapp && (
            <button onClick={handleWhatsApp} className={itemClass}>
              <div className={iconClass}>
                <MessageCircle className="w-4 h-4 xl:w-5 xl:h-5 text-white/80" />
              </div>
              <div>
                <div className="text-white font-medium text-xs xl:text-sm">WhatsApp</div>
                <div className="text-white/50 text-[10px] xl:text-xs">{phones[0] || project.whatsapp}</div>
              </div>
            </button>
          )}

          {phones.map((phone, i) => (
            <button
              key={i}
              onClick={() => copyToClipboard(phone.trim(), `phone-${i}`)}
              className={itemClass}
            >
              <div className={iconClass}>
                <Phone className="w-4 h-4 xl:w-5 xl:h-5 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-xs xl:text-sm">Teléfono</div>
                <div className="text-white/50 text-[10px] xl:text-xs">{phone.trim()}</div>
              </div>
              {copiedField === `phone-${i}` && (
                <span className="text-white/80 text-[9px] xl:text-xs bg-white/10 px-1.5 py-0.5 xl:px-2 xl:py-1 rounded-full">
                  Copiado
                </span>
              )}
            </button>
          ))}

          {project.email && (
            <button
              onClick={() => copyToClipboard(project.email!, 'email')}
              className={itemClass}
            >
              <div className={iconClass}>
                <Mail className="w-4 h-4 xl:w-5 xl:h-5 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-xs xl:text-sm">Email</div>
                <div className="text-white/50 text-[10px] xl:text-xs truncate">{project.email}</div>
              </div>
              {copiedField === 'email' && (
                <span className="text-white/80 text-[9px] xl:text-xs bg-white/10 px-1.5 py-0.5 xl:px-2 xl:py-1 rounded-full">
                  Copiado
                </span>
              )}
            </button>
          )}

          {project.website && (
            <a
              href={
                project.website.startsWith('http')
                  ? project.website
                  : `https://${project.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
            >
              <div className={iconClass}>
                <Globe className="w-4 h-4 xl:w-5 xl:h-5 text-white/80" />
              </div>
              <div>
                <div className="text-white font-medium text-xs xl:text-sm">Sitio Web</div>
                <div className="text-white/50 text-[10px] xl:text-xs">{project.website}</div>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
