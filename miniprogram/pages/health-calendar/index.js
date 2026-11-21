const helpers = require('../../utils/helpers.js');
const local = require('../../utils/local.js');

const uniqueDates = records => [...new Set(records.map(item => item && item.date).filter(Boolean))].sort();

Page({behaviors: [require('../../behaviors/theme.js')], 
  data: {
    user: {},
    today: '',
    selectedDate: '',
    markedDates: [],
    goal: null,
    goalProg: 0,
    diff: '--',
    dayData: null
  },

  onShow() {
    this.load();
  },

  onLoad() {
    this.load();
  },

  load() {
    const now = new Date();
    const date = helpers.dateFormat(now);
    const u = local.getUser() || {};
    const selectedDate = this.data.selectedDate || date;

    if (!this.data.today) this.setData({ today: date });

    const goal = local.getGoal();
    const prog = goal ? helpers.goalProgress(u.weight, goal.target, goal.startWeight || u.startWeight || u.weight) : 0;
    const diff = goal ? Math.abs((goal.target || 0) - (+u.weight || 0)).toFixed(1) : '--';

    this.setData({
      user: u,
      selectedDate,
      markedDates: this.collectMarkedDates(),
      goal,
      goalProg: prog,
      diff
    });
    this.updateSelectedDay(selectedDate);
  },

  collectMarkedDates() {
    return uniqueDates([
      ...local.listWeights(),
      ...local.listDiet(),
      ...local.listExercise(),
      ...local.listBody()
    ]);
  },

  updateSelectedDay(date) {
    const user = local.getUser() || this.data.user || {};
    const weight = local.listWeights().find(item => item.date === date) || null;
    const diets = local.listDiet().filter(item => item.date === date);
    const exercises = local.listExercise().filter(item => item.date === date);
    const dietKcal = Math.round(diets.reduce((sum, item) => sum + (+item.totalKcal || 0), 0));
    const exerciseKcal = Math.round(exercises.reduce((sum, item) => sum + (+item.calories || 0), 0));
    const exerciseMin = Math.round(exercises.reduce((sum, item) => sum + (+item.duration || 0), 0));
    const bmi = weight ? (weight.bmi || helpers.calcBMI(+weight.weight, user.height)) : null;

    this.setData({
      selectedDate: date,
      dayData: {
        date,
        weight,
        bmi,
        bmiStatus: bmi != null ? helpers.bmiStatus(bmi) : '',
        diets,
        dietKcal,
        exercises,
        exerciseKcal,
        exerciseMin,
        hasAny: !!(weight || diets.length || exercises.length)
      }
    });
  },

  onCalendarChange(e) {
    const date = e.detail && e.detail.date;
    if (!date) return;
    this.updateSelectedDay(date);
  }
});