declare module 'driver.js' {
  export type Driver = {
    drive: () => void;
  };

  export function driver(options: any): Driver;
}
