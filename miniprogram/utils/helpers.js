/** BMI mini-program shared utilities */

/** 计算 BMI */
exports.calcBMI = (weight, height) => {
  if (!weight || !height || height <= 0) return null;
  const h = height / 100;
  return +(weight / (h * h)).toFixed(1);
};

/** BMI 分类描述 */
exports.bmiStatus = (bmi) => {
  if (bmi == null) return '未知';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
};

/** Mifflin-St Jeor BMR */
exports.calcBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return null;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return +(gender === 'male' ? base + 5 : base - 161).toFixed(0);
};

/** TDEE = BMR × 活动系数 */
exports.calcTDEE = (bmr, activity) => {
  if (bmr == null) return null;
  const map = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 };
  return +(bmr * (map[activity] || 1.55)).toFixed(0);
};

/** 建议每日摄入 */
exports.suggestedCalories = (tdee, goal) => {
  if (tdee == null) return null;
  const map = { lose: 0.825, gain: 1.125, maintain: 1 };
  return +(tdee * (map[goal] || 1)).toFixed(0);
};

/** 目标进度 */
exports.goalProgress = (current, target, start) => {
  if (target == null || start == null || current == null) return 0;
  const total = Math.abs(start - target);
  if (total === 0) return 100;
  const done = Math.abs(start - current);
  return Math.min(100, +((done / total) * 100).toFixed(1));
};

/** 日期 YYYY-MM-DD */
exports.dateFormat = (ts) => {
  const d = new Date(ts || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 周几 */
exports.weekday = (ts) => {
  const day = new Date(ts || Date.now()).getDay();
  return ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'][day];
};

/** 存储用户 */
exports.saveUser = (userInfo) => wx.setStorageSync('bmi_user', userInfo);
exports.clearUser = () => wx.removeStorageSync('bmi_user');
