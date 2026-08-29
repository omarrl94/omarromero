import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  Calculator,
  Car,
  ChefHat,
  Clapperboard,
  ClipboardList,
  Code2,
  Cog,
  Compass,
  DoorOpen,
  Dumbbell,
  Ear,
  Factory,
  Footprints,
  GraduationCap,
  Hammer,
  Handshake,
  HeartHandshake,
  HeartPulse,
  ListChecks,
  Map,
  MessageCircle,
  Microscope,
  Monitor,
  Palette,
  Phone,
  Puzzle,
  Repeat,
  Rocket,
  Ruler,
  Search,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Stethoscope,
  Store,
  Trees,
  TrendingUp,
  User,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Registro explicito de iconos.
 *
 * Los datos guardan el icono como texto (`icono: 'Monitor'`), asi que hace
 * falta resolverlo a componente. Se hace con un mapa cerrado en vez de con un
 * import dinamico para que el bundle solo incluya los iconos que se usan y
 * para que un nombre erroneo caiga en el icono por defecto sin romper nada.
 */
const REGISTRO: Record<string, LucideIcon> = {
  Activity,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  Calculator,
  Car,
  ChefHat,
  Clapperboard,
  ClipboardList,
  Code2,
  Cog,
  Compass,
  DoorOpen,
  Dumbbell,
  Ear,
  Factory,
  Footprints,
  GraduationCap,
  Hammer,
  Handshake,
  HeartHandshake,
  HeartPulse,
  ListChecks,
  Map,
  MessageCircle,
  Microscope,
  Monitor,
  Palette,
  Phone,
  Puzzle,
  Repeat,
  Rocket,
  Ruler,
  Search,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Stethoscope,
  Store,
  Trees,
  TrendingUp,
  User,
  Users,
  Wrench,
  Zap,
};

interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

/** Icono decorativo: siempre aria-hidden, el texto de al lado lleva el sentido. */
export function Icon({ name, className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
  const Componente = REGISTRO[name] ?? Compass;
  return <Componente className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
