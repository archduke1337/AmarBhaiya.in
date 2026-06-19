"use client";

import { Fragment } from "react";

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  const flushCodeBlock = (key: number) => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-xl border border-border/40 bg-surface-hover p-4 text-sm leading-6"
        >
          {codeBlockLang && (
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {codeBlockLang}
            </div>
          )}
          <code className="font-mono text-sm leading-6 text-foreground/80">
            {codeBlockContent.join("\n")}
          </code>
        </pre>
      );
    }
    codeBlockContent = [];
    codeBlockLang = "";
  };

  let elementKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(elementKey++);
        inCodeBlock = false;
      } else {
        flushCodeBlock(elementKey++);
        inCodeBlock = true;
        codeBlockLang = line.trimStart().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      elements.push(<div key={elementKey++} className="h-3" />);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={elementKey++} className="my-6 border-border/40" />
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={elementKey++}
          className="my-3 border-l-2 border-accent pl-4 text-sm italic text-muted-foreground"
        >
          <InlineMarkdown text={trimmed.slice(2)} />
        </blockquote>
      );
      continue;
    }

    // Heading 1
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={elementKey++}
          className="mt-6 mb-3 font-heading text-2xl font-black tracking-[-0.03em] first:mt-0"
        >
          <InlineMarkdown text={trimmed.slice(2)} />
        </h1>
      );
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={elementKey++}
          className="mt-5 mb-2 font-heading text-xl font-black tracking-[-0.03em] first:mt-0"
        >
          <InlineMarkdown text={trimmed.slice(3)} />
        </h2>
      );
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={elementKey++}
          className="mt-4 mb-2 font-heading text-lg font-bold"
        >
          <InlineMarkdown text={trimmed.slice(4)} />
        </h3>
      );
      continue;
    }

    // Heading 4
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4
          key={elementKey++}
          className="mt-3 mb-1.5 font-heading text-base font-bold"
        >
          <InlineMarkdown text={trimmed.slice(5)} />
        </h4>
      );
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [trimmed.slice(2)];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (next.startsWith("- ") || next.startsWith("* ")) {
          items.push(next.slice(2));
          i++;
        } else if (next.startsWith("  ") && next.trim()) {
          // continuation of last item
          items[items.length - 1] += " " + next.trim();
          i++;
        } else {
          break;
        }
      }
      elements.push(
        <ul key={elementKey++} className="my-3 list-disc pl-6 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm leading-7 text-muted-foreground">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [trimmed.replace(/^\d+\.\s/, "")];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (/^\d+\.\s/.test(next)) {
          items.push(next.replace(/^\d+\.\s/, ""));
          i++;
        } else if (next.startsWith("  ") && next.trim()) {
          items[items.length - 1] += " " + next.trim();
          i++;
        } else {
          break;
        }
      }
      elements.push(
        <ol key={elementKey++} className="my-3 list-decimal pl-6 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm leading-7 text-muted-foreground">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (default)
    elements.push(
      <p key={elementKey++} className="my-2 text-sm leading-7 text-muted-foreground first:mt-0">
        <InlineMarkdown text={trimmed} />
      </p>
    );
  }

  // Flush any remaining code block
  if (inCodeBlock) {
    flushCodeBlock(elementKey++);
  }

  return <div className="prose prose-sm dark:prose-invert max-w-none">{elements}</div>;
}

// ── Inline Markdown Parser ─────────────────────────────────────────────────

type InlineSegment = {
  type: "text" | "bold" | "italic" | "code" | "link" | "strikethrough";
  text: string;
  href?: string;
};

function parseInlineMarkdown(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Code (inline) — highest priority
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      segments.push({ type: "code", text: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      segments.push({ type: "link", text: linkMatch[1], href: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold + Italic ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/);
    if (boldItalicMatch) {
      segments.push({ type: "bold", text: boldItalicMatch[1] });
      segments.push({ type: "italic", text: "" });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold **text** or __text__
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      segments.push({ type: "bold", text: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    const boldMatch2 = remaining.match(/^__([^_]+)__/);
    if (boldMatch2) {
      segments.push({ type: "bold", text: boldMatch2[1] });
      remaining = remaining.slice(boldMatch2[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      segments.push({ type: "italic", text: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    const italicMatch2 = remaining.match(/^_([^_]+)_/);
    if (italicMatch2) {
      segments.push({ type: "italic", text: italicMatch2[1] });
      remaining = remaining.slice(italicMatch2[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      segments.push({ type: "strikethrough", text: strikeMatch[1] });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Image ![alt](url) — treat as link for simplicity
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      segments.push({ type: "link", text: imageMatch[1] || "Image", href: imageMatch[2] });
      remaining = remaining.slice(imageMatch[0].length);
      continue;
    }

    // Plain text — consume until next special char
    const nextSpecial = remaining.search(/[*_`[~!]/);
    if (nextSpecial === 0) {
      // Shouldn't happen, but safety
      segments.push({ type: "text", text: remaining[0] });
      remaining = remaining.slice(1);
    } else if (nextSpecial > 0) {
      segments.push({ type: "text", text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    } else {
      segments.push({ type: "text", text: remaining });
      remaining = "";
    }
  }

  return segments;
}

function InlineMarkdown({ text }: { text: string }) {
  const segments = parseInlineMarkdown(text);

  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "bold":
            return <strong key={i} className="font-bold text-foreground">{seg.text}</strong>;
          case "italic":
            return <em key={i} className="italic">{seg.text}</em>;
          case "code":
            return (
              <code
                key={i}
                className="rounded-md bg-surface-hover px-1.5 py-0.5 font-mono text-[13px] text-foreground/90"
              >
                {seg.text}
              </code>
            );
          case "link":
            return (
              <a
                key={i}
                href={seg.href}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                {seg.text}
              </a>
            );
          case "strikethrough":
            return <del key={i} className="text-muted-foreground">{seg.text}</del>;
          default:
            return <Fragment key={i}>{seg.text}</Fragment>;
        }
      })}
    </>
  );
}
