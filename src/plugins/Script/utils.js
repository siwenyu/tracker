/**
 * 数组去重
 */
exports.unique = function unique(arr) {
  var obj = {};
  var res = [];

  for (var i = 0; i < arr.length; i++) {
    var v = arr[i];

    if (!obj[v]) {
      obj[v] = true;
      res.push(v);
    }
  }

  return res;
}

// JS 后缀正则
var reJsSuffix = /\.js$/;

/**
 * 生成脚本数组
 * @param  {Array} 浏览器选择到 Script 标签数组
 * @return {Array} 脚本数组
 */
exports.generateScriptsTree = function generateScriptsTree(scripts) {
  var arrScriptsSrc = [];

  for (var i = 0; i < scripts.length; i++) {
    // 排除不支持 JS 后缀
    if (!scripts[i].src || !reJsSuffix.test(scripts[i].src)) {
      continue;
    }

    var src = scripts[i].src;

    // 相对路径补充
    if (!/^(http:|https:)/.test(src)) {
      src = window.location.protocol + '//' + window.location.host + '/' + src;
    }

    // 支持 nginx combo 解构
    var comboSplitSrc = src.split('??');

    if (!comboSplitSrc[1]) {
      arrScriptsSrc.push(src.split('?')[0]);
      continue;
    }

    var preSrc = comboSplitSrc[0];
    var suffixSplitSrc = comboSplitSrc[1].split(',');

    for (var j = 0; j < suffixSplitSrc.length; j++) {
      var comboSrc = preSrc + suffixSplitSrc[j];

      if (reJsSuffix.test(comboSrc)) {
        arrScriptsSrc.push(preSrc + suffixSplitSrc[j]);
      }
    }
  }

  return arrScriptsSrc;
}

// 匹配 Ali/Alipay CDN 正则
var reAliCdn = /^((http|https):\/\/)(.*)\.(alicdn|alipayobjects)\.com\/(.*)/;

// 匹配 Gitlab 上传 CDN 规则正则
var reUrlRule = /^([https|http]*:\/\/.*\.[alicdn|alipayobjects]*\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+)\/(.*)/;

// 匹配 Ali CDN 正则
var reAliCdnRule = /^((http|https):\/\/)(.*)\.alicdn\.com/;

// 匹配 Alipay CDN 正则
var reAlipayCdnRule = /^((http|https):\/\/)(.*)\.alipayobjects\.com/;

function parseCdnScript(script) {
  if (!script.match(reAliCdn)) { return; }

  var parsedScript = reUrlRule.exec(script);

  var frontPart = parsedScript[1];
  var parsedFrontPart;

  if (frontPart.match(reAliCdnRule)) {
    parsedFrontPart = reAliCdnRule.exec(frontPart);
    frontPart = frontPart.replace(parsedFrontPart[0], '$' + parsedFrontPart[3]);
  } else if (frontPart.match(reAlipayCdnRule)) {
    parsedFrontPart = reAlipayCdnRule.exec(frontPart);
    frontPart = frontPart.replace(parsedFrontPart[0], '_' + parsedFrontPart[3]);
  }

  return [frontPart, parsedScript[2]];
}

/**
 * 生成压缩脚本数组
 * @param  {Array} 脚本数组
 * @return {Array}
 */
exports.generateCombineScripts = function generateCombineScripts(scripts) {
  var newScripts = [];
  var scriptTree = {};

  for (var i = 0; i < scripts.length; i++) {
    var parsedScript = parseCdnScript(scripts[i]);

    if (!parsedScript) {
      newScripts.push(scripts[i]);
      continue;
    }

    if (!scriptTree[parsedScript[0]]) {
      scriptTree[parsedScript[0]] = [];
    }

    scriptTree[parsedScript[0]].push(parsedScript[1]);
  }

  var combineScript;

  for (var j in scriptTree) {
    if (scriptTree.hasOwnProperty(j)) {
      if (scriptTree[j].length <= 1) {
        combineScript = j + '/' + scriptTree[j];
      } else {
        combineScript = j + '??' + scriptTree[j].join(',');
      }

      newScripts.push(combineScript);
    }
  }

  return newScripts;
}
