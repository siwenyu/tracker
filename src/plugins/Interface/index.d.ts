import * as Tracker from '../../index.d';

declare function InterfacePlugin(tracker: Tracker, config: InterfacePlugin.Config): void;

declare namespace InterfacePlugin {
  interface EvaluateResult {
    errorCode: number | string;
    msg: string;
    traceId?: string;
  }
  
  interface Config {
    sampleRate?: number;
    /** ajax -> xhr.response, fetch -> text */
    evaluate?: (response: Response | string) => EvaluateResult | boolean;
    fullSample?: boolean;
  }
}

export = InterfacePlugin;