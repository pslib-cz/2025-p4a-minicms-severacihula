"use client";

import { Button } from "@nextui-org/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-medium border border-slate-300 bg-white px-3 py-2 text-sm",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "solid" : "flat"}
          onPress={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "solid" : "flat"}
          onPress={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "solid" : "flat"}
          onPress={() => editor.chain().focus().toggleBulletList().run()}
        >
          Odrasky
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
