import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-6xl font-extrabold text-brand-600 dark:text-brand-400">404</p>
      <p className="mt-3 text-lg font-semibold">Esta página no existe</p>
      <Link to="/" className="btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
