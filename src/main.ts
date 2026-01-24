import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environnements/environment';

if (environment.production) {
  const noop = () => undefined;

  const methods: (keyof Console)[] = [
    'log',
    'info',
    'warn',
    'debug',
    'trace',
    'group',
    'groupCollapsed',
    'groupEnd',
    'table',
    'time',
    'timeEnd',
    'timeLog',
    'count',
    'countReset',
    'dir',
    'dirxml',
    'assert',
    'clear'
  ];

  for (const m of methods) {
    try {
      (console[m] as unknown as (...args: any[]) => void) = noop;
    } catch {
      // ignore
    }
  }
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
