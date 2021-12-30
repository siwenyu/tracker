/**
 * 解析错误对象中的 stack，并尝试压缩 js
 *
 * 压缩逻辑
 * 1. 提取 stack 中所有的 js 名，并为其附一个简化的标识符，形如 #1#
 * 2. 将 stack 中所有的 xxx.js 替换为对应的标识符
 * 3. 所有的标识符通过 `js名@标识符` 的形式保存，多个组合用 ; 隔开，保存为字段中的 c1
 * 4. 客户端读到 stack 后再按照原规则解析
 *
 * @param  {Object} errorObj 原生 Error
 * @return {string}
 */
var STACK_LENGTH_LIMIT = 4096;


// regex borrowed from https://github.com/getsentry/raven-js/blob/master/vendor/TraceKit/tracekit.js
var ChromeREGEX = /^\s*at .*? ?\(((?:file|https?|blob|chrome-extension|native|eval|<anonymous>).*?)(?::\d+)?(?::\d+)?\)?\s*$/i;
var GeckoREGEX = /^\s*.*?(?:\(.*?\))?(?:^|@)((?:file|https?|blob|chrome|resource|\[native).*?)(?::\d+)?(?::\d+)?\s*$/i;
var WinJSREGEX = /^\s*at (?:(?:\[object object\])?.+ )?\(?((?:file|ms-appx|https?|blob):.*?):\d+(?::\d+)?\)?\s*$/i;

// for test
if (typeof process === 'object' && process.env.NODE_ENV === 'test') {
  ChromeREGEX = /([^\()]+\.spec\.js)/i;
}

function parseStack(errorObj) {
  var arr = ((errorObj || {}).stack || '').split('\n');
  var result = ['', '', ''];

  // 由于 stack 中 js 地址很长，压缩同名的 js，以获得更多的 stack 捕获
  var jsObj = {};
  for (var i = 0; i < arr.length; i++) {
    var matchRegex = ChromeREGEX;

    var matches = (arr[i] || '').match(matchRegex);

    if (matches === null) {
      matchRegex = GeckoREGEX;
      matches = (arr[i] || '').match(matchRegex);
    }

    if (matches === null) {
      matchRegex = WinJSREGEX;
      matches = (arr[i] || '').match(matchRegex);
    }

    if (matches !== null) {
      var jsFile = matches[1];
      var identifier = jsObj[jsFile];
      if (identifier === undefined) {
        jsObj[jsFile] = '#' + i + '#';
        identifier = jsObj[jsFile];
      }

      arr[i] = arr[i].replace(jsFile, identifier);
    }
  }

  if (arr.length > 0) {
    // 第一行为 message，与 msg 一致，无需额外保存
    arr.shift();

    var stack = '';
    i = 0;
    while (stack.length + (arr[i] || '').length < STACK_LENGTH_LIMIT && i < arr.length) {
      stack += (arr[i] + '\n');
      i++;
    }

    result[1] = stack;

    var stack2 = '';
    while (stack2.length + (arr[i] || '').length < STACK_LENGTH_LIMIT && i < arr.length) {
      stack2 += (arr[i] + '\n');
      i++;
    }

    result[2] = stack2;
  }

  var identifiers = '';
  for (jsFile in jsObj) {
    if (jsObj.hasOwnProperty(jsFile)) {
      identifiers += (jsFile + '@' + jsObj[jsFile]) + ';';
    }
  }
  identifiers = identifiers.replace(/;$/, '');

  result[0] = identifiers;

  return result;
}

module.exports = parseStack;
