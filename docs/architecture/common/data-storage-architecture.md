# Data Storage Architecture

**Storage Technology: IndexedDB (via Dexie.js)**

All application data is stored locally in the browser using **IndexedDB**, not localStorage. This is a critical architectural decision:

**Why IndexedDB, not localStorage:**
- **Structured Data:** IndexedDB is a NoSQL database designed for structured data (objects, arrays, relationships), while localStorage only stores simple key-value strings
- **Capacity:** IndexedDB can store much larger amounts of data (hundreds of MB), while localStorage is limited to ~5-10MB
- **Querying:** IndexedDB supports complex queries, indexes, and efficient filtering (essential for 1000+ tasks), while localStorage requires loading all data into memory
- **Performance:** IndexedDB operations are asynchronous and don't block the UI thread, while localStorage is synchronous
- **Relationships:** IndexedDB naturally supports relational data (tasks → clients, projects, time entries), while localStorage would require manual relationship management

**Dexie.js Wrapper:**
We use Dexie.js as a wrapper around IndexedDB because:
- Simpler, Promise-based API (vs. callback-based IndexedDB)
- Better TypeScript support
- Built-in schema management and migrations
- Efficient querying with indexes
- Better error handling

**What Gets Stored:**
- All Task records
- All Client records
- All Project records
- All TimeEntry records
- All Column records
- All Subtask records
- TimerState (for active timer)
- Settings (singleton record)

**What Does NOT Get Stored:**
- No backend database
- No cloud storage (local-first architecture)
- No external services

**Data Persistence:**
- Data persists across browser sessions
- Data persists when browser is closed and reopened
- Data is stored per browser/domain (not synced across devices)
- Data can be exported/imported via backup/restore functionality
