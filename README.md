# Task Manager

TypeScript module to organize running and scheduling long running async processes.

## Quick Start

A short how to guide to help you:

- Initialize a TaskManager
- Run the Task
- Query the state of the TaskManager

Add TaskManager from npm:
`npm i @joneubank/async-task-manager`

```TypeScript
import TaskManager from '@joneubank/async-task-manager';

// Initialize a TaskManager
const taskManager = new TaskManager();

// Imagine you have an important long running process (this one just returns true after 1 second)
const longProcess = async () => {
  return await new Promise((resolve) => {
    setTimeout(()=>resolve(true), 1000)
  });
}

// Run a Task
const runningTask = taskManager.run(longProcess);

// Schedule a task to start in 10 seconds
const scheduledTask = taskManager.schedule(new Date(Date.now()+10000), longProcess, );

// Create a cron job that will run on a schedule (this one runs every minute)
const cronJob = taskManager.cron('* * * * *', longProcess)

// Query TaskManager State
taskManager.stats();
/*
{
  running: 1,
  queued: 0,
  scheduled: 1,
  completed: 0,
  failed: 0,
  cron: 1
}
*/

// Interrogate jobs in manager
taskManager.listAll();
/*
{
  running: [<Object(Run)>],
  queued: []
  scheduled: [<Object(ScheduledRun)>],
  cron: [<Object(CronRecord)>]
}
*/
```
