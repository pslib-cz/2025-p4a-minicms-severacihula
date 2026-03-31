"use client";

import Link from "next/link";
import { useState } from "react";

type TagFilterItem = {
  id: string;
  name: string;
  slug: string;
};

type TagFilterProps = {
  tags: TagFilterItem[];
  activeTag?: string;
};

export function TagFilter({ tags, activeTag }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeTagName = tags.find((tag) => tag.slug === activeTag)?.name;
  const buttonLabel = activeTagName ? `Filtr: ${activeTagName}` : "Filtr podle štítku";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {buttonLabel}
        <span className="ml-2 text-xs text-slate-500">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          role="menu"
        >
          <Link
            href="/"
            className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-in-out ${
              !activeTag ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setIsOpen(false)}
          >
            Všechny články
          </Link>

          <div className="my-2 h-px bg-slate-200" />

          {tags.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/?tag=${encodeURIComponent(tag.slug)}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-in-out ${
                    activeTag === tag.slug
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">Zatím nejsou k dispozici žádné tagy.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
