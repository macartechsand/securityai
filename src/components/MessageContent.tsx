import React from 'react';

/**
 * Renders a small, safe subset of Markdown (headings, bullet/numbered lists, **bold**, `code`)
 * as React elements. Model output is never injected as HTML, so it cannot execute script.
 */

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;

function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  for (const rawLine of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,4}\s+(.*)$/.exec(line);

    if (!line) {
      flushParagraph();
    } else if (heading) {
      flushParagraph();
      blocks.push({ type: 'h', text: heading[1] });
    } else if (bullet) {
      flushParagraph();
      const last = blocks[blocks.length - 1]; // read after flushing, so it is the true previous block
      if (last && last.type === 'ul') last.items.push(bullet[1]);
      else blocks.push({ type: 'ul', items: [bullet[1]] });
    } else if (numbered) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'ol') last.items.push(numbered[1]);
      else blocks.push({ type: 'ol', items: [numbered[1]] });
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

const MessageContent: React.FC<{ text: string }> = ({ text }) => {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h':
            return (
              <p key={index} className="font-semibold">
                {renderInline(block.text)}
              </p>
            );
          case 'ul':
            return (
              <ul key={index} className="list-disc pl-5 space-y-1">
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="list-decimal pl-5 space-y-1">
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={index}>{renderInline(block.text)}</p>;
        }
      })}
    </div>
  );
};

export default MessageContent;
