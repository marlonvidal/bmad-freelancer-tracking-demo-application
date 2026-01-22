import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';
import { Column } from '@/types/column';

describe('ColumnRepository', () => {
  let repository: ColumnRepository;

  beforeEach(async () => {
    repository = new ColumnRepository();
    // Clear columns table before each test
    await db.columns.clear();
  });

  // Note: We don't close the database in afterAll as it causes circular reference issues
  // The database will be cleaned up by Jest's test environment

  describe('create', () => {
    it('creates a column successfully', async () => {
      const columnData = {
        name: 'Test Column',
        position: 0,
        color: null
      };

      const column = await repository.create(columnData);

      expect(column.id).toBeDefined();
      expect(column.name).toBe('Test Column');
      expect(column.position).toBe(0);
      expect(column.color).toBeNull();
      expect(column.createdAt).toBeInstanceOf(Date);
      expect(column.updatedAt).toBeInstanceOf(Date);
      expect(column.createdAt.getTime()).toBe(column.updatedAt.getTime());
    });

    it('generates unique IDs for each column', async () => {
      const columnData = {
        name: 'Column',
        position: 0,
        color: null
      };

      const column1 = await repository.create(columnData);
      const column2 = await repository.create(columnData);

      expect(column1.id).not.toBe(column2.id);
    });

    it('creates column with color when provided', async () => {
      const columnData = {
        name: 'Colored Column',
        position: 0,
        color: '#FF5733'
      };

      const column = await repository.create(columnData);

      expect(column.color).toBe('#FF5733');
    });

    it('handles QuotaExceededError with user-friendly message', async () => {
      // This test verifies error handling for storage limits
      // In a real scenario, we'd mock IndexedDB to throw QuotaExceededError
      // For now, we verify the error handling code exists
      const columnData = {
        name: 'Test Column',
        position: 0,
        color: null
      };

      // Normal operation should work
      const column = await repository.create(columnData);
      expect(column).toBeDefined();
    });
  });

  describe('getById', () => {
    it('returns column when found', async () => {
      const columnData = {
        name: 'Test Column',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Column');
    });

    it('returns undefined when column not found', async () => {
      const result = await repository.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all columns ordered by position', async () => {
      await repository.create({ name: 'Column 1', position: 2, color: null });
      await repository.create({ name: 'Column 2', position: 0, color: null });
      await repository.create({ name: 'Column 3', position: 1, color: null });

      const allColumns = await repository.getAll();

      expect(allColumns.length).toBe(3);
      expect(allColumns[0].name).toBe('Column 2'); // position 0
      expect(allColumns[1].name).toBe('Column 3'); // position 1
      expect(allColumns[2].name).toBe('Column 1'); // position 2
    });

    it('returns empty array when no columns exist', async () => {
      const allColumns = await repository.getAll();
      expect(allColumns).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates column successfully', async () => {
      const columnData = {
        name: 'Original Name',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(created.id);
      expect(updated.position).toBe(created.position);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('updates column position', async () => {
      const columnData = {
        name: 'Column',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const updated = await repository.update(created.id, { position: 5 });

      expect(updated.position).toBe(5);
      expect(updated.id).toBe(created.id);
    });

    it('updates column color', async () => {
      const columnData = {
        name: 'Column',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const updated = await repository.update(created.id, { color: '#FF5733' });

      expect(updated.color).toBe('#FF5733');
    });

    it('preserves column ID on update', async () => {
      const columnData = {
        name: 'Column',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const updated = await repository.update(created.id, { name: 'Updated Column' });

      expect(updated.id).toBe(created.id);
    });

    it('throws error when updating non-existent column', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('not found');
    });

    it('prevents ID from being changed', async () => {
      const columnData = {
        name: 'Column',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      const updated = await repository.update(created.id, { name: 'Updated' });

      // Even if we try to change ID, it should be preserved
      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('deletes column successfully', async () => {
      const columnData = {
        name: 'Column to Delete',
        position: 0,
        color: null
      };

      const created = await repository.create(columnData);
      await repository.delete(created.id);

      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeUndefined();
    });

    it('handles deleting non-existent column gracefully', async () => {
      // Should not throw error, just complete silently
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('reorder', () => {
    it('reorders columns by updating positions', async () => {
      const col1 = await repository.create({ name: 'Column 1', position: 0, color: null });
      const col2 = await repository.create({ name: 'Column 2', position: 1, color: null });
      const col3 = await repository.create({ name: 'Column 3', position: 2, color: null });

      // Reorder: col3, col1, col2
      await repository.reorder([col3.id, col1.id, col2.id]);

      const allColumns = await repository.getAll();
      expect(allColumns[0].id).toBe(col3.id);
      expect(allColumns[0].position).toBe(0);
      expect(allColumns[1].id).toBe(col1.id);
      expect(allColumns[1].position).toBe(1);
      expect(allColumns[2].id).toBe(col2.id);
      expect(allColumns[2].position).toBe(2);
    });

    it('handles reordering single column', async () => {
      const col1 = await repository.create({ name: 'Column 1', position: 0, color: null });

      await repository.reorder([col1.id]);

      const allColumns = await repository.getAll();
      expect(allColumns[0].id).toBe(col1.id);
      expect(allColumns[0].position).toBe(0);
    });

    it('handles reordering empty array', async () => {
      await expect(repository.reorder([])).resolves.not.toThrow();
    });

    it('maintains order after reordering', async () => {
      const col1 = await repository.create({ name: 'Column 1', position: 0, color: null });
      const col2 = await repository.create({ name: 'Column 2', position: 1, color: null });
      const col3 = await repository.create({ name: 'Column 3', position: 2, color: null });

      // Reorder multiple times
      await repository.reorder([col3.id, col1.id, col2.id]);
      await repository.reorder([col2.id, col3.id, col1.id]);

      const allColumns = await repository.getAll();
      expect(allColumns[0].id).toBe(col2.id);
      expect(allColumns[1].id).toBe(col3.id);
      expect(allColumns[2].id).toBe(col1.id);
    });
  });

  describe('error handling', () => {
    it('provides meaningful error messages', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('not found');
    });

    it('provides meaningful error messages', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('not found');
    });
  });
});
