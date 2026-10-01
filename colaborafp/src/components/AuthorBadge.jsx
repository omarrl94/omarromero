import { GraduationCap, UserRound } from 'lucide-react';
import { TEACHER_AUTHOR } from '../utils/constants';

export default function AuthorBadge({ author }) {
  if (author === TEACHER_AUTHOR)
    return (
      <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
        <GraduationCap className="h-3.5 w-3.5" />
        Profesor
      </span>
    );
  return (
    <span className="chip bg-accent-500/15 text-accent-600 dark:text-accent-400">
      <UserRound className="h-3.5 w-3.5" />
      Alumno: <span className="max-w-[10rem] truncate font-semibold">{author}</span>
    </span>
  );
}
