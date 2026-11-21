const app = getApp();
const helpers = require('../../utils/helpers.js');
const local = require('../../utils/local.js');

Page({behaviors: [require('../../behaviors/theme.js')],
  data: {
    gender: 'male',
    height: '',
    weight: '',
    age: '',
    targetWeight: '',
    targetDate: new Date().toISOString().slice(0, 10),
    activity: 'moderate',
    activityIdx: 2,
    activityList: ['久坐少动', '轻度活动', '中度活动', '高强度活动', '非常活跃'],
    activityMap: ['sedentary', 'light', 'moderate', 'active', 'very'],
    goal: '',
    preview: null,
    saving: false
  },

  onShow() {
    if (app.getUser()) wx.switchTab({ url: '/pages/index/index' });
  },

  setGender(e) {
    this.setData({ gender: e.currentTarget.dataset.g });
    this.calc();
  },

  setGoal(e) {
    this.setData({ goal: e.currentTarget.dataset.g });
    this.calc();
  },

  onHeight(e) {
    this.setData({ height: +e.detail.value });
    this.calc();
  },

  onWeight(e) {
    this.setData({ weight: +e.detail.value });
    this.calc();
  },

  onAge(e) {
    this.setData({ age: +e.detail.value });
    this.calc();
  },

  onTarget(e) {
    this.setData({ targetWeight: +e.detail.value });
  },

  onDate(e) {
    this.setData({ targetDate: e.detail.value });
  },

  onActivity(e) {
    const i = Number(e.detail.value);
    this.setData({ activityIdx: i, activity: this.data.activityMap[i] });
    this.calc();
  },

  calc() {
    const d = this.data;
    const bmi = helpers.calcBMI(d.weight, d.height);
    const bmr = helpers.calcBMR(d.weight, d.height, d.age, d.gender);
    const tdee = helpers.calcTDEE(bmr, d.activity);
    const cal = helpers.suggestedCalories(tdee, d.goal);
    this.setData({
      preview: bmi != null ? { bmi, status: helpers.bmiStatus(bmi), bmr, tdee, cal } : null
    });
  },

  saveAndLogin() {
    const d = this.data;
    if (!d.height || !d.weight) {
      wx.showToast({ title: '请填写身高和当前体重', icon: 'none' });
      return;
    }

    // Keep the button disabled while the synchronous local writes and navigation run.
    this.setData({ saving: true });
    try {
      const preview = d.preview || {};
      const user = local.saveUser({
        name: '健康用户',
        height: d.height,
        weight: d.weight,
        age: d.age,
        gender: d.gender,
        activity: d.activity,
        goal: d.goal || '',
        bmi: preview.bmi,
        bmr: preview.bmr,
        tdee: preview.tdee,
        dailyCalories: preview.cal,
        startWeight: d.weight
      });
      if (d.goal) {
        local.saveGoal({
          type: d.goal,
          target: d.targetWeight || d.weight,
          targetDate: d.targetDate,
          startWeight: d.weight
        });
      }
      app.globalData.userInfo = user;
      app.globalData.userId = user._id || user.userId;
      wx.switchTab({
        url: '/pages/index/index',
        fail: () => {
          this.setData({ saving: false });
          wx.showToast({ title: '进入首页失败，请重试', icon: 'none' });
        }
      });
    } catch (error) {
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      console.error('save profile failed', error);
    }
  }
});
