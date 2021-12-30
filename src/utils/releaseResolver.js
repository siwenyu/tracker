/**
 * 适用于生意参谋系列网站获取当前页面前端资源版本的方法
 * @param {Array} matches 匹配规则，对象 /\/dt\/([^\/+])\/(\d+\.\d+\.\d)\//
 */
var defaultRegExp = /\/dt\/([^\/]+)\/(\d+\.\d+\.\d+)\//i;
module.exports = function generateReleaseResolver(scriptRegExp) {
  if (!(scriptRegExp instanceof RegExp)) {
    scriptRegExp = defaultRegExp;
  }

  return function releaseResolver() {
    try {
      var releases = {};
      var scripts = document.getElementsByTagName('script');

      ([]).slice.call(scripts).forEach(function(script) {
        if (script.src) {
          var matches = script.src.match(scriptRegExp);
          if (matches && matches.length === 3) {
            var project = matches[1];
            var version = matches[2];
            releases[project] = version;
          }
        }
      });

      var versions = Object.keys(releases);
      return versions.length > 0 ? versions.map(function(version) {
        return version + '@' + releases[version];
      }).join(';') : '';
    } catch (e) {
      return '';
    }
  }
}
