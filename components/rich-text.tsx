import * as React from "react";
import katex from "katex";
import { cn } from "@/lib/utils";

function renderMath(expression: string, displayMode: boolean) {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

function renderPlain(text: string, keyPrefix: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => (
    <React.Fragment key={`${keyPrefix}-line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {line}
    </React.Fragment>
  ));
}

/**
 * Renderer teks soal yang aman: hanya mendukung paragraf, baris baru,
 * tebal/miring, dan rumus KaTeX ($...$ atau $$...$$). HTML mentah tidak
 * pernah dirender, sehingga aman dari XSS.
 */
export function RichText({
  text,
  className,
  inline = false,
}: {
  text: string | null | undefined;
  className?: string;
  inline?: boolean;
}) {
  if (!text) return null;

  const tokens = text.split(
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+\*\*|\*[^*\n]+\*)/g
  );

  const content = tokens.map((token, index) => {
    if (!token) return null;

    if (token.startsWith("$$") && token.endsWith("$$")) {
      const html = renderMath(token.slice(2, -2), true);
      if (html) {
        return (
          <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
        );
      }
    }

    if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const html = renderMath(token.slice(1, -1), false);
      if (html) {
        return (
          <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
        );
      }
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }

    return (
      <React.Fragment key={index}>
        {renderPlain(token, String(index))}
      </React.Fragment>
    );
  });

  if (inline) {
    return <span className={cn("question-content", className)}>{content}</span>;
  }

  return <div className={cn("question-content", className)}>{content}</div>;
}
