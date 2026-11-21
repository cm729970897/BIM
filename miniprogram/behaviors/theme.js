/**
 * 全局主题 Behavior：页面附加后，在每次 show 时自动读取当前壁纸主题，
 * 将 themeKey / themeAccent 写入页面数据；页面根视图绑定
 * class="... theme-{{themeKey}}" 即可启用 app.wxss 里的
 * .theme-pink / .theme-green 覆盖规则（按钮、重点色、容器背景）。
 * 同时调用 wx.setNavigationBarColor / setTabBarStyle 同步系统区域。
 * 用法：Page({ behaviors: [themeBehavior], ... })
 */
const local = require('../utils/local.js');

const themeBehavior = Behavior({
  data: {
    themeKey: 'green',
    themeAccent: '#3A7D44'
  },
  pageLifetimes: {
    show() {
      if (local.getTheme && local.applyTheme) {
        local.applyTheme(this);
      }
    }
  }
});

module.exports = themeBehavior;