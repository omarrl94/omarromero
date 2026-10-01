import { useEffect } from 'react';
import { APP_NAME } from '../utils/constants';

export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · CFP José Ramón Otero`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
