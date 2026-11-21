const local = require('../../utils/local.js');

const STORE_KEY = 'custom_training_plans';
const WEEKDAY_NAMES = ['', '一', '二', '三', '四', '五', '六', '日'];
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7].map(k => ({ key: k, label: '周' + WEEKDAY_NAMES[k] }));
const defaultForm = () => ({ id: '', name: '', weekday: [1, 3, 5], content: '' });
const buildWeekdayButtons = selected => WEEKDAYS.map(d => ({ key: d.key, label: d.label, on: (selected || []).includes(d.key) }));
const weekdayLabel = days => (days || []).slice().sort((a, b) => a - b).map(d => {
  const n = WEEKDAY_NAMES[d];
  return n ? '周' + n : '';
}).filter(Boolean).join('、');

Page({behaviors: [require('../../behaviors/theme.js')],
  data: {
    customPlans: [],
    current: null,
    form: defaultForm(),
    weekdayButtons: buildWeekdayButtons(defaultForm().weekday),
    editing: false
  },

  onLoad() {
    this.loadPlans();
  },

  onShow() {
    this.loadPlans();
  },

  planWeekdayText(plan) {
    if (plan && plan.weekday && plan.weekday.length) return weekdayLabel(plan.weekday);
    if (plan && plan.frequency) return '每周 ' + plan.frequency + ' 天';
    return '未设定日期';
  },

  loadPlans() {
    const customPlans = (wx.getStorageSync(STORE_KEY) || []).map(p => ({ ...p, weekdayText: this.planWeekdayText(p) }));
    this.setData({ customPlans });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  toggleWeekday(e) {
    const key = +e.currentTarget.dataset.k;
    let days = (this.data.form.weekday || []).slice();
    const idx = days.indexOf(key);
    if (idx > -1) days.splice(idx, 1);
    else days.push(key);
    days.sort((a, b) => a - b);
    this.setData({ ['form.weekday']: days, weekdayButtons: buildWeekdayButtons(days) });
  },

  savePlan() {
    const form = this.data.form;
    const name = (form.name || '').trim();
    const content = (form.content || '').trim();
    const weekday = (form.weekday || []).slice().sort((a, b) => a - b);
    if (!name) {
      wx.showToast({ title: '请输入计划名称', icon: 'none' });
      return;
    }
    if (!weekday.length) {
      wx.showToast({ title: '请至少选择一个训练日', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请输入训练安排', icon: 'none' });
      return;
    }

    const plans = (wx.getStorageSync(STORE_KEY) || []).slice();
    const plan = {
      id: form.id || ('custom_' + Date.now()),
      name,
      level: 'custom',
      custom: true,
      weekday,
      frequency: weekday.length,
      days: [{ day: '训练安排', exercises: content.split(/\n+/).map(x => x.trim()).filter(Boolean) }]
    };
    plan.weekdayText = this.planWeekdayText(plan);
    const index = plans.findIndex(item => item.id === plan.id);
    if (index > -1) plans[index] = plan;
    else plans.unshift(plan);
    wx.setStorageSync(STORE_KEY, plans);
    const customPlans = plans.map(p => ({ ...p, weekdayText: this.planWeekdayText(p) }));
    const formDef = defaultForm();
    this.setData({ customPlans, current: plan, form: formDef, weekdayButtons: buildWeekdayButtons(formDef.weekday), editing: false });
    wx.showToast({ title: index > -1 ? '计划已更新' : '计划已保存', icon: 'success' });
  },

  editPlan(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.customPlans.find(item => item.id === id);
    if (!plan) return;
    const content = (plan.days || []).map(day => (day.exercises || []).join('\n')).join('\n');
    const weekday = (plan.weekday && plan.weekday.length) ? plan.weekday.slice() : [];
    this.setData({
      editing: true,
      form: { id: plan.id, name: plan.name, weekday, content },
      weekdayButtons: buildWeekdayButtons(weekday)
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 250 });
  },

  cancelEdit() {
    const formDef = defaultForm();
    this.setData({ editing: false, form: formDef, weekdayButtons: buildWeekdayButtons(formDef.weekday) });
  },

  deletePlan(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除计划',
      content: '确定删除这份自定义训练计划吗？',
      success: result => {
        if (!result.confirm) return;
        const plans = (wx.getStorageSync(STORE_KEY) || []).filter(item => item.id !== id);
        wx.setStorageSync(STORE_KEY, plans);
        const customPlans = plans.map(p => ({ ...p, weekdayText: this.planWeekdayText(p) }));
        this.setData({ customPlans, current: this.data.current && this.data.current.id === id ? null : this.data.current });
      }
    });
  },

  pickCustom(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.customPlans.find(item => item.id === id) || null;
    this.setData({ current: plan });
  },

  startToday() {
    local.markHabit(new Date().toISOString().slice(0, 10), 'training');
    wx.showToast({ title: '今日训练已完成', icon: 'success' });
  }
});
