/**
 * 适用于生意参谋系列网站获取当前页面 userId 的方法
 */
module.exports = function DEFAULT_USER_ID_RESOLVER() {
  var userId = '';
  var loginUserId = '';
  try {
    var microdata = document.getElementById('microdata') || document.querySelector('[name="microdata"]');
    if (microdata) {
      microdata = microdata.content.split(';').reduce(function(result, str) {
        var pairs = str.split('=');
        if (pairs[0]) {
          var trueValue;
          try {
            trueValue = JSON.parse(pairs[1]);
          } catch (e) {
            trueValue = pairs[1];
          }

          result[pairs[0]] = trueValue;
        }

        return result;
      }, {});
      userId = microdata.userId;
      loginUserId = microdata.loginUserId;
    }
  } catch (e) {

  }

  return (loginUserId && loginUserId !== userId) ? 'm:' + userId + ',s:' + loginUserId : userId;
}
