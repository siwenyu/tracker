import * as Tracker from '../../index.d';

declare function PerformancePlugin(tracker: Tracker, config: PerformancePlugin.Config): void;
declare namespace PerformancePlugin {
  interface Config {
    /** 用于控制性能监控的采样率，默认为 10% 采样 */
    sampleRate?: number;
    /** 用于控制性能指标的阈值，默认超过为 60s 的数据不采集，为异常数据 */
    dirtyThreshold?: number;
  
    // isCalEntry?: boolean;
    // scriptThreshold?: number;
    // cssThreshold?: number;
    // imgThreshold?: number;
  }
}

export = PerformancePlugin;