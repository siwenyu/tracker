/**
 * 解析页面中的 script 脚本
 * @param {Object} Tracker
 */
var scriptUtils = require('./utils');
var utils = require('../../utils');
var unique = scriptUtils.unique;
var generateCombineScripts = scriptUtils.generateCombineScripts;
var generateScriptsTree = scriptUtils.generateScriptsTree;

var GOLDLOG_SCRIPTS_BASE = '/fsp.1.2';

function ScriptPlugin(tracker, config) {
  var defaultConfig = {
    sampleRate: 1
  };

  var pluginConfig = utils.extend(defaultConfig, config);

  var plugin = {
    /**
     * 补全 Script 打点参数中缺失的部分，如 pid 等
     * @return {object}
     */
    scriptLog: function() {
      var options = {};

      // 当前项目 id
      options.pid = tracker.pid;

      // 采样率
      options.sampleRate = pluginConfig.sampleRate;

      // 页面地址（不含 query 及 hash）
      options.page = window.location.href.split('?')[0];

      var scripts = document.getElementsByTagName('script');
      var arrScripts = Array.prototype.slice.call(scripts, 0);
      var arrScriptsSrc = generateCombineScripts(unique(generateScriptsTree(arrScripts)));

      options.scripts = arrScriptsSrc.join('|');

      return options;
    },

    /**
     * 获取更新的状态
     */
    getUpdateStatus: function() {
      // 在 Localstorage 里记录时间，并且强制采样 20%
      if (!window.localStorage || !window.localStorage.getItem('tracker_timer') || this.count > 1) {
        return false;
      }

      var timer = window.localStorage.getItem('tracker_timer');

      try {
        var objTimer = JSON.parse(timer);
        var pathTime = objTimer[window.location.pathname];
      } catch (e) {
        tracker.logError(e, {
          pid: 'fsp',
          code: 12,
          c4: tracker.pid
        });
      }

      if (!pathTime) { return false; }

      var diffTime = (+(new Date()) - pathTime) / 1000 / 3600;

      if (diffTime > 1) { return false; }

      return true;
    },

    /**
     * 设置打点的时间
     */
    setLocalTimer: function() {
      if (!window.localStorage) {
        this.count++;
        return;
      }

      var timer = window.localStorage.getItem('tracker_timer') || '{}';
      var objTimer = JSON.parse(timer);

      objTimer[window.location.pathname] = +(new Date());
      window.localStorage.setItem('tracker_timer', JSON.stringify(objTimer));
    },

    /**
     * 统计页面所有 Script URL
     */
    handleTracker: function () {
      var self = this;
      if (self.getUpdateStatus()) { return; }

      try {
        var options = self.scriptLog();
        options.base = GOLDLOG_SCRIPTS_BASE;

        tracker.log(options);

        self.setLocalTimer();
      } catch (e) {
        tracker.logError(e, {
          pid: 'fsp',
          code: 12,
          c4: tracker.pid
        });
      }
    },

    /**
     * 入口
     */
    getPageScripts: function() {
      var self = this;

      if (document.readyState === 'loaded' || document.readyState === 'complete') {
        this.handleTracker();
      } else {
        window.onload = function() {
          self.handleTracker();
        };
      }
    }
  };

  plugin.getPageScripts();
}

module.exports = ScriptPlugin;
