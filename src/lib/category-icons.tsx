import { Car, Building2, Smartphone, Shirt, Home, Briefcase, Dumbbell, ShoppingBasket, Package } from 'lucide-react';
import React from 'react';

const ICON_STYLES: Record<string, { bg: string; icon: string; stroke: string }> = {
  vehicules:       { bg: 'bg-red-50 dark:bg-red-950/30', icon: 'text-red-500', stroke: '1.5' },
  immobilier:     { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'text-blue-500', stroke: '1.5' },
  electronique:   { bg: 'bg-violet-50 dark:bg-violet-950/30', icon: 'text-violet-500', stroke: '1.5' },
  'mode-beaute':  { bg: 'bg-pink-50 dark:bg-pink-950/30', icon: 'text-pink-500', stroke: '1.5' },
  'maison-jardin': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-500', stroke: '1.5' },
  'emploi-services': { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'text-amber-600', stroke: '1.5' },
  'loisirs-sport': { bg: 'bg-cyan-50 dark:bg-cyan-950/30', icon: 'text-cyan-500', stroke: '1.5' },
  alimentation:   { bg: 'bg-orange-50 dark:bg-orange-950/30', icon: 'text-orange-500', stroke: '1.5' },
};

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  vehicules: Car, immobilier: Building2, electronique: Smartphone,
  'mode-beaute': Shirt, 'maison-jardin': Home, 'emploi-services': Briefcase,
  'loisirs-sport': Dumbbell, alimentation: ShoppingBasket,
};

// Use this in JSX only — never assign to a variable outside JSX
export function CategoryIcon({ slug, size = 24, className = '' }: { slug: string; size?: number; className?: string }) {
  const IconComp = ICON_MAP[slug] || Package;
  const style = ICON_STYLES[slug] || ICON_STYLES.alimentation;
  return (
    <div className={`cat-icon ${style.bg} ${className}`}>
      <IconComp size={size} strokeWidth={parseFloat(style.stroke)} className={style.icon} />
    </div>
  );
}

export function getCategoryStyle(slug: string) {
  return ICON_STYLES[slug] || ICON_STYLES.alimentation;
}
