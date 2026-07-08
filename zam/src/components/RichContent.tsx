import { isHtml } from '@/lib/richText';

type RichContentProps = {
  content: string;
  className?: string;
  as?: 'div' | 'p';
};

export default function RichContent({ content, className = '', as = 'div' }: RichContentProps) {
  if (isHtml(content)) {
    return (
      <div
        className={`prose prose-slate max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (as === 'p') {
    return <p className={className}>{content}</p>;
  }

  return (
    <div className={className}>
      {content.split('\n\n').map((para) => (
        <p key={para.slice(0, 48)} className="mb-4 last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
}
