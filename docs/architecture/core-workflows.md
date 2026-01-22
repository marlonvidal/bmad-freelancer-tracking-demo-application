# Core Workflows

Key system workflows illustrating how components interact to fulfill user journeys:

## Workflow 1: Start Timer on Task

```mermaid
sequenceDiagram
    participant User
    participant TaskCard
    participant TimerService
    participant TimerContext
    participant DataLayer
    participant ServiceWorker
    participant IndexedDB

    User->>TaskCard: Click timer button
    TaskCard->>TimerService: startTimer(taskId)
    TimerService->>TimerContext: Check if timer active
    TimerContext->>TimerService: No active timer
    TimerService->>DataLayer: Save timer state
    DataLayer->>IndexedDB: Store TimerState
    TimerService->>ServiceWorker: Post message (start timer)
    ServiceWorker->>IndexedDB: Store timer start timestamp
    TimerService->>TimerContext: Update state (active timer)
    TimerContext->>TaskCard: Re-render with active timer
    TaskCard->>User: Show active timer indicator
```

## Workflow 2: Move Task Between Columns

```mermaid
sequenceDiagram
    participant User
    participant TaskCard
    participant KanbanBoard
    participant TaskContext
    participant DataLayer
    participant IndexedDB

    User->>TaskCard: Drag task
    TaskCard->>KanbanBoard: Drop on new column
    KanbanBoard->>TaskContext: updateTask(taskId, {columnId, position})
    TaskContext->>DataLayer: Update task in IndexedDB
    DataLayer->>IndexedDB: Update task record
    IndexedDB->>DataLayer: Confirm update
    DataLayer->>TaskContext: Return updated task
    TaskContext->>KanbanBoard: Update UI state
    KanbanBoard->>User: Show task in new column
```

## Workflow 3: Calculate Revenue for Task

```mermaid
sequenceDiagram
    participant TaskCard
    participant RevenueService
    participant DataLayer
    participant IndexedDB

    TaskCard->>RevenueService: Calculate revenue for task
    RevenueService->>DataLayer: Get task
    DataLayer->>IndexedDB: Query task
    RevenueService->>DataLayer: Get time entries for task
    DataLayer->>IndexedDB: Query time entries
    RevenueService->>RevenueService: Get effective hourly rate
    RevenueService->>RevenueService: Calculate: billableHours × rate
    RevenueService->>TaskCard: Return revenue amount
    TaskCard->>TaskCard: Display revenue on card
```

## Workflow 4: Background Timer Operation

```mermaid
sequenceDiagram
    participant BrowserTab
    participant ServiceWorker
    participant IndexedDB
    participant TimerState

    BrowserTab->>ServiceWorker: Tab becomes inactive
    ServiceWorker->>IndexedDB: Read TimerState
    IndexedDB->>ServiceWorker: Return active timer state
    ServiceWorker->>ServiceWorker: Start interval timer
    loop Every 30-60 seconds
        ServiceWorker->>ServiceWorker: Calculate elapsed time
        ServiceWorker->>IndexedDB: Update TimerState (lastUpdateTime)
    end
    BrowserTab->>ServiceWorker: Tab becomes active
    ServiceWorker->>BrowserTab: Post message (timer state)
    BrowserTab->>BrowserTab: Calculate precise elapsed time
    BrowserTab->>BrowserTab: Update UI with accurate time
```
