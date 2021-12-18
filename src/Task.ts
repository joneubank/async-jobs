import { flatMap, isArray, uniqueId } from 'lodash';
import { TaskState } from './TaskState';

export type Process = (task: TaskReflection) => Promise<any>;
export type ProcessInput = (Process | Task) | (Process | Task)[];

interface TaskOptions {
  name?: string;
  description?: string;
}

interface TaskReflection {
  updateProgress: (progress: number, max?: number) => void;
  getProgress: () => { progress: number; max: number };

  logs: string[];
  log: (log: string) => void;
}

class Task implements TaskReflection {
  active: boolean = false;
  state: TaskState = TaskState.PENDING;
  start?: Date;
  end?: Date;

  id: string;
  name: string = '';
  description: string = '';

  processes: Process[];
  output: any[] = [];
  error?: string;

  // ### -- TaskReflection
  private progress: number = 0;
  private progressMax: number = 100;
  updateProgress(progress: number, max?: number) {
    this.progress = progress;
    if (max) {
      this.progressMax = max;
    }
  }
  getProgress() {
    return { progress: this.progress, max: this.progressMax };
  }

  logs: string[] = [];
  log(log: string) {
    this.logs.push(log);
  }

  constructor(process: ProcessInput, options?: TaskOptions) {
    this.id = uniqueId();
    if (isArray(process)) {
      this.processes = flatMap(process, (input: Process | Task) =>
        typeof input === 'object' ? input.processes : input,
      );
      this.name = options?.name || '';
      this.description = options?.description || '';
    } else {
      if (typeof process === 'object') {
        // process is a task
        this.processes = process.processes;
        this.name = options?.name || process.name;
        this.description = options?.description || process.description;
      } else {
        this.processes = [process];
        this.name = options?.name || '';
        this.description = options?.description || '';
      }
    }
  }

  run = async () => {
    this.start = new Date();
    this.state = TaskState.RUNNING;
    this.active = true;
    try {
      for (let i = 0; i < this.processes.length; i++) {
        const output = await this.processes[i](this);
        this.output.push(output);
      }

      this.state = TaskState.COMPLETED;
    } catch (e: any) {
      this.state = TaskState.ERROR;
      if (e.message) {
        this.error = (e as Error).message;
      }
    } finally {
      this.active = false;
      this.end = new Date();
    }
  };

  summary = () => {
    return {
      id: this.id,
      name: this.name,
      description: this.description,

      active: this.active,
      state: this.state,
      start: this.start,
      end: this.end,

      progress: this.progress,
      progressMax: this.progressMax,
      logs: this.logs,

      output: this.output,
    };
  };
}

export default Task;
