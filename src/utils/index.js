// var UA = require('ua-device');

/**
 * 各种工具函数
 */

/**
 * 是否是数字
 * @param
 * @return {boolean}
 */
function isNumber (obj) {
  return Object.prototype.toString.call(obj) === '[object Number]';
}

exports.isNumber = isNumber;

/**
 * 是否是 NaN
 * @param
 * @return {boolean}
 */
exports.isNaN = function isNaN(obj) {
  return isNumber(obj) && obj !== +obj;
}

/**
 * @param {array} array
 * @return {boolean}
 */
exports.isArray = function isArray(arr) {
  if (Array.isArray) {
    return Array.isArray(arr);
  }
  return Object.prototype.toString.call(arr).toUpperCase().indexOf('ARRAY') !== -1;
}

// 空函数
function noop(a) {
  return a || '';
}
exports.noop = noop;

/**
 * 合并对象
 */
exports.extend = function extend(obj, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key)) obj[key] = src[key];
  }
  return obj;
}

/**
 * 浅拷贝对象，将对象 b 中所有 a 不存在的 kv 拷贝给 a
 * @param  {Object} obja
 * @param  {Object} objb
 * @param  {Bool}   overwrite  是否覆盖 obja 中已存在的键
 * @return {Object}
 */
exports.shallowMerge = function shallowMerge(obja, objb, overwrite) {
  for (var key in objb) {
    if (objb.hasOwnProperty(key)) {
      if (overwrite || obja[key] === undefined) {
        obja[key] = objb[key];
      }
    }
  }
}

/**
 * 获取页面的 spmA 和 spmB 值，返回对象
 * @return { Object }
 */
exports.getSpm = function getSpm() {
  var spmA = '';
  var spmB = '';
  var goldlog = window.goldlog || {};
  var spmAb = goldlog.spmAb || goldlog.spm_ab;
  /* istanbul ignore if */
  if (spmAb && exports.isArray(spmAb)) {
    spmA = spmAb[0];
    if (spmAb[1]) {
      spmB = spmAb[1];
    }
  }
  return {
    a: spmA,
    b: spmB
  };
}

/**
 * 将 Script error 错误归一化，解决不同浏览器 Script Error 不同的问题
 * @param  {String} msg 报错信息
 * @return {String}
 */
exports.unifyErrorMsg = function unifyErrorMsg(msg) {
  if (/^script error\.?$/i.test(msg)) {
    return 'Script error';
  }

  return msg;
}


/**
 * 获取屏幕尺寸
 * @return {String} 1920x1080
 */
exports.getScreenSize = function getScreenSize() {
  return window.screen.width + 'x' + window.screen.height;
}


/**
 * 根据打点的各个参数生成唯一的标识符，用于判断一次 session 内该错误是否已经打过点
 * @param  {Object} options 打点参数
 * @return {String}
 */
exports.generateIdentifier = function generateIdentifier(options) {
  return [
    options.type,
    options.uid,
    options.page,
    options.msg || '',
    options.ajaxurl || ''
  ].join('_');
}

var EventStore = {}

/**
 * 跨浏览器监听事件
 */
exports.addEvent = function addEvent(elem, event, fn, useCapture) {
  /* istanbul ignore else */
  if (elem.addEventListener) {
    elem.addEventListener(event, fn, useCapture || false);
  } else if (elem.attachEvent) {
    EventStore['on' + event] = function () {
      return fn.call(elem, window.event);
    };
    elem.attachEvent('on' + event, EventStore['on' + event]);
  }
}

/**
 * 跨浏览器清除事件
 */
exports.removeEvent = function removeEvent(elem, event, fn, useCapture) {
  if (elem.removeEventListener) {
    elem.removeEventListener(event, fn, useCapture || false);
  } else if (elem.detachEvent) {
    elem.detachEvent('on' + event, EventStore['on' + event] || noop);
  }
}

function isObject(what) {
  return typeof what === 'object' && what !== null;
}

// Sorta yanked from https://github.com/joyent/node/blob/aa3b4b4/lib/util.js#L560
// with some tiny modifications
exports.isError = function isError(what) {
  var toString = {}.toString.call(what);
  return isObject(what) &&
    toString === '[object Error]' ||
    toString === '[object Exception]' || // Firefox NS_ERROR_FAILURE Exceptions
    what instanceof Error;
}

exports.getXPath = function getXPath(dom, depth) {
  var id = dom.id ? '#' + dom.id : '';
  var className = dom.className && dom.className.split ? '.' + dom.className.split(' ').join('.') : '';
  var tagName = dom.tagName.toLowerCase();

  if (dom.parentNode && dom.parentNode.tagName && depth - 1 !== 0) {
    return getXPath(dom.parentNode, depth - 1) + ' > ' + tagName.toLowerCase() + id + className;
  }
  return tagName + id + className;
}

exports.getWin = function getWin() {
  // detect Node.JS environment
  var isNode = false;
  try {
    // Only Node.JS has a process variable that is of [[Class]] process
    if (global.process.toString() === '[object process]') {
      // 若上述代码未跳出，可初步判断是在 Node 环境下
      isNode = true;

      // 不加防范的判断是否在 Electron Renderer 环境下
      // 此时，process.versions 中应有 electron 属性，且 process.type 为 renderer（main 环境是 browser）
      if (global.process.versions && global.process.versions.electron && global.process.type === 'renderer') {
        isNode = false;
      }
    }
  } catch (e) {

  }

  var win = {};
  // 兼容各种执行环境，在node端不执行
  if (!isNode) {
    win = typeof window !== 'undefined' ? window        // DOM
    : typeof self !== 'undefined' ? self // Service Worker
        : {};
  }

  return win;
}

/*
exports.uaDevice = function uaDevice(ua) {
  if (ua === '') return {};

  var output = new UA(ua);

  var browser = output.browser || {};
  var engine = output.engine || {};
  var os = output.os || {};

  return {
    browser: browser.name + (browser.version || {}).original,
    engine: engine.name + (engine.version || {}).original,
    os: os.name + (os.version || {}).original,
  };
}
*/
// 读cookie
function readCookie(doc, name) {
  var matched = new RegExp('(?:^|;\\s*)' + name + '\\=([^;]+)(?:;\\s*|$)').exec(doc.cookie);
  if (matched) {
    return matched[1];
  }
}
exports.readCookie = readCookie;

exports.getUserIdByHavana = function getUserIdByHavana(doc) {
  let id = readCookie(doc, 'munb') || readCookie(doc, 'unb') || undefined;
  id = decodeURIComponent(id);
  id = id && id.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
  return id;
}

exports.getUserNickByHavana = function getUserNickByHavana(doc) {
  let nick = '';
  const wapnick = readCookie(doc, '_w_tb_nick');  // 原先wap登录的cookie
  const tbnick = readCookie(doc, '_nk_') || readCookie(doc, 'snk'); // pc登录的cookie
  var subnick = readCookie(doc, 'sn');  // 子帐号登录的cookie
  if (wapnick && wapnick.length > 0 && wapnick !== 'null') {
    nick = decodeURIComponent(wapnick); // 中文会encode，需要decode
  } else if (tbnick && tbnick.length > 0 && tbnick !== 'null') {
    nick = unescape(unescape(tbnick).replace(/\\u/g, '%u'));
  } else if (subnick && subnick.length > 0 && subnick !== 'null') {
    nick = decodeURIComponent(subnick);
  }
  nick = nick && nick.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
  return nick;
}

exports.getUserIdByBuc = function getUserIdByBuc(win, doc) {
  if (win.GlobalConfig && win.GlobalConfig.userInfo) {
    return win.GlobalConfig.userInfo.empId || win.GlobalConfig.userInfo.userId || win.GlobalConfig.userInfo.workNo || readCookie(doc, 'emplId');
  }
}

exports.getUserNickByBuc = function getUserNickByBuc(win, USER_ID) {
  if (win.GlobalConfig && win.GlobalConfig.userInfo) {
    return win.GlobalConfig.userInfo.nick || '工号' + USER_ID;
  }
}
