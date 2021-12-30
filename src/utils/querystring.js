/* istanbul ignore next */
function isArray(arr) {
  return ({}).toString.call(arr) === '[object Array]';
}

exports.parse = function (str) {
  var ret = {};

  if (typeof str !== 'string') {
    return ret;
  }

  str = (str || '').split('?')[1] || '';
  str = str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').replace(/^(\?|#|&)/, '');

  if (!str) {
    return ret;
  }

  var arr = str.split('&');
  /* istanbul ignore next */
  for (var i = 0; i < arr.length; ++i) {
    var param = arr[i];
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = parts.shift();
    var val = parts.length > 0 ? parts.join('=') : undefined;

    key = decodeURIComponent(key);

    val = val === undefined ? null : decodeURIComponent(val);

    if (ret[key] === undefined) {
      ret[key] = val;
    } else if (isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
  }

  return ret;
};

var VALUE_LIMIT = 512;
exports.stringify = function (obj, ignoredQueries, usePost) {
  if (!obj) {
    return '';
  }

  ignoredQueries = ignoredQueries || [];

  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  var arr = [];
  keys = keys.sort();

  for (var j = 0; j < keys.length; ++j) {
    key = keys[j];

    var val = obj[key];
    /* istanbul ignore if */
    if (val == null) {
      continue;
    }

    var found = false;
    for (var k = 0; k < ignoredQueries.length; ++k) {
      if (ignoredQueries[k] === key) {
        found = true;
        break;
      }
    }

    if (found) {
      continue;
    }

    arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(usePost ? encodeURIComponent(val) : String(val).slice(0, VALUE_LIMIT)));
  }

  return arr.join('&');
};
