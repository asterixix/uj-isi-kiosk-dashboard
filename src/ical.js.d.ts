declare module 'ical.js' {
  export function parse(input: string): any;
  export class Component {
    constructor(jCal: any);
    getAllSubcomponents(name: string): Component[];
  }
  export class Event {
    constructor(component: Component);
    uid: string;
    summary: string;
    description: string;
    location: string;
    startDate: Time;
    endDate: Time;
  }
  export class Time {
    toJSDate(): Date;
    convertToZone(zone: Timezone): Time;
  }
  export class Timezone {
    constructor(component: Component);
  }
  export namespace TimezoneService {
    function register(zone: Timezone): void;
    function get(tzid: string): Timezone | null;
  }
}
