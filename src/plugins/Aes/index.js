
// 加载AES插件
import AES from '@ali/aes-tracker';
import '@ali/aes-tracker-plugin-jserror';
import '@ali/aes-tracker-plugin-api';
import '@ali/aes-tracker-plugin-perf';
import '@ali/aes-tracker-plugin-longtask';
import '@ali/aes-tracker-plugin-tsl';
// import '@ali/aes-tracker-plugin-animFluency';
import '@ali/aes-tracker-plugin-pv';
// import '@ali/aes-tracker-plugin-event';
import '@ali/aes-tracker-plugin-autolog';

function ScriptAes(config) {
  AES.setConfig({ ...config });
};

module.exports = ScriptAes;
