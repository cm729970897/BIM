const food = require('../../utils/food.js');
const local = require('../../utils/local.js');

const MEAL_LABELS = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

Page({behaviors: [require('../../behaviors/theme.js')],
  data: {
    foodName: '',
    foodKcal: '',
    foodResults: [],
    meal: 'lunch',
    date: new Date().toISOString().slice(0, 10),
    selected: [],
    totalKcal: 0,
    dayRecords: []
  },
  onLoad() {
    wx.setStorageSync('__record_active_panel__', 'diet');
    wx.switchTab({ url: '/pages/record-weight/index' });
    return;
    this.loadDayRecords();
  },
  loadDayRecords() {
    const date = this.data.date;
    const records = (local.listDiet() || [])
      .filter(x => x.date === date)
      .map(x => ({
        meal: x.meal,
        mealLabel: MEAL_LABELS[x.meal] || '饮食',
        meals: x.meals || [],
        totalKcal: x.totalKcal || 0
      }));
    this.setData({ dayRecords: records });
  },
  onDate(e) {
    this.setData({
      date: e.detail.value,
      selected: [],
      totalKcal: 0,
      foodName: '',
      foodKcal: '',
      foodResults: []
    });
    this.loadDayRecords();
  },
  pickMeal(e) {
    this.setData({ meal: e.currentTarget.dataset.m });
  },
  recount(selected) {
    return Math.round(selected.reduce((s, f) => s + f.kcal * f.grams / 100, 0));
  },
  onFoodName(e) {
    const foodName = e.detail.value;
    const foodResults = food.search(foodName);
    const exactFood = foodResults.find(item => item.name === foodName.trim());
    this.setData({
      foodName,
      foodKcal: exactFood ? String(exactFood.kcal) : '',
      foodResults
    });
  },
  onFoodKcal(e) {
    this.setData({ foodKcal: e.detail.value });
  },
  chooseFood(e) {
    const selectedFood = e.currentTarget.dataset.f;
    this.setData({
      foodName: selectedFood.name,
      foodKcal: String(selectedFood.kcal),
      foodResults: []
    });
  },
  addFood() {
    const name = (this.data.foodName || '').trim();
    const kcal = +this.data.foodKcal;
    if (!name) return wx.showToast({ title: '请输入食物名称', icon: 'none' });
    const validKcal = Number.isFinite(kcal) && kcal > 0 ? kcal : 0;
    const item = { name, kcal: validKcal, grams: 100, manual: true, calcKcal: Math.round(validKcal) };
    const selected = [...this.data.selected, item];
    this.setData({ selected, totalKcal: this.recount(selected), foodName: '', foodKcal: '', foodResults: [] });
  },
  delFood(e) {
    const selected = this.data.selected.filter((_, i) => i !== e.currentTarget.dataset.i);
    this.setData({ selected, totalKcal: this.recount(selected) });
  },
  goRecord(e) {
    const page = e.currentTarget.dataset.p;
    if (page === 'record-diet') {
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
    if (!this.data.selected.length) return wx.showToast({ title: '请先添加食物', icon: 'none' });
    const total = this.recount(this.data.selected);
    local.saveDiet({ date: this.data.date, meals: this.data.selected, totalKcal: total, meal: this.data.meal });
    wx.showToast({ title: '记录成功', icon: 'success' });
    this.setData({ selected: [], totalKcal: 0, foodName: '', foodKcal: '', foodResults: [] });
    this.loadDayRecords();
  }
});