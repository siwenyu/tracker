var utils = require('./utils/');
var shallowMerge = utils.shallowMerge;
var noop = utils.noop;
var generateIdentifier = utils.generateIdentifier;
var getScreenSize = utils.getScreenSize;
var addEvent = utils.addEvent;
var removeEvent = utils.removeEvent;
var getWin = utils.getWin;
var getSpm = utils.getSpm;
var isError = utils.isError;
var getXPath = utils.getXPath;
var querystring = require('./utils/querystring');
var parseStack = require('./utils/parseStack');
var unifyErrorMsg = utils.unifyErrorMsg;

var win = getWin();

var doc = win.document;
var nav = win.navigator;
var location = win.location;
// hot Patch 是否已经加载
var hotPatchLoaded = false;
var _Tracker = win.Tracker;

var ERROR_TYPE = {
  JS_ERROR: 1
};

var GOLDLOG_URL = '//gm.mmstat.com/';
var HTTP_GOLDLOG_URL = 'http://gm.mmstat.com/';
var HTTPS_GOLDLOG_URL = 'https://gm.mmstat.com/';
var GOLDLOG_ERROR_BASE = 'fsp.1.1';

// 若报错匹配某种规则，就不记录
var DEFAULT_MSG_WHITELIST = null;
var DEFAULT_URL_WHITELIST = null;

// 便于计算从页面加载到问题发生的时间
var start = +(new Date());

// 保存原始的 onerror handler
var onerrorHanddler = win.onerror;

/**
 * A simple frontend logger persisted by goldlog
 *
 * @param  {object} options 初始化 Tracker 时的配置
 */
function Tracker(options) {
  if (!(this instanceof Tracker)) {
    return new Tracker(options);
  }
  options = options || {};
  if (options.hotPatch === true) {
    this._hotPatch();
  }

  if (options.global !== false && typeof win.__trackerOptions === 'object') {
    shallowMerge(options, win.__trackerOptions);
  }

  // 是否将配置项挂在 window 上，方便在另一个地方 new Tracker 时复用
  this.global = options.global == null ? true : !!options.global;
  // 是否进入调试模式，调试模式下会输出更多信息 warning 信息
  this.debug = options.debug || (location && location.search.indexOf('clueTrackerDebug=true') > -1);
  if (this.debug) {
    this._warn('已开启 debug 模式，请勿在生产环境使用');
  }

  // 当前项目 id，必传，用于在前端稳定性平台中区分
  this.pid = options.pid;
  // JS 报错采样率，默认全量采样
  this.sampleRate = options.sampleRate || 1;

  // 获取当前页面 userId，function
  this.uidResolver = options.uidResolver || noop;
  // 记录用户传入配置，不包含 tracker 带有的默认值
  this.userOptions = options;
  // 用户设置必须传入字段，未完成获取之前所有错误将被缓存
  this.requiredFields = options.requiredFields || [];
  // 获取当前页面的前端资源版本号，function，所有引用 dt group 下的项目无需单独配置，其它
  // group 请参考 ./uidResolver.js 传入正则表达式
  this.releaseResolver = options.releaseResolver || noop;
  // 解析 UserAgent，返回「浏览器,操作系统」形式的字符串，如「chrome54,win7」
  this.uaParser = options.uaParser || noop;

  // 打点之前的回调，return false 则取消打点
  this.beforeLog = options.beforeLog || null;
  // 报错信息白名单，正则表达式，当报错信息匹配该表达式时不打点（可以忽略 Script Error 等错误）
  this.msgWhitelist = options.msgWhitelist || options.msgWhiteList || DEFAULT_MSG_WHITELIST;
  // 当前页面 url 白名单，正则表达式，若匹配则不打点
  this.urlWhitelist = options.urlWhitelist || options.urlWhiteList || DEFAULT_URL_WHITELIST;

  // 同一个错误在同一次访问中只打点一次（避免重复报错）
  this.oncePerSession = options.oncePerSession === undefined ? true : options.oncePerSession;
  // 报错打点的同时，是否在 console 中打印相关信息
  this.consoleDisplay = options.consoleDisplay || false;
  // 是否忽略 script error 的配置
  this.ignoreScriptError = options.ignoreScriptError || false;
  // 是否打开资源错误监控
  this.resourceError = options.resourceError === undefined ? true : options.resourceError;
  // 资源错误监控采样率
  this.resourceErrorSampleRate = options.resourceErrorSampleRate || 1;
  // 可手动选择是否使用 sendBeacon 方式发送打点请求，默认开启
  this.useSendBeacon = options.useSendBeacon === undefined ? true : options.useSendBeacon;

  // 白屏检测节点
  this.blankNode = options.blankNode === undefined ? 'app' : options.blankNode;

  // 记录 url 时忽略的参数
  this.ignoredQueries = options.ignoredQueries || [];

  if (this.global) {
    win.__trackerOptions = options;
  }

  // 是否完成了初始化
  this._inited = false;
  // 已报错的集合，同样的错误在一次访问过程中避免打点多次
  this._tracked = [];
  // requiredFields 中字段未设置完整时，缓存错误请求
  this._logWaitingQueue = [];
  // 添加的插件
  this._plugins = options.plugins || [];
  // 鼠标位置
  this._pos = '0,0';
  this._trackMousePos();

  // weex 配置，暂时不下线，兼容，如果 fetchCallBack 不存在，帮助发请求
  this.isWeex = options.isWeex || false;
  this.weexFetch = options.weexFetch;

  // 提供给小程序的回调
  this.fetchCallBack = options.fetchCallBack;

  // @Todo 手动设置非 DOM 环境，暂时写死为 weex 环境必定为非 DOM 环境，后期开放配置
  this.noDOM = this.isWeex;
  // 请求协议
  this.fetchProtocol = options.protocol;

  // 扩展：传入外部打点方法
  if (options.extLogger) {
    this.extLogger = options.extLogger;
  }
}

Tracker.noConflict = function () {
  if (win.Tracker === Tracker) {
    win.Tracker = _Tracker;
  }
  return Tracker;
}

Tracker.prototype = {
  VERSION: '4.3.1',

  /**
   * 通用的打点接口
   * @param  {object} options 需要打点的参数
   *
   * 打点默认所需的数据格式如下：
   *
   * 其中 userId、项目id（pid） 等信息无需每次打点都传，会根据构造函数中传入的配置自动获取。
   *
   * {
   *   code: 1,                     // 错误代码，JS 报错默认为 1，其它代码可以根据业务需要自行定义（需在 fsp 平台中先申请对应的号段） *必选*
   *   msg: 'TypeError: xxx',       // 报错信息 [可选]
   *   sampleRate: 0.05,            // 采样率（非js报错默认采样率为 1，建议根据页面 pv 合理设置） [可选]
   *   c1: 'foo',                   // 自定义字段，最多支持 3 个（即 c1、c2、c3），类型为字符串，最长 512 个字符（utf8）
   *   c2: 'bar',
   *   c3: 'yoo'
   * }
   */
  log: function (msg, options) {
    if (typeof msg === 'object') {
      options = msg;
    } else if (typeof msg === 'string') {
      options = options || {};
      shallowMerge(options, {
        code: 1,
        msg: msg
      });
    }

    this._log(options);
  },

  // alias for Raven
  captureMessage: function (a, b) {
    return this.log(a, b);
  },

  /**
   * 传入一个 Error 对象，进行打点
   * @param  {Error}  err      原生Error对象
   * @param  {Object} options 其它打点配置
   */
  logError: function (err, options) {
    if (!isError(err)) {
      return this.log(err, options);
    }

    options = options || {};
    if (options.c1 || options.c2 || options.c3) {
      this._warn('使用 tracker.logError() 时不可再传入 c1,c2,c3 字段，请求未发送');
      return;
    }

    var item = {};
    var stacks = parseStack(err);
    item.msg = err.toString();
    item.c1 = stacks[0];
    item.c2 = stacks[1];
    item.c3 = stacks[2];

    shallowMerge(item, options);

    this._log(item);
  },

  captureException: function (a, b) {
    return this.logError(a, b);
  }, // alias for Raven

  /**
   * @deprecated 不再默认支持接口异常监控
   * 记录接口请求的快捷接口
   * @param  {string} url       请求url
   * @param  {object} params    请求参数
   * @param  {object} response  服务器端响应
   * @param  {bool}   isTimeout 是否超时
   * @param  {bool}   force     是否忽略采样率，强制写入
   */
  logReq: function () {
    this._warn('logReq() 方法已经废弃，若有需要，请使用自定义打点方式( `tracker.log()` )监控接口错误。');
  },

  /**
   * @deprecated 不再默认支持性能监控
   */
  logPerf: function () {
    this._warn('logPerf() 方法已经废弃，若有需要，请使用自定义打点方式( `tracker.log()` )监控接口错误。');
  },

  /**
   * 配置 Tracker
   * @param  {string} pid        项目ID
   * @param  {object} options    请求参数
   */
  config: function (pid, options) {
    if (typeof pid === 'string') {
      options = options || {};
      options.pid = pid;
    } else {
      options = pid;
    }

    shallowMerge(this, options, true);
    shallowMerge(this.userOptions, options, true);
    if (typeof win.__trackerOptions === 'object') {
      shallowMerge(win.__trackerOptions, options, true);
    }

    if (this._checkRequiredFields()) {
      this._popWaitingQueue();
    }

    return this;
  },

  /**
   * 获取资源异常时的出错的链接信息
   */
  _getResourceErrorSrc: function (target) {
    var src = target.src || target.href;

    // 如果没有src
    if (typeof src === 'undefined') {
      // 是flash的场景
      // 参考：https://perishablepress.com/embed-flash-and-video-via-the-object-tag/
      // 这里不考虑古老的netscape embed支持flash的场景
      var isObjectTag = target.tagName.toLowerCase() === 'object';
      var isFlash = target.getAttribute('classid') === 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' ||
        target.getAttribute('type') === 'application/x-shockwave-flash';

      if (isObjectTag && isFlash) {
        // 认为是flash的cab文件获取失败
        src = target.getAttribute('data') || target.getAttribute('codebase');
      }

      // 再次做一次捕捉，如果还是undefined，直接返回tag内容
      // 以便方便问题定位
      if (typeof src === 'undefined') {
        src = target.outerHTML || target.innerHTML;
      }
    }

    return src;
  },

  /**
   * 开始监听全部报错，以及加载所有的插件
   */
  onGlobalError: function () {
    if (this._plugins.length) {
      while (this._plugins.length > 0) {
        var pluginPair = this._plugins.pop();
        var plugin = pluginPair[0];
        var args = pluginPair[1];

        plugin.apply(this, [this].concat(args));
      }
    }

    this._warn('plugin 已加载');

    if (!doc) {
      this._warn('当前为非 web 环境，不支持报错监听');
      return this;
    }

    var self = this;
    if (this.pid && !this._inited) {
      win.onerror = function (a, b, c, d, e) {
        self._handleError(a, b, c, d, e);
      };
      // 未被 catch 的 promise 错误
      this.unhandledrejectionHandler = function (event) {
        self._console('promise报错');
        self._console(event);
        // https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent/reason
        // reject 也会触发 unhandledrejection，这种情况需要去除
        if (event.reason && event.reason.message) {
          self._handleError(event.reason.message, null, null, null, event.reason);
        }
      }
      addEvent(win, 'unhandledrejection', this.unhandledrejectionHandler);

      // 资源获取监控
      if (this.resourceError) {
        this.resourceErrorHandler = function (event) {
          self._console('资源获取监控报错');
          // 对于非资源获取问题，不进行处理
          if (!event.target.tagName || event.message || event.filename || event.lineno || event.colno) {
            return;
          }
          // <link ref="preload" href="" as="image"> 方式引入
          var src = self._getResourceErrorSrc(event.target);
          var tagName = event.target.tagName.toLowerCase();
          self._log({
            // 资源加载错误 code
            code: 4,
            sampleRate: self.resourceErrorSampleRate,
            msg: src + ' 获取失败',
            c1: tagName,
            c2: getXPath(event.target, 5)
          });
        }

        // 注意资源异常捕获只发生在capture阶段
        addEvent(win, 'error', this.resourceErrorHandler, true);
      }

      this._inited = true;
      this._warn('onGlobalError 已开启');
    }
    return this;
  },

  install: function () {
    // alias for Raven
    return this.onGlobalError();
  },

  /**
   * 移除所有的监听事件并重置状态
   */
  offGlobalError: function () {
    this._plugins = [];

    if (!doc) {
      this._warn('当前为非 web 环境，不支持监听事件移除与状态重置');
      return this;
    }

    win.onerror = onerrorHanddler;
    removeEvent(win, 'unhandledrejection', this.unhandledrejectionHandler);

    if (this.resourceError) {
      removeEvent(win, 'error', this.resourceErrorHandler, true);
    }

    this._inited = false;
    this._tracked = [];

    this._warn('onGlobalError 已关闭');
    return this;
  },

  uninstall: function () {
    return this.offGlobalError(); // alias for Raven
  },

  addPlugin: function (plugin) {
    var args = [].slice.call(arguments, 1);

    if (typeof plugin === 'function' && this._inited) {
      plugin.apply(this, [this].concat(args));
    } else {
      this._plugins.push([plugin, args]);
    }

    return this;
  },

  _handleError: function (msg, file, line, column, error) {
    if (onerrorHanddler) {
      try {
        onerrorHanddler.call(this, msg, file, line, column, error);
      } catch (err) {
        // just don't break my code
      }
    }

    file = file || '-';
    line = line || '-';
    column = column || '-';

    msg = unifyErrorMsg(msg);

    var item = {
      msg: msg,
      code: ERROR_TYPE.JS_ERROR
    };

    // tracker 层忽略 Script Error
    if (this.ignoreScriptError && msg === 'Script error') {
      return;
    }

    /**
     * 检测是否白屏
     * 关键节点，默认#app
     */
    let isBlankError = false;
    const keyNode = this._getElementById(this.blankNode);
    if (keyNode && (keyNode.childNodes && keyNode.childNodes.length < 1)) {
      isBlankError = true;
    }

    // 强制 10% 的概率采样 stack，采集太多浪费存储
    // 若是手动设置了采样率为 1 的项目，则全部记录栈
    // 白屏情况下全部处理
    if (error != null && (this.sampleRate === 1 || Math.random() < 0.1) || isBlankError) {
      var stacks = parseStack(error);
      item.c1 = stacks[0];
      item.c2 = stacks[1];
      item.c3 = stacks[2];
    }

    this._log(item);

    // 发送白屏日志
    if (isBlankError) {
      Object.assign(item, { code: 13 });
      this._log(item);
    }
  },

  _handleMouseDown: function (event) {
    var docEl = doc && doc.documentElement;
    if (!docEl || !doc.body) {
      return;
    }

    // y 坐标比较简单，一般不存在不同分辨率导致坐标不同的问题（暂时不考虑完全响应式的网站）
    var y = Math.round(
      event.pageY || event.clientY + doc.body.scrollTop + docEl.scrollTop
    );
    var x = Math.round(
      event.pageX || event.clientX + doc.body.scrollLeft + docEl.scrollLeft
    );

    // 计算 x 坐标首先考虑以文档宽度的中心定点为 (0, 0) 原点

    // 整个文档宽度（含滚动条）
    var documentWidth = Math.max(
      docEl.clientWidth,
      docEl.offsetWidth,
      docEl.scrollWidth
    );
    x = x - documentWidth / 2;

    this._pos = String(x) + ',' + String(y);
  },

  /**
   * 监听鼠标点击事件，记录最后一次点击位置
   */
  _trackMousePos: function () {
    var docEl = doc && doc.documentElement;
    var self = this;

    if (docEl) {
      addEvent(doc, 'mousedown', function (event) {
        self._handleMouseDown(event);
      });
    }
  },

  getFetchProtocol: function () {
    if (this.fetchProtocol === 'http') {
      return HTTP_GOLDLOG_URL;
    } else if (this.fetchProtocol === 'https') {
      return HTTPS_GOLDLOG_URL;
    } else if (win && doc && !this.noDOM && win.location.protocol === 'file:') {
      return HTTP_GOLDLOG_URL;
    }
    return GOLDLOG_URL;
  },

  /**
   * 发送打点请求的方法
   */
  _postData: function (options) {
    // 扩展：进行外部埋点
    try {
      if (this.extLogger) {
        this.extLogger(options);
      }
    } catch (error) {
      // nothing
    }

    var usePost = this.useSendBeacon && !!(win.navigator && win.navigator.sendBeacon && win.Blob);

    var url = this.getFetchProtocol() + (options.base || GOLDLOG_ERROR_BASE);

    this._warn('当前打点参数', options);

    var data = querystring.stringify(options, [
      'code',
      'base',
      'sampleRate',
      'oncePerSession'
    ], usePost);

    if (this.isWeex && this.weexFetch && this.weexFetch.fetch) {
      if (this.fetchCallBack) {
        this.fetchCallBack(url + '?' + data);
        this._warn('当前已使用 fetchCallBack ', url + '?' + data);
      } else {
        // weex 端采用专门的 fetch 进行发送
        try {
          this.weexFetch.fetch({
            method: 'GET',
            type: 'json',
            url: url + '?' + data
          });
          this._warn('weex 打点请求已发出', url + '?' + data);
        } catch (e) {
          this._warn('weex fetch 发送打点请求失败');
        }
      }
    } else if (this.fetchCallBack) {
      this.fetchCallBack(url + '?' + data);
      this._warn('当前已使用 fetchCallBack ', url + '?' + data);
    } else if (usePost) {
      try {
        win.navigator.sendBeacon(
          url,
          JSON.stringify({
            gmkey: 'OTHER',
            gokey: data,
            logtype: '2'
          })
        );
        this._warn('sendBeacon 打点请求已发出', {
          gmkey: 'OTHER',
          gokey: data,
          logtype: '2'
        });
      } catch (e) {
        // 若打点失败，则尝试用 GET
        data = querystring.stringify(options, [
          'code',
          'base',
          'sampleRate',
          'oncePerSession'
        ], false);

        // 防止非 web 环境报错
        if (win && doc && !this.noDOM) {
          var img = new Image();
          img.src = url + '?' + data;
          this._warn('打点请求已发出', img.src);
        } else {
          this._warn('当前非 web 环境，发送异常信息失败');
        }
      }
    } else {
      // 防止非 web 环境报错
      if (win && doc && !this.noDOM) {
        var imgObj = new Image();
        imgObj.src = url + '?' + data;
        this._warn('打点请求已发出', imgObj.src);
      } else {
        this._warn('当前非 web 环境，发送异常信息失败');
      }
    }
  },

  /**
   * 实际发送请求的方法
   * @param {object} options 打点相关的数据
   */
  _log: function (options) {
    // 在 _enhanceOpitons，_warn 中会进行判断，这里不需要统一处理
    // if (!doc) {
    //  this._warn('当前 window 对象不存在');
    //  return this;
    // }
    options = options || {};

    // 定义type，业务无意义，数据处理需要
    if (options.code) {
      options.type = options.code;
    } else {
      options.type = 1;
    }

    // 只对 js 错误采样，自定义打点默认不采样，除非在打点请求中显式传入 sampleRate
    if (
      options.type === ERROR_TYPE.JS_ERROR &&
      Math.random() > (options.sampleRate || this.sampleRate)
    ) {
      this._warn('当前已设置采样率' + (options.sampleRate || this.sampleRate) + '，未被采集');
      return;
    }

    if (options.sampleRate != null && Math.random() > options.sampleRate) {
      this._warn('当前已设置采样率' + (options.sampleRate || this.sampleRate) + '，未被采集');
      return;
    }

    options = this._enhanceOpitons(options);
    if (!options.pid) {
      this._warn('未配置 pid，请求未发送');
      return;
    }

    var id = generateIdentifier(options);
    var trackedFlag = false;

    for (var i = 0; i < this._tracked.length; i++) {
      if (this._tracked[i] === id) {
        trackedFlag = true;
        break;
      }
    }

    var finalOncePerSession =
      options.oncePerSession == null
        ? this.oncePerSession
        : options.oncePerSession;
    if (finalOncePerSession && trackedFlag) {
      this._warn('当前由于 OncePerSession 策略，未被采集');
      return;
    }

    if (this.msgWhitelist && this.msgWhitelist.exec(options.msg) !== null) {
      this._warn('当前由于 msgWhitelist 过滤，未被采集');
      return;
    }

    if (this.urlWhitelist && this.urlWhitelist.exec(options.page) !== null) {
      this._warn('当前由于 urlWhitelist 过滤，未被采集');
      return;
    }

    if (typeof this.beforeLog === 'function') {
      var ret;
      try {
        ret = this.beforeLog(options);
      } catch (e) {
        // do nothing
      }

      if (ret === false) {
        this._warn('当前由于 beforeLog 返回 false，未被采集');
        return;
      } else if (typeof ret === 'object') {
        options = ret;
      }
    }

    this._tracked.push(id);

    if (this.consoleDisplay) {
      this._warn(options.msg);
    }

    if (!this._checkRequiredFields()) {
      this._pushWaitingQueue(options);
      this._warn('当前由于 requiredFields 未设置完成，打点请求被暂时缓存');
      return;
    }

    this._postData(options);
  },

  /**
   * 检查 requiredFields 字段是否已经完整
   */
  _checkRequiredFields: function () {
    for (var i = 0; i < this.requiredFields.length; i++) {
      var key = this.requiredFields[i];
      if (this.userOptions[key] === undefined) {
        return false;
      }
    }
    return true;
  },

  /**
   * 当 requiredFields 中设置字段均到位时，发送 _logWaitingQueue 中的内容并清空
   */
  _popWaitingQueue: function () {
    var self = this;
    if (this._logWaitingQueue && this._logWaitingQueue.length) {
      for (var i = 0; i < this._logWaitingQueue.length; i++) {
        var options = this._logWaitingQueue[i];
        shallowMerge(options, self._enhanceOpitonsByUser(self.userOptions), true);
        self._postData(options);
      }
    }
    this._logWaitingQueue = [];
    return;
  },

  /**
   * 缓存相应 options
   */
  _pushWaitingQueue: function (options) {
    this._logWaitingQueue.push(options);
  },

  /**
   * 用户传入配置信息采集
   * @param  {object} options 原始打点参数
   * @return {object}
   */
  _enhanceOpitonsByUser: function (options) {
    // 当前 userId
    if (!options.uid) {
      options.uid = this.uidResolver();
    }

    // 当前项目 id
    if (!options.pid) {
      options.pid = this.pid;
    }

    // 当前前端资源版本
    if (!options.rel) {
      options.rel = this.releaseResolver();
    }

    // 当前 userAgent
    if (!options.ua) {
      options.ua = this.uaParser(nav ? nav.userAgent : '');
    }

    return options;
  },

  /**
   * 通用打点信息采集
   * @param  {object} options 原始打点参数
   * @return {object}
   */
  _enhanceOpitonsCommon: function (options) {
    options = this._enhanceOpitonsByUser(options);

    // 从加载到问题发生的时间（s）
    options.delay = parseFloat(((+new Date() - start) / 1000).toFixed(2));

    // 记录 tracker 版本, TV : Tracker Version
    options.tracker_ver = this.VERSION;
    options.patch_ver = this.PATCH_VERSION || '-';

    return options;
  },

  /**
   * Web 环境信息采集
   * @param  {object} options 原始打点参数
   * @return {object}
   */
  _enhanceOpitonsDOM: function (options) {
    if (!doc) {
      return options;
    }

    // 错误发生页面地址（不含 query 及 hash）
    if (!options.page) {
      options.page = win.location.href.split('?')[0];
    }

    // 页面地址的 query
    if (!options.query) {
      options.query = querystring.stringify(
        querystring.parse(window.location.search),
        options.ignoredQueries
      );
    }

    // 页面地址的 hash
    if (!options.hash) {
      options.hash = window.location.hash;
    }

    // 页面地址的 title
    if (!options.title) {
      options.title = doc.title;
    }

    // 页面地址的 spm_a
    if (!options.spm_a) {
      options.spm_a = getSpm().a;
    }

    // 页面地址的 spm_b
    if (!options.spm_b) {
      options.spm_b = getSpm().b;
    }

    // 当前页面分辨率
    if (!options.scr) {
      options.scr = getScreenSize();
    }

    options.raw_ua = nav ? nav.userAgent : '';

    // referrer
    var referrerParts = (doc.referrer || '').split('?');
    var referrerPathname = referrerParts[0];
    var referrerQuery =
      referrerParts.length === 2
        ? querystring.stringify(
          querystring.parse(referrerParts[1]),
          options.ignoredQueries
        )
        : '';

    if (referrerParts.length === 2 && referrerQuery.length > 0) {
      options.referrer = referrerPathname + '?' + referrerQuery;
    } else {
      options.referrer = referrerPathname;
    }

    options.last_pos = this._pos;

    return options;
  },

  /**
   * 补全打点参数中缺失的部分
   * @param  {object} options 原始打点参数
   * @return {object}
   */
  _enhanceOpitons: function (options) {
    options = this._enhanceOpitonsCommon(options);
    options = this._enhanceOpitonsDOM(options);
    return options;
  },

  _warn: function () {
    if (
      typeof win === 'object' &&
      win.console &&
      typeof win.console.warn === 'function' &&
      this.debug
    ) {
      var params = Array.prototype.slice.call(arguments);
      win.console.warn.apply(null, ['[Tracker Debug] ' + params[0]].concat(params.slice(1)));
    }
  },

  _console: function () {
    if (
      typeof win === 'object' &&
      win.console &&
      typeof win.console.log === 'function' &&
      this.debug
    ) {
      var params = Array.prototype.slice.call(arguments);
      win.console.log.apply(null, [JSON.stringify(params)]);
    }
  },
  _getElementById: function (id) {
    if (
      typeof doc === 'object' &&
      doc.getElementById &&
      typeof doc.getElementById === 'function' &&
      this.debug
    ) {
      return doc.getElementById(id);
    }
  },

  /**
   * ------------------
   * Hot Patch start
   * ------------------
   */
  _hotPatch: function () {
    var cacheKey = '__tracker_patch__';

    /* istanbul ignore if */
    if (win && doc && !this.noDOM) {
      // tracker-patch 不重复加载
      if (hotPatchLoaded && win.__trackerPatch) {
        return;
      }
      hotPatchLoaded = true;
      // 不支持 localStorage 的浏览器每次加载，有 localStraoge 的每 12 小时更换一次 queryFlag
      var queryFlag = Math.random();
      if (win.localStorage && win.localStorage.getItem) {
        var lastPatch = win.localStorage.getItem(cacheKey);
        var now = +new Date();
        if (lastPatch && now - parseInt(lastPatch, 10) < 1000 * 60 * 60 * 12) {
          queryFlag = lastPatch;
        } else {
          queryFlag = now;
          try {
            win.localStorage.setItem(cacheKey, now);
          } catch (e) {
            // 修复 safari 隐私模式下 localStorage 调用会出错
          }
        }
      }

      var script = doc.createElement('script');
      script.src = '//g.alicdn.com/fsp/tracker-patch/index.js?' + queryFlag;
      script.async = true;
      script.crossOrigin = true;
      script.id = 'tracker-patch';
      (doc.head || doc.body).appendChild(script);

      var self = this;
      win.__trackerPatch = function () {
        return self;
      };
    }
    // Hot Patch end
  }
};

module.exports = Tracker;
