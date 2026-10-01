import CodeSnippetCard from './CodeSnippetCard';
import LinkCard from './LinkCard';
import TaskCard from './TaskCard';

const CARDS = { code: CodeSnippetCard, task: TaskCard, link: LinkCard };

/** Elige la tarjeta adecuada según `resource.type`. */
export default function ResourceCard({ resource, ...props }) {
  const Card = CARDS[resource.type] ?? TaskCard;
  return <Card resource={resource} {...props} />;
}
