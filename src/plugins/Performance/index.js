/**
 * 性能监控脚本
 * @param {Object} Tracker
 */

var utils = require('../../utils');
var addEvent = utils.addEvent;
var win = utils.getWin();
// var uaDevice = utils.uaDevice;
var GOLDLOG_SCRIPTS_BASE = '/fsp.1.3';

function PerformancePlugin(tracker, config) {
  var performance = win.performance || win.webkitPerformance ||
                    win.msPerformance || win.mozPerformance;

  if (!performance || !performance.timing) {
    return;
  }

  var stb = (performance.setResourceTimingBufferSize ||
             performance.webkitSetResourceTimingBufferSize);
  // 部分浏览器有 150 个元素的限制，设为 200
  stb && stb.call(performance, 200);

  var defaultConfig = {
    sampleRate: 1,
    isCalEntry: false,
    dirtyThreshold: 60000,
    scriptThreshold: 250,
    cssThreshold: 250,
    imgThreshold: 500
  };

  // 阈值检测
  if (config) {
    if (config.scriptThreshold !== undefined &&
        utils.isNumber(config.scriptThreshold) &&
        config.scriptThreshold <= defaultConfig.scriptThreshold) {
      config.scriptThreshold = defaultConfig.scriptThreshold;
    }

    if (config.cssThreshold !== undefined &&
        utils.isNumber(config.cssThreshold) &&
        config.cssThreshold <= defaultConfig.cssThreshold) {
      config.cssThreshold = defaultConfig.cssThreshold;
    }

    if (config.imgThreshold !== undefined &&
        utils.isNumber(config.imgThreshold) &&
        config.imgThreshold <= defaultConfig.imgThreshold) {
      config.imgThreshold = defaultConfig.imgThreshold;
    }
  }

  var pluginConfig = utils.extend(defaultConfig, config);

  var plugin = {
    /**
     * 补全 Script 打点参数中缺失的部分，如 pid 等
     * @return {object}
     */
    scriptLog: function() {
      var options = {
        code: 3
      };

      // 当前项目 id
      options.pid = tracker.pid;

      // 页面地址（不含 query 及 hash）
      options.page = win.location.href.split('?')[0];

      // 采样率
      options.sampleRate = pluginConfig.sampleRate;

      return options;
    },

    /**
     * 页面打点部分
     * @return {object}
     */
    scriptPageLog: function() {
      var options = this.scriptLog();
      this.needSend = true;

      var timing = performance.timing;
      var ns = timing.navigationStart;

      // 性能指标
      var timingParams = this.collectPerformanceTiming(timing);

      for (var key in timingParams) {
        if (timingParams.hasOwnProperty(key)) {
          options[key] = timingParams[key];
        }
      }

      // 收集首次渲染速度
      options.firstPaintTime = this.collectFirstPaint(timing, ns);

      // 收集网络指标
      if (this.collectNetworkInformation()) {
        options.effectiveType = this.collectNetworkInformation();
      }

      return options;
    },

    /**
     * 资源打点部分
     * TODO: 增加请求资源部分
     * @return {object}
     */
    scriptEntryLog: function() {
      var options = this.scriptLog();

      var resource = performance.getEntriesByType('resource');
      options.entry = JSON.stringify(this.collectEntries(resource));

      return options;
    },

    /**
     * 收集 Performance 周期中的数据
     * @return {object}
     */
    collectPerformanceTiming: function(timing) {
      var params = {};

      // Total time from start to load
      params.loadTime = timing.loadEventEnd - timing.fetchStart;
      // Time spent constructing the DOM tree
      params.domReadyTime = timing.domComplete - timing.domInteractive;
      // Time consumed preparing the new page
      params.readyStart = timing.fetchStart - timing.navigationStart;
      // Time spent during redirection
      params.redirectTime = timing.redirectEnd - timing.redirectStart;
      // AppCache
      params.appcacheTime = timing.domainLookupStart - timing.fetchStart;
      // Time spent unloading documents
      params.unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart;
      // DNS query time
      params.lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
      // TCP connection time
      params.connectTime = timing.connectEnd - timing.connectStart;
      // Time spent during the request
      params.requestTime = timing.responseEnd - timing.requestStart;
      // Request to completion of the DOM loading
      params.initDomTreeTime = timing.domInteractive - timing.responseEnd;
      // Load event time
      params.loadEventTime = timing.loadEventEnd - timing.loadEventStart;

      // Total time from start to domain lookup end
      params.tillDomLookupEndTime = timing.domainLookupEnd - timing.navigationStart;
      // Total time from start to response end
      params.tillResponseEndTime = timing.responseEnd - timing.navigationStart;
      // Total time from start to dom interactive
      params.tillDomReadyTime = timing.domInteractive - timing.navigationStart;
      // Total time from start to load
      params.totalTime = timing.loadEventEnd - timing.navigationStart;

      for (var key in params) {
        if (params.hasOwnProperty(key)) {
          if (!utils.isNumber(params[key]) || utils.isNaN(params[key]) || params[key] < 0) {
            params[key] = -1;
          } else if (params[key] >= pluginConfig.dirtyThreshold) {
            params[key] = -2;
          } else {
            params[key] = parseFloat(params[key].toFixed(2));
          }
        }
      }

      return params;
    },

    /**
     * 收集首次渲染速度
     * @return {number}
     */
    collectFirstPaint: function(timing, ns) {
      var firstPaint;

      if (win.chrome && win.chrome.loadTimes) {
        // Chrome
        firstPaint = win.chrome.loadTimes().firstPaintTime * 1000;
      } else if (utils.isNumber(timing.msFirstPaint)) {
        // IE
        firstPaint = timing.msFirstPaint;
      }

      if (firstPaint === undefined || !utils.isNumber(firstPaint) || utils.isNaN(firstPaint)) {
        return -1;
      }

      var firstPaintTime;
      if (firstPaint >= ns) {
        firstPaintTime = parseFloat((firstPaint - ns).toFixed(2));
      } else {
        firstPaintTime = -1;
      }

      if (firstPaintTime >= pluginConfig.dirtyThreshold) {
        firstPaintTime = -2;
      }

      return firstPaintTime;
    },

    /**
     * 统计网络指标
     */
    collectNetworkInformation: function() {
      if (!navigator.connection || !navigator.connection.effectiveType) { return; }

      return navigator.connection.effectiveType;
    },

    /**
     * 统计页面资源性能
     */
    collectEntries: function(resource) {
      var params = {};
      var loadTime;

      for (var i = 0; i < resource.length; i++) {
        loadTime = resource[i].responseEnd - resource[i].fetchStart;

        if (resource[i].decodedBodySize === 0 ||
            !utils.isNumber(loadTime) ||
            utils.isNaN(loadTime) ||
            (resource[i].initiatorType === 'script' && loadTime >= pluginConfig.scriptThreshold) ||
            (resource[i].initiatorType === 'css' && loadTime >= pluginConfig.cssThreshold) ||
            (resource[i].initiatorType === 'img' && loadTime >= pluginConfig.imgThreshold)) {
          params[resource[i].name] = {
            size: resource[i].decodedBodySize,
            type: resource[i].initiatorType,
            loadTime: loadTime
          }
        }
      }

      return params;
    },

    /**
     * 超过阈值抛弃
     */
    checkDirtyIndexes: function(options) {
      var needSend = true;

      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          if (options[key] === -2) {
            needSend = false;
            tracker._warn('数据' + key + '没有被采集到，本条日志作废');
            break;
          }
        }
      }

      return needSend;
    },

    /**
     * 统计页面加载性能
     */
    getPagePerformance: function() {
      var self = this;

      try {
        var options = self.scriptPageLog();
        options.base = GOLDLOG_SCRIPTS_BASE;

        if (pluginConfig.isCalEntry) {
          options = utils.extend(options, self.scriptEntryLog());
        }

        if (self.checkDirtyIndexes(options)) {
          tracker.log(options);
        }
      } catch (e) {
        // 上报到 Clue
        tracker.logError(e, {
          pid: 'fsp',
          code: 12,
          c4: tracker.pid
        });
      }
    }
  };

  var isOnIOS = /iPad|iPod|iPhone/.test(navigator.userAgent);
  var eventName = isOnIOS ? 'pagehide' : 'beforeunload';

  addEvent(win, eventName, function () {
    if (/loaded|complete/.test(document.readyState)) {
      plugin.getPagePerformance();
    }
  });

  tracker._warn('性能监控已打开');
}

module.exports = PerformancePlugin;
