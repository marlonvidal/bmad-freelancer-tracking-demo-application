import { DatabaseService } from '@/services/data/DatabaseService';
import { db } from '@/services/data/database';

describe('DatabaseService', () => {
  beforeEach(async () => {
    DatabaseService.reset();
    await db.close();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('initialize', () => {
    it('initializes database successfully', async () => {
      await expect(DatabaseService.initialize()).resolves.not.toThrow();
    });

    it('is idempotent - can be called multiple times safely', async () => {
      await DatabaseService.initialize();
      await expect(DatabaseService.initialize()).resolves.not.toThrow();
      await expect(DatabaseService.initialize()).resolves.not.toThrow();
    });

    it('opens database connection', async () => {
      await DatabaseService.initialize();
      
      // Verify database is open by checking if we can access tables
      expect(db.tasks).toBeDefined();
      expect(db.clients).toBeDefined();
      expect(db.projects).toBeDefined();
    });
  });
});
