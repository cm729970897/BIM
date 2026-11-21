const assert = require('node:assert/strict');
process.env.TZ = 'Asia/Shanghai';

const RealDate = Date;
let now = new RealDate('2026-11-20T23:55:00+08:00').getTime();
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
const storage = new Map([['bmi_user', { height: 170, weight: 65 }]]);
global.wx = {
  getStorageSync: key => storage.get(key),
  setStorageSync: (key, value) => storage.set(key, value),
  removeStorageSync: key => storage.delete(key),
  showToast() {},
  pageScrollTo() {}
};
global.Behavior = options => options;
let definition;
global.Page = options => { definition = options; };
require('../miniprogram/pages/record-weight/index.js');
const local = require('../miniprogram/utils/local.js');
const page = {
  ...definition,
  data: { ...definition.data },
  setData(data) { Object.assign(this.data, data); }
};
const dates = () => [page.data.date, page.data.dietDate, page.data.exerciseDate];
const showDay = day => assert.deepEqual(dates(), [day, day, day]);
const pick = value => ({ detail: { value } });

// The code was loaded yesterday. The first visit takes place at 00:15 local time,
// when the UTC date is still yesterday.
now = new RealDate('2026-11-21T00:15:00+08:00').getTime();
if (page.onLoad) page.onLoad();
page.onShow();
showDay('2026-11-21');

// Switching back to an existing tab after midnight must not keep yesterday.
now = new RealDate('2026-11-22T00:15:00+08:00').getTime();
page.onShow();
showDay('2026-11-22');

// Opening a panel while the record tab is still visible also refreshes defaults.
now = new RealDate('2026-11-23T00:15:00+08:00').getTime();
page.switchRecord({ currentTarget: { dataset: { p: 'exercise' } } });
showDay('2026-11-23');

// An unfinished backfill is kept across page shows, but the next record uses today.
page.onDate(pick('2026-11-19'));
page.onWeight(pick('64.5'));
page.onShow();
assert.equal(page.data.date, '2026-11-19');
page.submit();
assert.equal(local.listWeights()[0].date, '2026-11-19');
showDay('2026-11-23');

// Selecting an old date without entering a record does not change the next visit's default.
page.onDate(pick('2026-11-20'));
page.onShow();
showDay('2026-11-23');

// Diet and exercise use the chosen day on save and then reset their defaults.
page.onDietDate(pick('2026-11-19'));
page.onFoodName(pick('rice'));
page.onFoodKcal(pick('130'));
page.addFood();
page.onShow();
assert.equal(page.data.dietDate, '2026-11-19');
page.submitDiet();
assert.equal(local.listDiet()[0].date, '2026-11-19');
showDay('2026-11-23');

page.onExerciseDate(pick('2026-11-19'));
page.onExerciseField({ currentTarget: { dataset: { f: 'duration' } }, detail: { value: '20' } });
page.onShow();
assert.equal(page.data.exerciseDate, '2026-11-19');
page.submitExercise();
assert.equal(local.listExercise()[0].date, '2026-11-19');
assert.equal(page.data.todayMin, 0);
showDay('2026-11-23');

console.log('Record dates: local midnight, cached tab, panel switch, and manual backfill passed.');
