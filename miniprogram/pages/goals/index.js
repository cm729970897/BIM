const local = require('../../utils/local.js');
const app = getApp();
Page({behaviors: [require('../../behaviors/theme.js')],
  data: { goal: null, target: '', targetDate: '', type: 'lose' },
  onShow() { const goal = local.getGoal() || {}, u = app.getUser() || local.getUser() || {}; this.setData({ goal, target: goal.target || u.weight || '', targetDate: goal.targetDate || new Date().toISOString().slice(0, 10), type: goal.type || u.goal || 'lose' }); },
  setTarget(e) { this.setData({ target: e.detail.value }); },
  setDate(e) { this.setData({ targetDate: e.detail.value }); },
  setType(e) { this.setData({ type: e.currentTarget.dataset.t }); },
  save() { const u = app.getUser() || local.getUser() || {}; local.saveGoal({ type: this.data.type, target: +this.data.target, targetDate: this.data.targetDate, startWeight: u.startWeight || u.weight }); const user = local.saveUser({ goal: this.data.type }); app.globalData.userInfo = user; wx.showToast({ title: '目标已保存', icon: 'success' }); }
});
