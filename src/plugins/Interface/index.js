/**
 * 通过 hack XMLHttpRequest 和 fetch 统计接口报错情况，仅兼容 IE8 及以上
 */

var utils = require('../../utils/index');
var win = utils.getWin();

// 由于页面可能有很多请求被拦截，所以出于性能考虑为了不 deopt V8，对所有的 arguments
// 做 slice 处理，避免 arguments leaking
module.exports = function InterfacePlugin(tracker, config) {
  var defaultConfig = {
    sampleRate: 1,
    evaluate: null,
    fullSample: false
  };

  var pluginConfig = utils.extend(defaultConfig, config);

  // Hack XMLHttpRequest
  if ('XMLHttpRequest' in win) {
    var xhrproto = win.XMLHttpRequest.prototype;
    var prevOpen = xhrproto.open;
    const requestItem = {
      startTime: +new Date()
    };
    xhrproto.open = function (method, url) {
      requestItem.startTime = +new Date();
      this.__tracker__ = {
        method: method,
        url: url || '',
        status_code: null
      };

      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
      }
      prevOpen.apply(this, args);
    }

    var prevSend = xhrproto.send;
    xhrproto.send = function (data) {
      var xhr = this;
      function onreadystatechangeHandler() {
        if (xhr.__tracker__ && xhr.readyState === 4) {
          try {
            var isGET = xhr.__tracker__.method.toUpperCase() === 'GET';
            var url = xhr.__tracker__.url;

            // 当请求被取消或 timeout 时为 0
            if (xhr.status === 0) {
              return;
            }

            var trueUrl = url.split('?')[0];
            var params = url.split('?')[1] || '';
            var trueParams = isGET ? params : data ? JSON.stringify(data) : params;

            var response = String(xhr.response);
            if (response.length > 2048) {
              response = '[too large]';
            }

            var logItem = {
              ajaxurl: trueUrl,
              params: encodeURIComponent(trueParams),
              c1: xhr.__tracker__.method,
              c2: xhr.status,
              c3: response,
              code: 2,
              sampleRate: pluginConfig.sampleRate,
              oncePerSession: true
            };

            // 接口响应打点
            const endTime = +new Date();
            const logItemTime = {
              ...logItem,
              c6: endTime - requestItem.startTime,
              code: 11,
              startTime: requestItem.startTime,
              endTime: endTime,
              requestApiType: 'XMLHttpRequest'
            };
            tracker.log(logItemTime);

            // 标记异常打点
            var shouldLog = false;
            if (typeof pluginConfig.evaluate === 'function') {
              // IE 会在 readyState = 1 的情况下多次调用 onreadystatechange 的回调
              if (({}).toString.call(xhr.response) === '[object Blob]') {
                return;
              }

              var ret;
              try {
                ret = pluginConfig.evaluate(xhr.response);
              } catch (err) {
                // ignore evaluate error
              }

              // 若返回 object，则说明接口出错了，返回的 object 包含了需要打点的字段
              if (typeof ret === 'object') {
                logItem.c4 = ret.errorCode || ret.errCode || '';
                logItem.c5 = ret.traceId || '';
                logItem.msg = ret.msg || '';
                shouldLog = true;
              }
            }

            if (xhr.status !== 200 || shouldLog || pluginConfig.fullSample) {
              tracker.log(logItem);
            }
          } catch (e) {
            // 上报到 Clue
            tracker.logError(e, {
              pid: 'fsp',
              code: 12,
              c4: tracker.pid,
              c5: xhr.__tracker__.url
            });
          }
        }
      }

      if ('onreadystatechange' in xhr && typeof xhr.onreadystatechange === 'function') {
        var prevReadyStateChangeHandler = xhr.onreadystatechange;
        xhr.onreadystatechange = function () {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }

          onreadystatechangeHandler.apply(this, args);
          prevReadyStateChangeHandler.apply(this, args);
        }
      } else {
        xhr.onreadystatechange = onreadystatechangeHandler;
      }

      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
      }

      return prevSend.apply(this, arguments);
    }
  }

  // Hack Fetch
  if ('fetch' in win) {
    var prevFetch = win.fetch;
    win.fetch = function () {
      const requestItem = {
        startTime: +new Date()
      };
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
      }

      var method = 'GET';
      if (args[1] && args[1].method) {
        method = args[1].method.toUpperCase();
      }

      return prevFetch.apply(this, args).then(function (response) {
        return new Promise(function (resolve, reject) {
          try {
            var isGET = method === 'GET';
            var url = args[0];

            var trueUrl = url.split('?')[0];
            var params = url.split('?')[1] || '';
            var trueParams = isGET ? params : args[1] ? JSON.stringify(args[1].body) : params;

            var logItem = {
              ajaxurl: trueUrl,
              params: encodeURIComponent(trueParams),
              c1: method,
              c2: response.status,
              code: 2,
              sampleRate: pluginConfig.sampleRate,
              oncePerSession: true,
              requestApiType: 'fetch'
            };
            response
              .clone()
              .text()
              .then(function (text) {
                var ret = text;
                try {
                  ret = pluginConfig.evaluate(text);
                } catch (err) {
                  // ignore evaluate error
                }

                var shouldLog = typeof ret === 'object';
                if (shouldLog) {
                  logItem.c4 = ret.errorCode || ret.errCode || '';
                  logItem.c5 = ret.traceId || '';
                  logItem.msg = ret.msg || '';
                }

                if (shouldLog || !response.ok || pluginConfig.fullSample) {
                  logItem.c3 = (text || '').length > 2048 ? '[too large]' : text;
                  tracker.log(logItem);
                }
              })
              .then(function () {
                // 接口响应打点
                const endTime = +new Date();
                const logItemTime = {
                  ...logItem,
                  c6: endTime - requestItem.startTime,
                  code: 11,
                  startTime: requestItem.startTime,
                  endTime: endTime
                };
                tracker.log(logItemTime);

                resolve(response);
              }, function (e) {
                // 上报到 Clue
                tracker.logError(e, {
                  pid: 'fsp',
                  code: 12,
                  c4: tracker.pid,
                  c5: args[0]
                });

                resolve(response);
              });
          } catch (e) {
            // 上报到 Clue
            tracker.logError(e, {
              pid: 'fsp',
              code: 12,
              c4: tracker.pid,
              c5: args[0]
            });

            resolve(response);
          }
        });
      });
    }
  }
}
