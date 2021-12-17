import { isArray, remove, sortBy, uniqueId } from 'lodash';
import Task from './Task';
import { ProcessInput } from './Task';

interface RunOptions {
  notes?: string;

  onStarted?: Function;
  onQueued?: Function;
  onScheduleResolved?: Function;
  onFailed?: Function;
  onCompleted?: Function;
}

enum EventType {
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  QUEUED = 'QUEUED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}
type TaskManagerEvent = {
  type: EventType;
  date: Date;
  notes?: string;
};
const addEvent = (run: Run, type: EventType, notes?: string) => run.events.push({ type, date: new Date(), notes });

interface Run {
  task: Task;
  id: string;
  events: TaskManagerEvent[];

  onStarted?: Function;
  onQueued?: Function;
  onScheduleResolved?: Function;
  onFailed?: Function;
  onCompleted?: Function;
}

const createRun = (processInput: ProcessInput, options?: RunOptions) => {
  const task: Task = new Task(processInput);

  const { onStarted, onQueued, onScheduleResolved, onFailed, onCompleted } = options || {};

  const run = { task, id: uniqueId(), events: [], onStarted, onQueued, onScheduleResolved, onFailed, onCompleted };
  addEvent(run, EventType.CREATED, options?.notes);
  return run;
};

interface ScheduledRun {
  run: Run;
  date: Date;
}

interface TaskManagerOptions {
  updateInterval?: number;
  maxConcurrent?: number;
}
class TaskManager {
  // Config
  updateInterval: number;
  maxConcurrent?: number;

  // Task Lists
  private active: Run[] = [];
  private queued: Run[] = [];
  private scheduled: ScheduledRun[] = [];

  private completed: Run[] = [];
  private failed: Run[] = [];

  // Schedule Checker
  private _intervalReference?: NodeJS.Timeout;

  constructor(options?: TaskManagerOptions) {
    this.updateInterval = options?.updateInterval || 60000;
    this.maxConcurrent = options?.maxConcurrent;

    this._intervalReference = setInterval(this._update, this.updateInterval);
  }

  /**
   * Internal Update method
   * Runs on the defined updateInterval (default to once a minute)
   *
   * Actions:
   * 1. Check for scheduled tasks that need to be started
   * 2. Begin queued tasks if there are enough concurrent slots
   */
  private _update = () => {
    const now = new Date();

    // ### -- Check for scheduled tasks to start
    // Scheduled array is sorted so earliest is first item
    // If first item date has not passed, then we can break out of loop.
    while (this.scheduled.length && this.scheduled[0].date < now) {
      // start scheduled task and add to active list.
      const run = (this.scheduled.shift() as ScheduledRun).run;
      run.onScheduleResolved && run.onScheduleResolved();

      this._startOrQueueRun(run);
    }
    if (this.scheduled.length === 0 && this._intervalReference) {
      clearInterval(this._intervalReference);
      this._intervalReference = undefined;
    }

    // ### -- Begin queued tasks if there are fewer running than the maxConcurrent value
    this._startTasksIfPossible(this.queued);
  };

  private _startTasksIfPossible(queue: Run[]) {
    if (this.maxConcurrent) {
      while (queue.length && this.active.length < this.maxConcurrent) {
        // while there are queued tasks and the active number is less than max
        const run = queue.shift() as Run;
        this._startRunImmediately(run);
      }
    } else {
      while (queue.length) {
        const run = this.queued.shift() as Run;
        this._startRunImmediately(run);
      }
    }
  }

  /**
   * Run task now, add to active list
   * WARNING: No checks performed.
   * @param task
   */
  private async _startRunImmediately(run: Run) {
    try {
      this.active.push(run);
      addEvent(run, EventType.STARTED);
      await run.task.run();
      run.onStarted && run.onStarted();
    } catch (e) {
      console.log(e);

      remove(this.active, (activeRun) => activeRun.id === run.id);
      addEvent(run, EventType.ERROR);
      this.failed.push(run);

      run.onFailed && run.onFailed();
    } finally {
      remove(this.active, (activeRun) => activeRun.id === run.id);
      addEvent(run, EventType.COMPLETED);
      this.completed.push(run);

      this._update();

      run.onCompleted && run.onCompleted();
    }
  }

  /**
   * This is how a task should be started, it will prevent tasks from being run
   * @param task
   */
  private _startOrQueueRun(run: Run) {
    if (this.maxConcurrent && this.active.length >= this.maxConcurrent) {
      this.queued.push(run);
      addEvent(run, EventType.QUEUED);
      run.onQueued && run.onQueued();
    } else {
      this._startRunImmediately(run);
    }
  }

  run(task: ProcessInput, options?: RunOptions): Run {
    const run = createRun(task, options);
    this._startOrQueueRun(run);

    return run;
  }
  schedule(task: Task, date: Date, options?: RunOptions): Run {
    const run = createRun(task, options);
    this.scheduled.push({ run, date });
    addEvent(run, EventType.SCHEDULED, date.toUTCString());
    this.scheduled = sortBy(this.scheduled, 'date');

    return run;
  }
  // cron(task: Task, cronSchedule: string) {}

  status() {
    return {
      stats: {
        running: this.active.length,
        queued: this.queued.length,
        scheduled: this.scheduled.length,
        completed: this.completed.length,
        failed: this.failed.length,
      },
    };
  }
}

export default TaskManager;
