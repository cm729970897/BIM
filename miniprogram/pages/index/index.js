const helpers = require('../../utils/helpers.js');
const local = require('../../utils/local.js');
const app = getApp();

const TAB_PAGES = ['index', 'record-weight', 'ai-chat', 'profile'];

Page({
  data: {
    user: {},
    weight: '--',
    bmiStatus: '',
    totalKcal: 0,
    tip: '',
    today: '',
    wd: '',
    bgCss: '',
    bgImg: '',
    themeKey: ''
  },

  onShow() {
    this.load();
    this.loadWallpaper();
  },

  loadWallpaper() {
    const cur = local.wallpaper ? local.wallpaper.currentWallpaper() : null;
    local.applyTheme && local.applyTheme(this);
    if (!cur) { this.setData({ bgCss: '', bgImg: '' }); return; }
    this.setData({
      bgCss: cur.type === 'gradient' ? cur.css : '',
      bgImg: cur.type === 'image' ? cur.path : ''
    });
  },

  load() {
    const now = new Date();
    const date = helpers.dateFormat(now);
    const u = local.getUser();
    this.setData({ today: date, wd: helpers.weekday(now) });

    if (!u) {
      wx.redirectTo({ url: '/pages/setup/index' });
      return;
    }

    app.globalData.userInfo = u;
    app.globalData.userId = u._id || u.userId || null;

    const records = local.listWeights();
    const todayRecord = records.find(x => x.date === date);
    const sum = local.dailySummary(date);
    const tips = [
      '每天饮水 1.5～2 升，帮助身体保持良好状态',
      '规律记录饮食，更容易发现热量摄入规律',
      '每周进行 2 次力量训练，帮助维持肌肉量',
      '饭后步行 1500 步，让身体轻松动起来'
    ];

    this.setData({
      user: u,
      weight: todayRecord ? todayRecord.weight : u.weight,
      bmiStatus: helpers.bmiStatus(todayRecord && todayRecord.bmi ? todayRecord.bmi : u.bmi),
      totalKcal: Math.max(0, Math.round((Number(sum.dietKcal) || 0) - (Number(sum.exerciseKcal) || 0))),
      tip: tips[now.getDate() % tips.length]
    });
  },

  openCalendar() {
    wx.navigateTo({ url: '/pages/health-calendar/index' });
  },

  refresh() {
    this.load();
  },

  go(e) {
    const page = typeof e === 'string' ? e : e.currentTarget.dataset.p;
    if (!page) return;
    const url = '/pages/' + page + '/index';
    if (TAB_PAGES.includes(page)) wx.switchTab({ url });
    else wx.navigateTo({ url });
  },

  goWeight() {
    this.go('record-weight');
  },

  onShareAppMessage() {
    return { title: '健康体重管理 - 记录体重、饮食、运动', path: '/pages/index/index' };
  },
});
