import { CodeXml } from 'lucide-react';
import { languageLabel } from '../utils/constants';
import CardShell from './CardShell';
import CodeBlock from './CodeBlock';
import CopyButton from './CopyButton';

export default function CodeSnippetCard({ resource, actions, footer, maxHeight }) {
  return (
    <CardShell
      resource={resource}
      footer={footer}
      icon={CodeXml}
      typeLabel="Código"
      accent={resource.author === 'teacher' ? 'brand' : 'accent'}
      headerExtra={
        <span className="chip bg-slate-100 font-mono text-slate-700 dark:bg-ink-800 dark:text-slate-300">
          {languageLabel(resource.language)}
        </span>
      }
      actions={
        <>
          <CopyButton text={resource.content} />
          {actions}
        </>
      }
    >
      <div className="mt-3">
        <CodeBlock code={resource.content} language={resource.language} maxHeight={maxHeight} />
      </div>
    </CardShell>
  );
}
