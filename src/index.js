const UAParser = require('ua-parser-js');
const { v4: uuidv4 } = require('uuid');
const Tracker = require('./Tracker');
// const InterfacePlugin = require('./plugins/Interface/index');
const PerformancePlugin = require('./plugins/Performance/index');
const ScriptAes = require('./plugins/Aes/index');
const AESPluginEvent = require('./plugins/Aes/aesEvent');
// import AESPluginEvent from "@ali/aes-tracker-event";
const { addEvent, getUserNickByHavana, getUserNickByBuc, getUserIdByBuc, getUserIdByHavana } = require('./utils');

const getAppcodeFromHash = require('./constants/ufHashMap');

(function (win, doc) {
  let objectName = win.uttName || 'UTT';
  let oldObject = win[objectName];
  if (oldObject && oldObject.defined) {
    return;
  }

  // 全局参数
  // 是否关闭页面
  let closing = false;

  // 全局配置
  let config = {};

  // 最后一次鼠标活跃时间
  let loseTimeStart;

  // 页面失活时间和
  let loseAllTime = 0;

  // 页面活跃是否活跃
  let isClickActive = true;

  // 最后一次失活时间
  let loseTimeEnd = 0;

  // 检测页面活跃度的定时器
  let activeTimer = null;

  // 窗口active的时间点
  let tabToShowTime = +new Date();

  // 窗口隐藏的时间点，初始化
  let tabToHideTime = 0;

  // 窗口是否隐藏
  let isTabShow = true;

  // 默认配置项
  const defaultConfig = {
    version: '0.0.15',
    debug: false,
    performance: true,
    error: true,
    stat: true,
    checkTick: 1000,
    activeDuration: 30 * 60 * 1000,
    // activeDuration: 10000,
    heartDuration: 30 * 60 * 1000,
    // heartDuration: 1000,
    hash: true,
    isUf: /^uf/.test(doc.domain || ''), // isUf 是记录当前是否 uniface 子应用的。因为 uniface 是个微前端框架。每个子应用要单独采集统计
    startTime: +new Date(), // 开始时间
    pv_id: uuidv4() || 'uuidv4_fail',
    user_type: '14' // 账号体系，默认BUC
  }

  /**
   * aplus上报
   */
  let LOG_KEY = '/cro-xt.utt-platform.log';
  const LOG_CHECKSUM = 'H1452866325';
  const LOG_TYPE = 'OTHER';
  const LOG_URL = '//gm.mmstat.com';

  if (!win.uttConfig) {
    config = defaultConfig;
  } else {
    for (let i in defaultConfig) {
      if (win.uttConfig[i] === undefined) {
        config[i] = defaultConfig[i];
      } else {
        config[i] = win.uttConfig[i];
      }
    }

    for (let k in win.uttConfig) {
      if (defaultConfig[k] === undefined) {
        config[k] = win.uttConfig[k];
      }
    }
  }

  /**
   * 测试期间打印配置
   */
  console.log('测试期间config');
  console.log(config);

  /**
   * 初始化USER_ID
   */
  let USER_ID = (function () {
    if (parseInt(config.user_type, 10) === 14) {
      // BUC
      return getUserIdByBuc(win, doc);
    } else if (parseInt(config.user_type, 10) === 0) {
      // havana
      return getUserIdByHavana(doc);
    }
  })();

  /**
   * 初始化USER_NICK
   */
  let USER_NICK = (function () {
    if (parseInt(config.user_type, 10) === 14) {
      // BUC
      return getUserNickByBuc(win, USER_ID);
    } else if (parseInt(config.user_type, 10) === 0) {
      // havana
      return getUserNickByHavana(doc);
    }
  })();

  /**
   * 初始化appcode，如果uttConfig提供了配置，直接使用；没有配置，根据hash获取
   */
  let appCode = getAppcode(win.location.hash);

  /**
   * 初始化 clue tracker
   */
  const clueOptions = {
    pid: getCurrentPid(),
    debug: config.debug || false,
    extLogger: sendClue,
    resourceError: true,
    sampleRate: config.errorSampleRate,
    blankNode: config.blankNode  // 白屏节点
  };
  // clueOptions.plugins = [[InterfacePlugin, [1, null, true]], [PerformancePlugin]];
  clueOptions.plugins = [[PerformancePlugin]];
  const clueTracker = new Tracker(clueOptions);
  clueTracker.install();

  // 全局数据
  let times = {

  };

  function getCurrentPid(code) {
    if (isOnline()) {
      return `mtutt-${code || appCode}`;
    }
    return `pre-mtutt-${code || appCode}`;
  }

  /**
   * 初始化AES上报
   */
  function initAes() {
    const aesOptions = {
      pid: getCurrentPid(),
      debug: config.debug || false,
      user_type: '14', // BUC
      uid: USER_ID,
      username: USER_NICK
    };
    ScriptAes(aesOptions);
  }

  // 检查环境发送数据到预发
  if (!isOnline()) {
    LOG_KEY = '/cro-xt.utt-platform.pre-log';
  }

  /**
   * 处理入口
   *
   * @param {Object} cfg 配置项
   */
  function entry(cfg) {
    for (let key in cfg) {
      if (config[key] !== undefined) {
        config[key] = cfg[key];
      }
    }

    return {
      init: init,
      times: times,
      defined: true,
      send: send,
      sendEvent: sendEvent,
      clueTracker: clueTracker
    }
  }

  /**
   * 判断环境
   *
   */
  function domainTest() {
    let domain = document.domain || '';
    if (config.isUf) {
      if (/daily/.test(win.GlobalConfig.domain.UTT)) {
        return 'daily';
      }

      if (/pre/.test(win.GlobalConfig.domain.UTT)) {
        return 'pre';
      }

      if (/online/.test(win.GlobalConfig.domain.UTT)) {
        return 'prod';
      }
    } else {
      if (/daily/.test(domain)) {
        return 'daily';
      }

      if (/pre/.test(domain)) {
        return 'pre';
      }

      return 'prod';
    }

    return 'daily';
  }


  function isOnline() {
    if (config.env) {
      if (config.env !== 'prod' && config.env !== 'online') {
        return false;
      }
    } else {
      if (domainTest() !== 'prod') {
        return false;
      }
    }

    return true;
  }

  /**
   * 检测USER_NICK获取情况
   */
  function checkUserNick() {
    if (!USER_NICK) {
      const data = {
        actionType: 'noNserNicK'
      };
      send(data);
    }
  }

  /**
   * PV接口
   *
   */
  function getStat() {
    let data = {
      viewStart: 1,
      actionType: 'viewStart'
    }

    send(data);

    let trans = {
      // from: 'outer',
      c1: 'outer',
      // to: appCode,
      c2: appCode,
      actionType: 'trans'
    }

    send(trans);

    addEvent(win, 'beforeunload', (event) => unloadHandler(appCode, 'outer', event.target.location.href));
  }

  // 计算过滤
  // 时间相减，保证n1 > n2 并且 n1 -n2 < all
  function checkNumCp(num1, num2, all) {
    if (num1 > num2 && all > num1 - num2 && num2 > 0) {
      return true;
    }
    return false;
  }


  /**
   * 从浏览器接口获取页面性能数据
   *
   */
  // function getPerformance() {
  //   if (!win.performance || !win.performance.timing) {
  //     return;
  //   }

  //   let t = win.performance.timing;

  //   if (t.loadEventEnd <= 0) {
  //     setTimeout(getPerformance, 500);
  //     return;
  //   }

  //   let datas = {
  //     rrt: ['responseStart', 'requestStart'], // 整个网络请求时间（不包括unload）
  //     dns: ['domainLookupEnd', 'domainLookupStart'], // dns lookup
  //     cnt: ['connectEnd', 'connectStart'], // 建立 tcp 时间
  //     ntw: ['responseStart', 'fetchStart'], // network time
  //     dct: ['domContentLoadedEventStart', 'responseStart'], // dom content loaded time
  //     flt: ['loadEventStart', 'responseStart'], // full load time 页面完全加载时间
  //     loadPage: ['loadEventEnd', 'navigationStart'],
  //     domReady: ['domComplete', 'responseEnd'],
  //     ttfb: ['responseStart', 'navigationStart'],
  //     getResponse: ['responseEnd', 'requestStart'],
  //     loadEvent: ['loadEventEnd', 'loadEventStart']
  //   };

  //   for (let name in datas) {
  //     let start = t[datas[name][1]];
  //     let end = t[datas[name][0]];

  //     // 脏数据过滤: 部分浏览器,特别是移动端(如UC,windvane容器)某些时间点可能返回0或者null,排除掉此部分
  //     if (start && end) {
  //       let cost = end - start;

  //       // 脏数据过滤: 耗时大于0并且小于1天(1e3 * 3600 * 24)
  //       if (cost >= 0 && cost < 86400000) {
  //         times[name] = cost;
  //       }
  //     }
  //   }

  //   // 首屏时间
  //   if (win.chrome && win.chrome.loadTimes) {
  //     times.firstPaint = (win.chrome.loadTimes().firstPaintTime * 1000 - t.navigationStart > 0)
  //     ? (win.chrome.loadTimes().firstPaintTime * 1000 - t.navigationStart)
  //     : 0;
  //   }

  //   times.url = win.location.href;
  //   times.timeStamp = +new Date();
  //   times.actionType = 'performance';

  //   send(times);
  // }


  /**
   * URL分析
   *
   */
  function parseURL(url) {
    let div = document.createElement('div');
    let parser;
    div.innerHTML = '<a></a>';
    div.firstChild.href = url;
    div.innerHTML = div.innerHTML;
    parser = div.firstChild;
    parser.href = div.firstChild.href;

    return {
      protocol: parser.protocol,
      host: parser.host,
      hostname: parser.hostname,
      port: parser.port,
      pathname: parser.pathname.substr(0, 1) === '/' ? parser.pathname : '/' + parser.pathname, // ie 的 pathname 不兼容
      search: parser.search,
      hash: parser.hash,
      original: parser.href
    };
  }

  /**
   * 根据HASH拆解AppCode
   * #/way/analysis
   */
  function getAppcode(hash) {
    if (config.isUf) {
      const ufAppcode = getAppcodeFromHash(hash);
      if (ufAppcode) {
        return ufAppcode;
      } else {
        const data = {
          // isUf: true,
          c1: true,
          // getAppcode: false,
          c2: false,
          actionType: 'ufAppcodeError'
        }
        // 发送uf标识，但是没有获取到appcode
        send(data);

        return 'unknown';
      }
    } else {
      return getNormalAppCode(hash);
    }
  }

  /**
   * 非uniface根据hash获取appcode
   */
  function getNormalAppCode(hash) {
    if (config.appCode) {
      return config.appCode;
    } else {
      let matched = hash.match(/#\/([0-z_-]+).*/);
      if (matched) {
        return matched[1];
      }
    }

    const data = {
      // isUf: false,
      c1: false,
      // getAppcode: false,
      c2: false,
      actionType: 'normalAppcodeError'
    }
    // 发送uf标识，但是没有获取到appcode
    send(data);
    return 'unknown';
  }

  /**
   * Hash监听变化
   *
   */
  function hookHash() {
    if ('onhashchange' in win) {
      addEvent(win, 'hashchange', function (event) {
        const {
          newURL,
          oldURL
        } = event;
        const {
          newHash,
          oldHash
        } = {
          newHash: parseURL(newURL).hash,
          oldHash: parseURL(oldURL).hash
        };
        const {
          newAppCode,
          oldAppCode
        } = {
          newAppCode: getAppcode(newHash) || appCode,
          oldAppCode: getAppcode(oldHash) || appCode
        };

        if (appCode !== newAppCode.trim()) {
          console.log(`[MTUTT] appCode changed from ${appCode} to ${newAppCode}`);

          // 切换 clue tracker 的 pid
          clueTracker.config({
            pid: getCurrentPid(newAppCode)
          });

          // app切换
          unloadHandler(oldAppCode, newAppCode, event.oldURL);

          appCode = newAppCode;
        }
      });
    }
  }

  /**
   * visibilityChange 监听当前页面tab切换，缩放
   * @param {*} errorMessage
   */
  function visibilityChange() {
    // 每次切换记录时间
    if (doc.visibilityState === 'hidden' && isTabShow) {
      // 隐藏
      tabToHideTime = +new Date();
      isTabShow = false;
      // 窗口失活时打点
      const timePoint = {
        actionType: 'hideTabStart',
        // isTabShow: isTabShow,
        c1: isTabShow,
        // visibilityState: doc.visibilityState,
        c2: doc.visibilityState
      }
      send(timePoint);

      // 停止心跳
      stopHeart();
      stopClickActive();
      return;
    } else if (doc.visibilityState === 'visible' && !isTabShow) {
      tabToShowTime = +new Date();
      const isNormal = checkNumCp(tabToShowTime, tabToHideTime, tabToShowTime - config.startTime);
      if (isNormal) {
        loseAllTime += tabToShowTime - tabToHideTime;
      }
      isTabShow = true;
      // 窗口激活时打点
      const timePoint = {
        actionType: 'showTabStart',
        // isTabShow: isTabShow,
        c1: isTabShow,
        // visibilityState: doc.visibilityState,
        c2: doc.visibilityState
      }
      send(timePoint);

      // 初始化鼠标活跃
      startClickActive();
      return;
    } else {
      // 多余操作
    }

    // tab操作异常情况
    const timePoint = {
      actionType: 'unknowTabOption',
      // isTabShow: 'isTabShow',
      c1: isTabShow,
      // visibilityState: doc.visibilityState,
      c2: doc.visibilityState
    }
    send(timePoint);
  }

  /**
   * 心跳发送
   * 开始心跳时机：init，hashChangeInit，tab激活，鼠标激活；
   */
  let heartTimer = null;
  function startHeart() {
    if (heartTimer) {
      clearInterval(heartTimer);
    }
    heartTimer = setInterval(() => {
      const heartData = {
        actionType: 'heartBeat'
      };
      send(heartData);
    }, config.heartDuration);
  };

  /**
   * 心跳发送
   * 结束心跳时机：tab失活，鼠标失活；
   */
  function stopHeart() {
    if (heartTimer) {
      clearInterval(heartTimer);
      heartTimer = null;
    }
    const loseHeartData = {
      actionType: 'loseHeartBeat'
    };
    send(loseHeartData);
  };

  /**
   * initActiveTime 监听当前页面是否活跃
   * case：
   * 1. 进入直接不操作；
   * 2. 进入操作间隔一段时间又操作；
   * 3. 进入操作之后，一直不操作，然后关闭了。
   * 4. 心跳日志
   */
  function startClickActive() {
    // 活跃状态计算
    if (isClickActive) {
      if (activeTimer !== null) {
        clearTimeout(activeTimer);
      }
    } else {
      isClickActive = true;
      loseTimeEnd = +new Date();
      const isNormal = checkNumCp(loseTimeEnd, loseTimeStart, loseTimeEnd - config.startTime);
      if (isNormal) {
        loseAllTime += (loseTimeEnd - loseTimeStart);
      } else {
        // 用户活跃时长异常
        const timePoint = {
          actionType: 'initActiveTimeError',
          // loseTimeEnd: loseTimeEnd,
          c1: loseTimeEnd,
          // loseTimeStart: loseTimeStart,
          c2: loseTimeStart
        }
        send(timePoint);
      }
      // 鼠标由失活变为活跃，打点
      const timePoint = {
        actionType: 'activeStart'
      }
      send(timePoint);

      // 重新记录心跳
      startHeart();
    }

    activeTimer = setTimeout(() => {
      loseTimeStart = +new Date();
      isClickActive = false;
      // 停止心跳
      stopHeart();
      // 鼠标失活时打点
      const timePoint = {
        actionType: 'loseActiveStart'
      }
      send(timePoint);
    }, config.activeDuration);
  }

  /**
   * 停止鼠标活跃
   */
  function stopClickActive() {
    if (activeTimer !== null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    // 鼠标状态
    isClickActive = false;
  }

  /**
   * 关闭页面前的处理
   *
   */
  function unloadHandler(oldAppCode, newAppCode, oldUrl) {
    if (closing) {
      return;
    }
    closing = true;
    const nowTime = +new Date();

    if (isClickActive && !isTabShow) {
      // tab离开页面30分钟之内关闭
      loseAllTime += (checkNumCp(nowTime, tabToHideTime, nowTime - config.startTime) ? nowTime - tabToHideTime : 0);
    } else if (!isClickActive && isTabShow) {
      // tab未离开，鼠标30分钟未操作
      if (nowTime - loseTimeStart > config.activeDuration) {
        const isNormal = checkNumCp(nowTime, loseTimeStart, nowTime - config.startTime);
        if (isNormal) {
          loseAllTime += checkNumCp(nowTime - loseTimeStart, config.activeDuration, nowTime - config.startTime)
            ? (nowTime - loseTimeStart - config.activeDuration)
            : 0;
        }
      }
    } else if (!isClickActive && !isTabShow) {
      // tab离开，鼠标30分钟未操作；取最后一次tab时间
      loseAllTime += (checkNumCp(nowTime, tabToHideTime, nowTime - config.startTime) ? nowTime - tabToHideTime : 0);
    } else {
      // 如果关闭的时候页面tab未来开，鼠标活跃
    }

    // allTime：总时间
    // vaildTime: 有效时间
    // 旧appcode结束
    let data = {
      viewEnd: 1,
      // allTime: nowTime - config.startTime,
      c1: nowTime - config.startTime,
      // vaildTime: nowTime - config.startTime - loseAllTime,
      c2: nowTime - config.startTime - loseAllTime,
      appCode: oldAppCode || appCode,
      actionType: 'viewEnd',
      oldUrl: oldUrl
    }

    send(data);

    // 页面流转
    let trans = {
      // from: oldAppCode || appCode,
      c1: oldAppCode || appCode,
      // to: newAppCode || 'outer',
      c2: newAppCode || 'outer',
      actionType: 'trans',
      oldUrl: oldUrl
    }
    send(trans);

    // 如果是插拔式uniface hashchange触发
    if (newAppCode && newAppCode !== 'outer') {
      // 新appcode开始
      data = {
        viewStart: 1,
        appCode: newAppCode,
        actionType: 'viewStart'
      };
      send(data);

      // 初始化全局状态值
      setTimeout(() => {
        hashChangeInit();
      }, 100);
    }

    // 关闭timer
    stopClickActive();
    stopHeart();
  }

  /*
   * 手动发送数据
   *
   */
  function send(object) {
    let data = {};
    data.userId = USER_ID;
    data.userNick = USER_NICK;
    data.appCode = object.appCode || appCode;
    data.timeStamp = data.timeStamp || +new Date();

    // url信息
    const urlObj = parseURL(object.oldUrl || win.location.href);
    data.page = urlObj.original;
    data.query = urlObj.search;
    data.hash = urlObj.hash;

    // 用户类型
    data.user_type = config.user_type;
    // 部分pv_id为空
    if (!config.pv_id) {
      data.actionType = 'pv_id_null';
    } else if (config.pv_id === 'uuidv4_fail') {
      data.actionType = 'uuidv4_fail';
    } else {
      data.pv_id = config.pv_id;
    }

    Object.assign(data, object);
    sendRaw(data);
  }

  function sendClue(object) {
    const data = {
      trackSource: 'clue'
    };
    Object.assign(data, object);

    send(data, true);
  }

  /**
   *
   * @param {string} actionCode 业务方自定义action
   * @param {array} dims 任务维度
   * @param {object} params 其他参数
   */
  function sendEvent(actionCode, dims, params) {
    if (!actionCode) return;
    const eventObj = {};
    if (actionCode) {
      eventObj.c1 = actionCode;
    }

    if (dims) {
      if (dims instanceof String) {
        eventObj.dim1 = dims;
      } else if (dims instanceof Array) {
        dims.forEach((e, index) => {
          eventObj[`dim${index + 1}`] = e;
        })
      }
    }

    if (params) {
      if (params instanceof String) {
        eventObj.c2 = params;
      } else {
        eventObj.c2 = encodeURIComponent(JSON.stringify(params));
      }
    }

    send(eventObj);

    // aes插件上报
    eventObj.et = 'OTHER';
    AESPluginEvent(actionCode, eventObj);
  }

  /*
   * 待发送数据的编码
   *
   */
  function encode(data, level) {
    return Object.keys(data).filter(function (key) {
      let value = data[key];
      if (typeof value === 'function') return false;
      return true;
    }).map(function (key) {
      let value = data[key];
      if (typeof value === 'object') value = JSON.stringify(value);
      return key + '=' + encodeURIComponent(value);
    }).join('&');
  }

  /*
   * 发送数据的底层方法
   *
   */
  function sendRaw(data) {
    const { debug } = config;
    let gokey = encode(data, 1);
    const localLogKey = `send-${Date.now()}`;

    if (debug) { win.localStorage.setItem(`${localLogKey}-start`, JSON.stringify(data)); }

    if (win.goldlog && win.goldlog.record) {
      win.goldlog.record(LOG_KEY, LOG_KEY, gokey, 'POST');
      if (debug) win.localStorage.setItem(`${localLogKey}-end`, 'goldlog');
    } else {
      (window.goldlog_queue || (window.goldlog_queue = [])).push({
        action: 'goldlog.record',
        arguments: [LOG_KEY, LOG_KEY, gokey, 'POST']
      });
    }
  }

  /*
   * 发送数据的兜底方法
   *
   */
  function sendBackup(data) {
    let gokey = encode(data, 1);
    let img = new Image();
    let imgId = '_img_' + Math.random();
    win[imgId] = img;
    img.onload = img.onerror = function () {
      win[imgId] = null;
    };
    img.src = LOG_URL + LOG_KEY +
      '?cache=' + Date.now() +
      '&chksum=' + LOG_CHECKSUM +
      '&gmkey=' + LOG_TYPE +
      '&gokey=' + encodeURIComponent(gokey);
    img = null;
  }

  /*
   * 发送基础数据
   *
   */
  function sendBasic() {
    let ua = new UAParser();
    let data = {
      ref: document.referrer,
      br: ua.getBrowser().name,
      brv: ua.getBrowser().version,
      os: ua.getOS().name,
      osv: ua.getOS().version,
      scr: win.screen.width + 'x' + win.screen.height,
      vp: Math.max(document.documentElement.clientWidth, win.innerWidth || 0) + 'x' + Math.max(document.documentElement.clientHeight, win.innerHeight || 0),
      'char': (document.characterSet || document.charset || '').toLowerCase(),
      lang: (win.navigator.language || win.navigator.userLanguage || '').toLowerCase(),
      href: win.location.href,
      host: win.location.host,
      path: win.location.pathname,
      search: win.location.search,
      title: document.title,
      actionType: 'basicData'
    };
    send(data);
  }

  /*
   * 监听hash Uniface的hashchange
   *
   */
  function hashChangeInit() {
    // 页面关闭状态重置
    closing = false;

    // 初始化配置时间
    config.startTime = +new Date();

    // tab隐藏的时间
    tabToHideTime = 0;

    // 最后一次鼠标活跃开始时间
    loseTimeStart = +new Date();

    // 页面失活时间和
    loseAllTime = 0;

    // 页面活跃是否活跃
    isClickActive = true;

    // tab激活时间
    tabToShowTime = +new Date();

    // 最后一次失活时间
    loseTimeEnd = 0;

    // tab是激活
    isTabShow = true;

    // 初始化心跳
    startHeart();

    // 初始化页面活跃
    startClickActive();
  }

  /**
   * 检测当前页面是否已经加载aplus脚本
   */
  function checkAplus() {
    const lazyTime = 60000;
    setTimeout(() => {
      if (!(win.goldlog && win.goldlog.record)) {
        const noAplusData = {
          actionType: 'noAplus'
        };
        sendBackup(noAplusData);
      }
    }, lazyTime);
  }

  /**
   * 初始化
   *
   */
  function init() {
    // 判断是否生产环境
    // if (!isOnline()) {
    //   return;
    // }
    // 检测是否获取到了USER_NICK
    checkUserNick();

    config.stat && getStat();
    // config.performance && addEvent(win, 'load', getPerformance);
    // config.error && handleErrors();
    config.hash && hookHash();

    // 监听当前页面是离开
    addEvent(win, 'visibilitychange', visibilityChange);

    // 监听当前页面是否超时未交互
    addEvent(win, 'click', startClickActive);

    // 发送基础数据
    sendBasic();

    // check当前环境下是否正常加载aplus
    checkAplus();

    // 初始化心跳
    startHeart();

    // 初始化页面活跃
    startClickActive();

    // 初始化AES
    initAes();
  }

  win[objectName] = entry();

  /**
   * 执行init入口
   */
  try {
    init();
  } catch (e) {
    console.log(e);
  }
})(window, document)
