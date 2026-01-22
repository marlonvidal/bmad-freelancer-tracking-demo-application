import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { db } from '@/services/data/database';

describe('TaskRepository Performance', () => {
  let repository: TaskRepository;

  beforeEach(async () => {
    repository = new TaskRepository();
    await db.tasks.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  it('handles 1000+ tasks efficiently', async () => {
    const taskCount = 1000;
    const taskData = {
      title: 'Task',
      columnId: 'column-1',
      position: 0,
      clientId: null,
      projectId: null,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null as const,
      tags: []
    };

    // Measure insertion time
    const insertStart = Date.now();
    for (let i = 0; i < taskCount; i++) {
      await repository.create({
        ...taskData,
        title: `Task ${i}`,
        position: i
      });
    }
    const insertTime = Date.now() - insertStart;

    // Measure getAll query time
    const getAllStart = Date.now();
    const allTasks = await repository.getAll();
    const getAllTime = Date.now() - getAllStart;

    // Measure getByColumnId query time (using index)
    const getByColumnStart = Date.now();
    const columnTasks = await repository.getByColumnId('column-1');
    const getByColumnTime = Date.now() - getByColumnStart;

    // Measure getByClientId query time (using index)
    const clientId = 'client-1';
    // Update some tasks to have clientId
    for (let i = 0; i < 100; i++) {
      await repository.update(allTasks[i].id, { clientId });
    }
    
    const getByClientStart = Date.now();
    const clientTasks = await repository.getByClientId(clientId);
    const getByClientTime = Date.now() - getByClientStart;

    // Measure update time
    const updateStart = Date.now();
    await repository.update(allTasks[0].id, { title: 'Updated Task' });
    const updateTime = Date.now() - updateStart;

    // Measure delete time
    const deleteStart = Date.now();
    await repository.delete(allTasks[0].id);
    const deleteTime = Date.now() - deleteStart;

    // Verify results
    expect(allTasks.length).toBe(taskCount);
    expect(columnTasks.length).toBe(taskCount);
    expect(clientTasks.length).toBe(100);

    // Performance assertions - queries should complete in < 1 second
    expect(getAllTime).toBeLessThan(1000);
    expect(getByColumnTime).toBeLessThan(1000);
    expect(getByClientTime).toBeLessThan(1000);
    expect(updateTime).toBeLessThan(1000);
    expect(deleteTime).toBeLessThan(1000);

    console.log(`Performance metrics for ${taskCount} tasks:`);
    console.log(`  Insert ${taskCount} tasks: ${insertTime}ms`);
    console.log(`  GetAll query: ${getAllTime}ms`);
    console.log(`  GetByColumnId query: ${getByColumnTime}ms`);
    console.log(`  GetByClientId query: ${getByClientTime}ms`);
    console.log(`  Update single task: ${updateTime}ms`);
    console.log(`  Delete single task: ${deleteTime}ms`);
  });
});
