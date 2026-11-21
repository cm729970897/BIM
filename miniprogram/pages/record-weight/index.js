const local = require('../../utils/local.js');
const H = require('../../utils/helpers.js');
const food = require('../../utils/food.js');

const MEAL_LABELS = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
const EXERCISE_TYPES = [
  { label: '步行', met: 3.5 }, { label: '跑步', met: 7.0 }, { label: '骑行', met: 6.0 },
  { label: '力量训练', met: 5.0 }, { label: '游泳', met: 8.0 }
];
const calcKcal = (met, weightKg, minutes) => Math.round(met * 3.5 * weightKg / 200 * minutes);

Page({
  behaviors: [require('../../behaviors/theme.js')],
  data: {
    activeRecord: 'weight',
    weight: '', date: new Date().toISOString().slice(0, 10), height: null, bmi: null, bmiStatus: '', bmiPercent: null, records: [],
    dietDate: new Date().toISOString().slice(0, 10), foodName: '', foodKcal: '', foodResults: [], meal: 'lunch', selected: [], totalKcal: 0, dietHistory: [],
    exerciseDate: new Date().toISOString().slice(0, 10), types: EXERCISE_TYPES.map(t => t.label), typeIdx: 3, metText: 5.0, exerciseName: '', duration: '', weightKg: null, kcal: 0, kcalHint: '', todayCal: 0, todayMin: 0, exerciseRecords: []
  },
  onLoad() { this.refreshWeight(); this.loadDietHistory(); this.loadExerciseWeight(); this.loadExerciseDay(); },
  onShow() {
    const pending = wx.getStorageSync('__record_active_panel__');
    if (pending) { wx.removeStorageSync('__record_active_panel__'); this.setData({ activeRecord: pending }); }
    this.refreshWeight(); this.loadDietHistory(); this.loadExerciseWeight(); this.loadExerciseDay();
  },
  switchRecord(e) {
    const activeRecord = e.currentTarget.dataset.p;
    if (!['weight', 'diet', 'exercise'].includes(activeRecord)) return;
    this.setData({ activeRecord });
    if (activeRecord === 'weight') this.refreshWeight();
    if (activeRecord === 'diet') this.loadDietHistory();
    if (activeRecord === 'exercise') { this.loadExerciseWeight(); this.loadExerciseDay(); }
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },
  onDate(e) { this.setData({ date: e.detail.value }); },
  onWeight(e) {
    const weight = e.detail.value, height = this.data.height; let bmi = null, bmiStatus = '', bmiPercent = null;
    if (height) { bmi = H.calcBMI(+weight, +height); bmiStatus = bmi != null ? H.bmiStatus(bmi) : ''; if (bmi != null) bmiPercent = Math.max(0, Math.min(100, ((bmi - 14) / 16) * 100)); }
    this.setData({ weight, bmi, bmiStatus, bmiPercent });
  },
  refreshWeight() { this.setData({ records: local.listWeights(), height: (local.getUser() || {}).height || null }); },
  submit() {
    const { weight, date } = this.data;
    if (!weight) return wx.showToast({ title: '请输入体重', icon: 'none' });
    local.saveWeight({ date, weight: +weight }); wx.showToast({ title: '记录成功', icon: 'success' });
    this.setData({ weight: '', bmi: null, bmiStatus: '', bmiPercent: null }); this.refreshWeight();
  },
  onDietDate(e) { this.setData({ dietDate: e.detail.value, selected: [], totalKcal: 0, foodName: '', foodKcal: '', foodResults: [] }); },
  loadDietHistory() {
    const dietHistory = (local.listDiet() || [])
      .slice()
      .sort((a, b) => (b.date + '').localeCompare(a.date + ''))
      .map(x => ({ date: x.date, meal: x.meal, mealLabel: MEAL_LABELS[x.meal] || '饮食', meals: x.meals || [], totalKcal: x.totalKcal || 0 }));
    this.setData({ dietHistory });
  },
  pickMeal(e) { this.setData({ meal: e.currentTarget.dataset.m }); },
  recount(selected) { return Math.round(selected.reduce((sum, item) => sum + item.kcal * item.grams / 100, 0)); },
  onFoodName(e) { const foodName = e.detail.value, foodResults = food.search(foodName), exact = foodResults.find(item => item.name === foodName.trim()); this.setData({ foodName, foodKcal: exact ? String(exact.kcal) : '', foodResults }); },
  onFoodKcal(e) { this.setData({ foodKcal: e.detail.value }); },
  chooseFood(e) { const item = e.currentTarget.dataset.f; this.setData({ foodName: item.name, foodKcal: String(item.kcal), foodResults: [] }); },
  addFood() {
    const name = (this.data.foodName || '').trim(), kcal = +this.data.foodKcal;
    if (!name) return wx.showToast({ title: '请输入食物名称', icon: 'none' });
    const item = { name, kcal: Number.isFinite(kcal) && kcal > 0 ? kcal : 0, grams: 100, manual: true }; item.calcKcal = Math.round(item.kcal);
    const selected = [...this.data.selected, item]; this.setData({ selected, totalKcal: this.recount(selected), foodName: '', foodKcal: '', foodResults: [] });
  },
  delFood(e) { const selected = this.data.selected.filter((_, i) => i !== e.currentTarget.dataset.i); this.setData({ selected, totalKcal: this.recount(selected) }); },
  submitDiet() {
    if (!this.data.selected.length) return wx.showToast({ title: '请先添加食物', icon: 'none' });
    const totalKcal = this.recount(this.data.selected); local.saveDiet({ date: this.data.dietDate, meals: this.data.selected, totalKcal, meal: this.data.meal });
    wx.showToast({ title: '记录成功', icon: 'success' }); this.setData({ selected: [], totalKcal: 0, foodName: '', foodKcal: '', foodResults: [] }); this.loadDietHistory();
  },
  loadExerciseWeight() { this.setData({ weightKg: (local.getUser() || {}).weight || null }); },
  onExerciseDate(e) { this.setData({ exerciseDate: e.detail.value }); this.loadExerciseDay(); },
  onExerciseType(e) { const typeIdx = +e.detail.value; this.setData({ typeIdx, metText: EXERCISE_TYPES[typeIdx].met }); this.recalc(this.data.duration); },
  onExerciseField(e) { const field = e.currentTarget.dataset.f; this.setData({ [field]: e.detail.value }); if (field === 'duration') this.recalc(e.detail.value); },
  recalc(duration) {
    const minutes = +duration || 0, met = EXERCISE_TYPES[this.data.typeIdx].met, weightKg = this.data.weightKg; let kcal = 0, kcalHint = '';
    if (!weightKg) kcalHint = '暂无体重数据，请先填写体重后自动计算';
    else if (!minutes) kcalHint = '请输入运动时长（分钟）后自动计算消耗';
    else { kcal = calcKcal(met, weightKg, minutes); kcalHint = '按体重 ' + weightKg + ' kg · ' + EXERCISE_TYPES[this.data.typeIdx].label + ' · MET ' + met + ' 自动计算'; }
    this.setData({ kcal, kcalHint });
  },
  loadExerciseDay() {
    const date = this.data.exerciseDate, sum = local.dailySummary(date);
    const exerciseRecords = (local.listExercise() || [])
      .slice()
      .sort((a, b) => (b.date + '').localeCompare(a.date + ''));
    this.setData({ todayCal: sum.exerciseKcal, todayMin: sum.exerciseMin, exerciseRecords });
  },
  submitExercise() {
    const minutes = +this.data.duration || 0; if (!minutes) return wx.showToast({ title: '请填写运动时长', icon: 'none' }); if (!this.data.weightKg) return wx.showToast({ title: '请先填写体重后再记录', icon: 'none' });
    const type = EXERCISE_TYPES[this.data.typeIdx], calories = calcKcal(type.met, this.data.weightKg, minutes);
    local.saveExercise({ date: this.data.exerciseDate, name: this.data.exerciseName || type.label, duration: minutes, calories, type: type.label }); wx.showToast({ title: '记录成功，消耗' + calories + 'kcal', icon: 'success' });
    this.setData({ exerciseName: '', duration: '', kcal: 0, kcalHint: '' }); this.loadExerciseDay();
  },

  onShareAppMessage() {
    return { title: '健康体重管理 - 记录体重、饮食、运动', path: '/pages/record-weight/index' };
  },
});
