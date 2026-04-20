import React, { useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo,
  SquareCode,
  Undo,
} from "lucide-react";

function isProbablyHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function normalizeInitialContent(value: string): string {
  const raw = value ?? "";
  if (raw.trim() === "") return "";
  // If stored as plain text, wrap it so TipTap preserves newlines.
  if (!isProbablyHtml(raw)) {
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<p>${escaped.replace(/\n/g, "<br />")}</p>`;
  }
  return raw;
}

export function RichTextViewer({ value, className }: { value: string; className?: string }) {
  const sanitized = useMemo(
    () =>
      DOMPurify.sanitize(value ?? "", {
        USE_PROFILES: { html: true },
      }),
    [value],
  );

  // If it's not HTML, keep the existing pre-wrap layout.
  if (!isProbablyHtml(value ?? "")) {
    return <p className={className ?? "whitespace-pre-wrap"}>{value}</p>;
  }

  return (
    <div
      className={
        (className ?? "") +
        " prose prose-sm max-w-none prose-pre:bg-[#111827] prose-pre:text-gray-100 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-lg prose-pre:px-4 prose-pre:py-3 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
      }
      // Sanitized above.
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (nextHtml: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        protocols: ["https", "http", "mailto"],
      }),
    ],
    content: normalizeInitialContent(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[140px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#1F2430] focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = normalizeInitialContent(value);
    // Keep editor in sync when we load an existing draft.
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  const canUse = Boolean(editor) && !disabled;

  return (
    <div className={disabled ? "opacity-70" : ""}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!canUse || !editor?.can().chain().focus().undo().run()}
          onClick={() => editor?.chain().focus().undo().run()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Undo"
          title="Undo"
        >
          <Undo className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canUse || !editor?.can().chain().focus().redo().run()}
          onClick={() => editor?.chain().focus().redo().run()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Redo"
          title="Redo"
        >
          <Redo className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="mx-1 h-6 w-px bg-gray-200" />
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("bold") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Bold"
          title="Bold"
        >
          <Bold className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("italic") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Italic"
          title="Italic"
        >
          <Italic className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("code") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Inline code"
          title="Inline code"
        >
          <Code className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="mx-1 h-6 w-px bg-gray-200" />
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("bulletList") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Bullet list"
          title="Bullet list"
        >
          <List className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("orderedList") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Numbered list"
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("codeBlock") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Code block"
          title="Code block"
        >
          <SquareCode className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="mx-1 h-6 w-px bg-gray-200" />
        <button
          type="button"
          disabled={!canUse}
          onClick={() => {
            if (!editor) return;
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", previous ?? "https://");
            if (url == null) return;
            if (url.trim() === "") {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url.trim() }).run();
          }}
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 " +
            (editor?.isActive("link") ? "ring-2 ring-[#5A7ACD]/30" : "")
          }
          aria-label="Link"
          title="Link"
        >
          <LinkIcon className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="rounded-xl focus-within:ring-2 focus-within:ring-[#5A7ACD]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

