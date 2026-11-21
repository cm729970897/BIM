const local = require('../../utils/local.js');
const types = [
  { label: '步行', met: 3.5 },
  { label: '跑步', met: 7.0 },
  { label: '骑行', met: 6.0 },
  { label: '力量训练', met: 5.0 },
  { label: '游泳', met: 8.0 }
];
const calcKcal = (met, weightKg, minutes) => Math.round(met * 3.5 * weightKg / 200 * minutes);
Page({behaviors: [require('../../behaviors/theme.js')],
  data: {
    date: new Date().toISOString().slice(0, 10),
    types: types.map(t => t.label),
    typeIdx: 3,
    metText: 5.0,
    name: '',
    duration: '',
    weightKg: null,
    kcal: 0,
    kcalHint: '',
    todayCal: 0,
    todayMin: 0,
    records: []
  },
  onLoad() {
    wx.setStorageSync('__record_active_panel__', 'exercise');
    wx.switchTab({ url: '/pages/record-weight/index' });
    return;
    this.loadWeight();
    this.loadDay();
  },
  onShow() { this.loadWeight(); this.loadDay(); },
  loadWeight() {
    const u = local.getUser() || {};
    this.setData({ weightKg: u.weight || null });
  },
  set(e) {
    this.setData({ [e.currentTarget.dataset.f]: e.detail.value });
    if (e.currentTarget.dataset.f === 'duration') this.recalc(e.detail.value);
  },
  onDate(e) {
    this.setData({ date: e.detail.value });
    this.loadDay();
  },
  onType(e) {
    const typeIdx = e.detail.value;
    this.setData({ typeIdx, metText: types[typeIdx].met });
    this.recalc(this.data.duration);
  },
  recalc(duration) {
    const minutes = +duration || 0;
    const met = types[this.data.typeIdx].met;
    const weightKg = this.data.weightKg;
    let kcal = 0;
    let kcalHint = '';
    if (!weightKg) {
      kcalHint = '暂无体重数据，请先在“首页-记录体重”或“我的”中填写体重后自动计算';
    } else if (!minutes) {
      kcalHint = '请输入运动时长（分钟）后自动计算消耗';
    } else {
      kcal = calcKcal(met, weightKg, minutes);
      kcalHint = `按体重 ${weightKg} kg、${types[this.data.typeIdx].label}（MET ${met}）自动计算`;
    }
    this.setData({ kcal, kcalHint });
  },
  loadDay() {
    const day = this.data.date;
    const sum = local.dailySummary(day);
    const records = (local.listExercise() || []).filter(r => r.date === day);
    this.setData({ todayCal: sum.exerciseKcal, todayMin: sum.exerciseMin, records });
  },
  goRecord(e) {
    const page = e.currentTarget.dataset.p;
    if (page === 'record-exercise') {
      wx.pageScrollTo({ scrollTop: 0, duration: 200 });
      return;
    }
    if (page === 'record-weight') {
      wx.switchTab({ url: '/pages/record-weight/index' });
      return;
    }
    wx.redirectTo({ url: '/pages/' + page + '/index' });
  },
  submit() {
    const minutes = +this.data.duration || 0;
    if (!minutes) return wx.showToast({ title: '请填写运动时长', icon: 'none' });
    if (!this.data.weightKg) return wx.showToast({ title: '请先填写体重后再记录', icon: 'none' });
    const met = types[this.data.typeIdx].met;
    const kcal = calcKcal(met, this.data.weightKg, minutes);
    local.saveExercise({ date: this.data.date, name: this.data.name || types[this.data.typeIdx].label, duration: minutes, calories: kcal, type: types[this.data.typeIdx].label });
    wx.showToast({ title: '记录成功，消耗' + kcal + 'kcal', icon: 'success' });
    this.setData({ name: '', duration: '', kcal: 0, kcalHint: '' });
    this.loadDay();
  },
});