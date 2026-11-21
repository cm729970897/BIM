const local = require('../../utils/local.js');
const rc = require('../../utils/recipeCn.js');
Page({behaviors: [require('../../behaviors/theme.js')],
  data: { plan: [], favorites: [], custom: [] },
  onShow() { this.setData({ plan: local.getMenu(), favorites: local.getFavorites(), custom: rc.listCustom().map(rc.zh) }); },
  goDetail(e) { wx.navigateTo({ url: '/pages/recipe-detail/index?id=' + e.currentTarget.dataset.id }); }
});