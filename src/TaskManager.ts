import { max, sortBy } from 'lodash';
import Task from './Task';
import { TaskState } from './TaskState';
interface TaskManagerOptions {
  updateInterval?: number;
  maxConcurrent?: number;
}

interface ScheduledTask {
  task: Task;
  date: Date;
}

class TaskManager {
  // Config
  updateInterval: number;
  maxConcurrent?: number;

  // Task Lists
  active: Task[] = [];
  queued: Task[] = [];
  scheduled: ScheduledTask[] = [];

  constructor(options: TaskManagerOptions) {
    this.updateInterval = options.updateInterval || 60000;
    this.maxConcurrent = options.maxConcurrent;

    /**
     * ##### Check Scheduled tasks, run if possible
     */
    setInterval(() => {
      const now = new Date();

      // Scheduled array is sorted so earliest is first item
      // If first item date has not passed, then we can break out of loop.
      while (this.scheduled.length && this.scheduled[0].date < now) {
        // start scheduled task and add to active list.

        const task = (this.scheduled.shift() as ScheduledTask).task;
        task.run();
        this.active.push(task);
      }
    }, options.updateInterval || 60000);
  }

  run(task: Task) {
    if (this.maxConcurrent && this.active.length >= this.maxConcurrent) {
      this.queued.unshift(task);
    } else {
      task.run();
      this.active.push(task);
    }
  }
  queue(task: Task) {
    this.queued.push(task);
  }
  schedule(task: Task, date: Date) {
    this.scheduled.push({ task, date });
    this.scheduled = sortBy(this.scheduled, 'date');
  }
  cron(task: Task, cronSchedule: string) {}

  status() {}
}

export default TaskManager;
