const app = getApp();
const helpers = require('../../utils/helpers.js');
const local = require('../../utils/local.js');
const createShareCard = require('../../utils/share.js');

Page({
  data: { user: {}, bgCss: '', bgImg: '', themeKey: '' },

  onShow() {
    local.applyTheme && local.applyTheme(this);
    this.setData({ user: app.getUser() || local.getUser() || {} });
    const cur = local.wallpaper ? local.wallpaper.currentWallpaper() : null;
    this.setData({
      bgCss: cur && cur.type === 'gradient' ? cur.css : '',
      bgImg: cur && cur.type === 'image' ? cur.path : ''
    });
  },

  go(e) {
    const page = e.currentTarget.dataset.p;
    if (!page) return;
    wx.navigateTo({ url: '/pages/' + page + '/index' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          helpers.clearUser();
          app.globalData.userInfo = null;
          app.globalData.userId = null;
          wx.redirectTo({ url: '/pages/setup/index' });
        }
      }
    });
  },

  onShareAppMessage() {
    return createShareCard();
  },
});
