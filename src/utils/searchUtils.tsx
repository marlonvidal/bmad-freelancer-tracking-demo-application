import React from 'react';
import { Task } from '@/types/task';

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * highlightText - Highlights matching text in a string
 * 
 * Wraps matching text in <mark> tags for highlighting.
 * Handles case-insensitive matching and partial word matches.
 * Escapes HTML to prevent XSS attacks.
 * 
 * @param text - The text to search in
 * @param query - The search query
 * @returns React node with highlighted text
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.trim() === '') {
    return escapeHtml(text);
  }

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Find all matches in original text (case-insensitive)
  // We need to find matches before escaping to get correct indices
  const matches: Array<{ start: number; end: number }> = [];
  let searchIndex = 0;

  while (searchIndex < normalizedText.length) {
    const index = normalizedText.indexOf(normalizedQuery, searchIndex);
    if (index === -1) {
      break;
    }
    matches.push({ start: index, end: index + normalizedQuery.length });
    searchIndex = index + 1;
  }

  if (matches.length === 0) {
    return escapeHtml(text);
  }

  // Build highlighted text using matches from original text
  // Since we're using indices from original text on escaped text,
  // we need to be careful. For simplicity, escape each segment separately.
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach(({ start, end }) => {
    // Add text before match (escape it)
    if (start > lastIndex) {
      parts.push(escapeHtml(text.substring(lastIndex, start)));
    }

    // Add highlighted match (escape the matched portion)
    parts.push(
      <mark
        key={`highlight-${start}`}
        className="bg-yellow-200 text-gray-900 rounded px-0.5"
        aria-label={`Highlighted match: ${query}`}
      >
        {escapeHtml(text.substring(start, end))}
      </mark>
    );

    lastIndex = end;
  });

  // Add remaining text after last match (escape it)
  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.substring(lastIndex)));
  }

  return <>{parts}</>;
}

/**
 * highlightTaskTitle - Highlights matching text in task title
 * 
 * @param task - The task
 * @param query - The search query
 * @returns React node with highlighted title
 */
export function highlightTaskTitle(task: Task, query: string): React.ReactNode {
  return highlightText(task.title, query);
}

/**
 * highlightTaskDescription - Highlights matching text in task description
 * 
 * @param task - The task
 * @param query - The search query
 * @returns React node with highlighted description, or null if no description
 */
export function highlightTaskDescription(task: Task, query: string): React.ReactNode | null {
  if (!task.description) {
    return null;
  }
  return highlightText(task.description, query);
}

/**
 * highlightTaskTags - Highlights matching tags in task tags array
 * 
 * @param tags - Array of tag strings
 * @param query - The search query
 * @returns Array of React nodes with highlighted tags
 */
export function highlightTaskTags(tags: string[], query: string): React.ReactNode[] {
  if (!query || query.trim() === '') {
    return tags.map((tag, index) => <span key={index}>{escapeHtml(tag)}</span>);
  }

  const normalizedQuery = query.toLowerCase().trim();

  return tags.map((tag, index) => {
    const normalizedTag = tag.toLowerCase();
    if (normalizedTag.includes(normalizedQuery) || normalizedQuery.includes(normalizedTag)) {
      return (
        <span key={index}>
          {highlightText(tag, query)}
        </span>
      );
    }
    return <span key={index}>{escapeHtml(tag)}</span>;
  });
}
