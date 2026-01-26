import React from 'react';
import { render } from '@testing-library/react';
import { highlightText, highlightTaskTitle, highlightTaskDescription, highlightTaskTags } from '@/utils/searchUtils';
import { Task } from '@/types/task';

describe('searchUtils', () => {
  describe('highlightText', () => {
    it('returns escaped text when query is empty', () => {
      const result = highlightText('Test <script>alert("xss")</script>', '');
      const { container } = render(React.createElement(React.Fragment, null, result));
      // When query is empty, returns escaped HTML string which React renders as text
      // textContent will show the escaped HTML as text (double-escaped in DOM)
      expect(container.textContent).toContain('Test');
      // innerHTML should contain escaped HTML (not raw script tags)
      expect(container.innerHTML).not.toContain('<script>');
    });

    it('returns escaped text when query is whitespace only', () => {
      const result = highlightText('Test Task', '   ');
      const { container } = render(React.createElement(React.Fragment, null, result));
      expect(container.textContent).toBe('Test Task');
    });

    it('highlights matching text case-insensitively', () => {
      const result = highlightText('Test Task', 'test');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('Test');
      expect(mark?.className).toContain('bg-yellow-200');
    });

    it('highlights partial word matches', () => {
      const result = highlightText('Development Task', 'dev');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('Dev');
    });

    it('highlights multiple occurrences', () => {
      const result = highlightText('Test Task Test', 'test');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(2);
      expect(marks[0].textContent).toBe('Test');
      expect(marks[1].textContent).toBe('Test');
    });

    it('escapes HTML in text to prevent XSS', () => {
      const maliciousText = '<script>alert("xss")</script>Important Task';
      const result = highlightText(maliciousText, 'important');
      const { container } = render(React.createElement(React.Fragment, null, result));
      // Script tag should be escaped (not present as raw HTML)
      expect(container.innerHTML).not.toContain('<script>');
      // Important should still be highlighted (search happens before escaping)
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      // Verify the mark contains the search term (case-insensitive)
      expect(mark?.textContent?.toLowerCase()).toContain('important');
    });

    it('handles special characters in query', () => {
      const result = highlightText('Task (Important)', '(Important)');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('(Important)');
    });

    it('returns text without highlighting when no match found', () => {
      const result = highlightText('Test Task', 'xyz');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).not.toBeInTheDocument();
      expect(container.textContent).toBe('Test Task');
    });
  });

  describe('highlightTaskTitle', () => {
    it('highlights matching text in task title', () => {
      const task: Task = {
        id: '1',
        title: 'Development Task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = highlightTaskTitle(task, 'dev');
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('Dev');
    });

    it('returns escaped text when query is empty', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = highlightTaskTitle(task, '');
      const { container } = render(React.createElement(React.Fragment, null, result));
      expect(container.textContent).toBe('Test Task');
    });
  });

  describe('highlightTaskDescription', () => {
    it('highlights matching text in task description', () => {
      const task: Task = {
        id: '1',
        title: 'Task',
        description: 'This is a development task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = highlightTaskDescription(task, 'dev');
      expect(result).not.toBeNull();
      const { container } = render(React.createElement(React.Fragment, null, result));
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      // Search is case-insensitive, mark shows matched portion (lowercase "dev")
      expect(mark?.textContent?.toLowerCase()).toBe('dev');
    });

    it('returns null when task has no description', () => {
      const task: Task = {
        id: '1',
        title: 'Task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = highlightTaskDescription(task, 'test');
      expect(result).toBeNull();
    });
  });

  describe('highlightTaskTags', () => {
    it('highlights matching tags', () => {
      const tags = ['development', 'testing', 'bugfix'];
      const result = highlightTaskTags(tags, 'dev');
      
      const { container } = render(React.createElement(React.Fragment, null, ...result));
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      // development tag should be highlighted
      expect(container.textContent).toContain('development');
    });

    it('returns escaped tags when query is empty', () => {
      const tags = ['development', 'testing'];
      const result = highlightTaskTags(tags, '');
      
      const { container } = render(React.createElement(React.Fragment, null, result));
      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(0);
      expect(container.textContent).toContain('development');
      expect(container.textContent).toContain('testing');
    });

    it('handles case-insensitive tag matching', () => {
      const tags = ['Development', 'TESTING'];
      const result = highlightTaskTags(tags, 'dev');
      
      const { container } = render(React.createElement(React.Fragment, null, result));
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('handles partial tag matches', () => {
      const tags = ['frontend', 'backend'];
      const result = highlightTaskTags(tags, 'end');
      
      const { container } = render(React.createElement(React.Fragment, null, result));
      const marks = container.querySelectorAll('mark');
      // Both tags contain 'end'
      expect(marks.length).toBeGreaterThan(0);
    });
  });
});
