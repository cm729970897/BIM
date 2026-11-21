const H = require('./helpers.js');

const K = 'bmi_local_';
const SOURCE = {
  title: '央视网健康频道：合理膳食与体重管理相关科普',
  url: 'https://news.cctv.com/2025/03/11/ARTIFkTuOq9yugjFsGBqem0m250311.shtml',
  date: '2026-08-20',
  summary: [
    '控制体重不能只靠少吃，应在规律三餐基础上保证谷薯类、蔬菜水果、优质蛋白和奶豆类等食物多样。',
    '减重建议形成长期可坚持的能量缺口，少油少盐少糖，少喝含糖饮料，避免极端节食和快速反弹。',
    '体重管理要结合身体活动、充足睡眠和连续记录，重点观察 7 天以上趋势，而不是单日体重波动。'
  ]
};

const get = (name, fallback) => {
  const value = wx.getStorageSync(K + name);
  return value === undefined || value === null || value === '' ? fallback : value;
};
const put = (name, value) => (wx.setStorageSync(K + name, value), value);
const up = (name, item) => {
  const list = get(name, []);
  const index = list.findIndex(v => v.date === item.date);
  if (index < 0) list.push(item);
  else list[index] = { ...list[index], ...item };
  return put(name, list.sort((a, b) => b.date.localeCompare(a.date)));
};

const recipes = [
  {
    id: 'r1', name: '鸡胸彩蔬沙拉', tags: ['lose', 'low', 'protein', 'quick'], kcal: 280, protein: 32, fat: 10, carbs: 12,
    ingredients: ['鸡胸肉 150g', '生菜 80g', '番茄 1 个', '黄瓜半根', '橄榄油醋汁少量'],
    steps: ['鸡胸肉煎熟或水煮后切片', '蔬菜洗净切块', '加入少量油醋汁拌匀即可']
  },
  {
    id: 'r2', name: '三文鱼糙米饭', tags: ['healthy', 'protein'], kcal: 420, protein: 28, fat: 16, carbs: 38,
    ingredients: ['三文鱼 120g', '熟糙米饭 100g', '西兰花 100g', '胡萝卜 50g'],
    steps: ['糙米提前煮熟', '三文鱼少油煎熟', '西兰花和胡萝卜焯水', '按餐盘比例装盘']
  },
  {
    id: 'r3', name: '燕麦莓果早餐碗', tags: ['breakfast', 'low'], kcal: 260, protein: 10, fat: 6, carbs: 42,
    ingredients: ['燕麦 40g', '牛奶 200ml', '蓝莓或草莓 50g', '坚果碎少量'],
    steps: ['燕麦与牛奶小火煮至浓稠', '加入莓果', '撒少量坚果增加口感']
  },
  {
    id: 'r4', name: '豆腐虾仁快炒', tags: ['protein', 'quick', 'low'], kcal: 310, protein: 26, fat: 12, carbs: 8,
    ingredients: ['北豆腐 200g', '虾仁 100g', '彩椒 80g', '葱姜少量'],
    steps: ['虾仁去腥备用', '豆腐煎至微黄', '加入彩椒和虾仁快炒', '少盐调味']
  },
  {
    id: 'r5', name: '番茄牛肉杂粮面', tags: ['healthy', 'protein'], kcal: 460, protein: 30, fat: 12, carbs: 55,
    ingredients: ['瘦牛肉 100g', '番茄 2 个', '杂粮面 70g', '青菜 100g'],
    steps: ['番茄炒出汤汁', '加入牛肉片煮熟', '另煮杂粮面和青菜', '合并后少盐调味']
  }
];

const achievementDefs = [
  ['a1', '首次记录', '完成一次体重记录', '✅'],
  ['a2', '连续 7 天', '连续打卡满 7 天', '🔥'],
  ['a3', '连续 30 天', '连续打卡满 30 天', '🏅'],
  ['a4', '目标推进', '当前体重达到阶段目标', '🎯'],
  ['a5', '饮食记录员', '累计记录 10 天饮食', '🥗'],
  ['a6', '运动达人', '累计运动满 10 小时', '💪']
];

const getUser = () => wx.getStorageSync('bmi_user') || null;
const saveUser = data => {
  const user = { ...(getUser() || {}), ...data, _id: 'local-user' };
  wx.setStorageSync('bmi_user', user);
  return user;
};
const getGoal = () => get('goal', null);
const saveGoal = data => put('goal', { ...(getGoal() || {}), ...data });
const markHabit = (date, item) => {
  const habits = get('habits', {});
  habits[date] = { ...(habits[date] || {}), [item]: true };
  return put('habits', habits);
};

const listWeights = () => get('weights', []);
const saveWeight = data => {
  const user = getUser() || {};
  const item = { ...data, weight: +data.weight, bmi: H.calcBMI(+data.weight, user.height) };
  up('weights', item);
  saveUser({ weight: item.weight, bmi: item.bmi });
  markHabit(item.date, 'weight');
  return item;
};
const listBody = () => get('bodies', []);
const saveBody = data => up('bodies', data);
const listDiet = () => get('diets', []);
const saveDiet = data => { markHabit(data.date, 'diet'); return put('diets', [...listDiet(), data]); };
const listExercise = () => get('exercises', []);
const saveExercise = data => { markHabit(data.date, 'exercise'); return put('exercises', [...listExercise(), data]); };

const dailySummary = date => {
  const diet = listDiet().filter(x => x.date === date);
  const exercise = listExercise().filter(x => x.date === date);
  return {
    dietKcal: Math.round(diet.reduce((sum, item) => sum + (+item.totalKcal || 0), 0)),
    exerciseKcal: Math.round(exercise.reduce((sum, item) => sum + (+item.calories || 0), 0)),
    exerciseMin: Math.round(exercise.reduce((sum, item) => sum + (+item.duration || 0), 0)),
    habits: get('habits', {})[date] || {}
  };
};

const listCustomRecipes = () => get('custom_recipes', []);
const addCustomRecipe = data => {
  const recipe = {
    id: data.id || 'c_' + Date.now(),
    name: data.name || '自定义食谱',
    tags: data.tags && data.tags.length ? data.tags : ['custom'],
    kcal: +data.kcal || 0,
    protein: +data.protein || 0,
    fat: +data.fat || 0,
    carbs: +data.carbs || 0,
    ingredients: data.ingredients || [],
    steps: data.steps || [],
    custom: true
  };
  const list = [recipe, ...listCustomRecipes().filter(x => x.id !== recipe.id)];
  put('custom_recipes', list);
  return recipe;
};
const allRecipes = () => [...recipes, ...listCustomRecipes()];
const listRecipes = tag => {
  const list = allRecipes();
  return tag && tag !== 'all' ? list.filter(x => x.tags.includes(tag)) : list;
};
const getRecipe = id => allRecipes().find(x => x.id === id);

const getFavorites = () => get('favorites', []);
const toggleFavorite = recipe => {
  if (!recipe) return false;
  const favorites = getFavorites();
  const index = favorites.findIndex(x => x.id === recipe.id);
  if (index < 0) favorites.push(recipe);
  else favorites.splice(index, 1);
  put('favorites', favorites);
  return index < 0;
};
const getMenu = () => get('menu', []);
const addMenu = recipe => recipe ? put('menu', [...getMenu(), recipe]) : getMenu();

const buildWeeklyReport = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return H.dateFormat(d); });
  const weights = listWeights().filter(x => days.includes(x.date)).sort((a, b) => a.date.localeCompare(b.date));
  const diet = listDiet().filter(x => days.includes(x.date));
  const exercise = listExercise().filter(x => days.includes(x.date));
  const habits = get('habits', {});
  const drop = weights.length > 1 ? +(weights[0].weight - weights[weights.length - 1].weight).toFixed(1) : 0;
  return {
    period: days[0] + ' 至 ' + days[6],
    weightDrop: drop,
    dietKcal: Math.round(diet.reduce((sum, item) => sum + (+item.totalKcal || 0), 0)),
    exerciseKcal: Math.round(exercise.reduce((sum, item) => sum + (+item.calories || 0), 0)),
    exerciseDays: new Set(exercise.map(x => x.date)).size,
    checkinDays: days.filter(day => Object.keys(habits[day] || {}).length).length,
    suggestions: [
      '看 7 天趋势，不用被某一天的体重波动影响。',
      '每餐尽量包含主食、优质蛋白和蔬菜，少油少盐少糖。',
      '如果刚开始运动，先从每周 3 次、每次 20 分钟的快走或力量训练做起。',
      '建议结合睡眠、饮水和饮食记录一起复盘；如有疾病或不适，请咨询医生。'
    ],
    source: SOURCE
  };
};

const ruleReply = message => {
  const text = (message || '').trim();
  const user = getUser() || {};
  const goal = getGoal() || {};
  const note = `\n（以上建议仅供参考，不构成医疗诊断。）`;
  if (/(如何|怎么|如何计算|怎么算).*(热量|卡路里|摄入|TDEE)|热量(计算|怎么|如何)|怎么?算热量|\d+千卡|多少千卡|摄入热量|宏量|多少热量|热量换算|蛋白质?.*碳水|碳水.*蛋白质|三大营养|营养换算|消耗.*计算|计算.*消耗|怎么?算.*消耗|运动消耗|kcal计算|计算卡路里|卡路里计算|TDEE|tdee|基础代谢|代谢/i.test(text)) {
    const goalType = goal.type === 'gain' ? '增重/增肌' : goal.type === 'lose' ? '减脂' : '维持';
    const goalLine = user.dailyCalories ? `个人每日参考热量：约 ${user.dailyCalories} kcal（${goalType}）` : `可在建档页查看你的建议每日热量（目标：${goalType}）`;
    const weightLine = user.weight
      ? `运动消耗用现有系统自动算：MET×3.5×体重(${user.weight}kg)÷200×分钟，如快走(MET3.5)30分钟≈${Math.round(3.5*3.5*user.weight*30/200)} kcal（在记录训练页填写时长自动计算）`
      : `运动消耗：MET×3.5×体重(kg)÷200×分钟，例如快走30分钟约100 kcal（在记录训练页填写体重和时长会自动计算）`;
    const targetLine = goal.target && goal.type ? `你的目标（${goalType}）体重：${goal.target} kg` : '';
    return `【计算热量】\n① 食物摄入 = 食物每100g的kcal × 实际克数 ÷ 100\n② 宏量营养估算：蛋白4 kcal/g、碳水4 kcal/g、脂肪9 kcal/g\n③ ${weightLine}\n④ ${goalLine}${targetLine ? '\n⑤ ' + targetLine : ''}\n建议参考食物热量计算每日摄入，并结合训练页自动算的消耗微调。` + note;
  }
  if (/食谱|吃|饮食|膳食|热量|卡路里|早餐|午餐|晚餐|food|diet|calorie/i.test(text)) {
    return `建议按“主食适量 + 优质蛋白 + 大量蔬菜 + 少量健康脂肪”搭配。你当前每日热量参考约为 ${user.dailyCalories || '个人目标'} kcal；减脂时优先少油少糖、减少含糖饮料，不建议极端节食。可优先选择鸡胸肉、虾仁、豆腐、西兰花等低热量高蛋白食材，用助手的“食物热量查询”查看具体热量。` + note;
  }
  if (/运动|训练|锻炼|快走|力量|exercise|train/i.test(text)) {
    return '体重管理建议把有氧和力量训练结合起来：新手可每周 3 次快走 20～40 分钟，再加入深蹲、臀桥、平板支撑等基础力量动作。运动中如胸闷、头晕或疼痛，应立即停止。' + note;
  }
  if (/(BMI|体质指数|身体质量指数).*(计算|怎么|如何|多少)|(怎么|如何).*(算|计算).*(BMI|体质|指数)|^bmi/i.test(text) || /BMI计算|我的BMI|BMI怎么|计算BMI|bmi是多少|体质指数|身体质量指数/.test(text)) {
    const w = user.weight, h = user.height;
    if (w == null || h == null) {
      const missing = [];
      if (w == null) missing.push('体重');
      if (h == null) missing.push('身高');
      return `【计算BMI】\n公式：BMI = 体重(kg) ÷ 身高(m)²，即体重(kg) ÷ (身高(m) × 身高(m))\n你当前缺少：${missing.join('、')}。请到首页建档页填写后再查询。` + note;
    }
    const bmi = H.calcBMI(w, h);
    const cls = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
    return `【计算BMI】\n公式：BMI = 体重(kg) ÷ 身高(m)²\n你的体重 ${w} kg，身高 ${h} cm，BMI = ${bmi}，属${cls}。\n中国成人常用分类：<18.5 偏瘦，18.5-23.9 正常，24.0-27.9 超重，≥28 肥胖。\n注意 BMI 只是筛查指标，不能单独作为健康诊断。` + note;
  }
  if (/体重|减重|减脂|增重|目标|波动|bmi|weight/i.test(text)) {
    const target = goal.target ? `你的目标体重是 ${goal.target} kg，` : '';
    return `${target}建议关注 7 天以上趋势。体重会受饮水、盐分、睡眠和排便影响，单日上升不等于脂肪增加。更稳妥的做法是保持小幅能量缺口、规律记录和每周复盘。` + note;
  }
  if (/睡眠|熬夜|压力|习惯|sleep|stress/i.test(text)) {
    return '睡眠不足和压力会影响食欲与体重波动。建议固定作息，睡前减少屏幕和咖啡因，配合饮水、打卡和体重记录形成可持续习惯。' + note;
  }
  return '我可以离线回答饮食搭配、运动入门、体重趋势和习惯养成问题。你也可以问“今天吃什么”“如何安排减脂运动”“体重波动怎么办”。' + note;
};

const getAchievements = () => {
  const weights = listWeights();
  const diets = listDiet();
  const exercises = listExercise();
  const streak = wx.getStorageSync('bmi_streak') || 0;
  const goal = getGoal();
  const user = getUser() || {};
  return achievementDefs.map(([id, name, desc, icon]) => ({
    id, name, desc, icon,
    unlocked: (id === 'a1' && weights.length > 0) ||
      (id === 'a2' && streak >= 7) ||
      (id === 'a3' && streak >= 30) ||
      (id === 'a4' && goal && ((goal.type === 'gain' ? user.weight >= goal.target : user.weight <= goal.target))) ||
      (id === 'a5' && new Set(diets.map(x => x.date)).size >= 10) ||
      (id === 'a6' && exercises.reduce((sum, item) => sum + (+item.duration || 0), 0) >= 600)
  }));
};

const getChats = () => get('chats', []);
const saveChat = chat => put('chats', [chat, ...getChats().filter(x => x.id !== chat.id)]);
// 只清空用户健康数据；壁纸、联网配置等应用设置必须保留，避免重置后主题/配置读取异常。
const USER_DATA_KEYS = [
  'bmi_user',
  'bmi_local_goal', 'bmi_local_weights', 'bmi_local_bodies', 'bmi_local_diets',
  'bmi_local_exercises', 'bmi_local_habits', 'bmi_local_chats',
  'bmi_local_custom_recipes', 'bmi_local_favorites', 'bmi_local_menu',
  'bmi_streak', 'bmi_last_checkin', 'custom_training_plans'
];
const clearAll = () => {
  try {
    USER_DATA_KEYS.forEach(key => wx.removeStorageSync(key));
  } catch (e) {
    // 清空是尽力而为：即使某个键异常，也不让设置页崩溃。
    console.error('clear user data failed', e);
  }
};

const DEFAULT_WALLPAPERS = [
  { id: 'w1', name: '晨光绿意', type: 'gradient', theme: 'green', accent: '#3A7D44', css: 'linear-gradient(135deg, #A8D8B9, #EFF7CF)' },
  { id: 'w2', name: '深林暮色', type: 'gradient', theme: 'pink', accent: '#D17D94', css: 'linear-gradient(135deg, #E6A9BA, #8A4256)' }
];
const THEMES = {
  green: { key: 'green', accent: '#3A7D44', accentDark: '#2F6A37', accentSoft: '#EFF7EF', tab: '#3A7D44', nav: '#3A7D44' },
  pink: { key: 'pink', accent: '#D17D94', accentDark: '#AF5B72', accentSoft: '#FBEFF3', tab: '#D17D94', nav: '#AF5B72' }
};
// 兼容旧存储：旧版内置壁纸没有 theme 字段，按 id 回填；自定义图片一律默认绿色主题（保证可读性）
const normalizeWallpaperItem = item => {
  if (!item || item.type === 'image') {
    return item ? { ...item, theme: 'green', accent: THEMES.green.accent } : item;
  }
  const builtin = item.id ? DEFAULT_WALLPAPERS.find(b => b.id === item.id) : null;
  if (item.theme) return item;
  return { ...item, theme: builtin ? builtin.theme : 'green', accent: builtin ? builtin.accent : THEMES.green.accent };
};
const getWallpaper = () => {
  const cfg = get('wallpaper', null);
  if (cfg && cfg.items && cfg.items.length) return { ...cfg, items: cfg.items.map(normalizeWallpaperItem) };
  return { items: DEFAULT_WALLPAPERS, interval: 0 };
};
const saveWallpaper = cfg => put('wallpaper', cfg);
const currentWallpaper = () => {
  const cfg = getWallpaper();
  const items = cfg.items || [];
  if (!items.length) return null;
  const interval = +cfg.interval || 0;
  if (interval <= 0 || items.length === 1) return items[0];
  const idx = Math.floor(Date.now() / 1000 / interval) % items.length;
  return items[idx];
};
const getTheme = () => {
  const cur = currentWallpaper();
  const key = cur && cur.theme && THEMES[cur.theme] ? cur.theme : 'green';
  return THEMES[key] || THEMES.green;
};
const applyTheme = page => {
  const theme = getTheme();
  if (page && typeof page.setData === 'function') {
    page.setData({ themeKey: theme.key, themeAccent: theme.accent });
  }
  try {
    wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: theme.nav });
    wx.setTabBarStyle({ selectedColor: theme.tab, color: '#8E8E93' });
  } catch (e) {}
  return theme;
};

module.exports = {
  getUser, saveUser, getGoal, saveGoal,
  listWeights, saveWeight, listBody, saveBody, listDiet, saveDiet, listExercise, saveExercise,
  markHabit, getHabits: () => get('habits', {}), dailySummary,
  recipes, listRecipes, getRecipe, addCustomRecipe, listCustomRecipes,
  getFavorites, toggleFavorite, getMenu, addMenu,
  buildWeeklyReport, ruleReply, getAchievements,
  getChats, saveChat, clearAll, nutritionSource: SOURCE,
  wallpaper: { DEFAULT_WALLPAPERS, getWallpaper, saveWallpaper, currentWallpaper },
  getTheme, applyTheme
};
