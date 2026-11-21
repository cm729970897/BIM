const local = require('./local.js');

const TAG = {
  lose: '减脂',
  breakfast: '早餐',
  protein: '高蛋白',
  low: '低热量',
  quick: '快手',
  healthy: '健康',
  custom: '自定义'
};

const ZH = {
  r1: {
    name: '鸡胸肉蔬菜沙拉',
    ingredients: ['鸡胸肉 150g', '生菜', '番茄', '黄瓜'],
    steps: ['鸡胸肉煮熟切块', '蔬菜洗净沥干', '淋上清淡酱汁拌匀']
  },
  r2: {
    name: '三文鱼糙米饭',
    ingredients: ['三文鱼 120g', '糙米 80g', '西兰花'],
    steps: ['糙米煮熟', '三文鱼煎至熟', '装盘搭配西兰花']
  },
  r3: {
    name: '燕麦莓果碗',
    ingredients: ['燕麦 40g', '莓果 50g', '牛奶 200ml'],
    steps: ['燕麦加热', '加入莓果', '倒入牛奶拌匀']
  },
  r4: {
    name: '豆腐虾仁小炒',
    ingredients: ['豆腐 200g', '虾仁 100g', '青椒'],
    steps: ['虾仁处理干净', '豆腐切块煎香', '一起翻炒调味']
  }
};

function zhTags(tags) {
  return (tags || []).map(t => TAG[t] || t);
}

function zh(r) {
  if (!r) return null;
  const c = ZH[r.id];
  if (c) {
    return Object.assign({}, r, {
      name: c.name,
      ingredients: c.ingredients,
      steps: c.steps,
      tags: zhTags(r.tags)
    });
  }
  return Object.assign({}, r, { tags: zhTags(r.tags) });
}

function listRecipes(tag) {
  const all = local.listRecipes(tag);
  const custom = listCustom();
  const base = tag && tag !== 'all' ? all : all.concat(custom);
  return base.map(zh);
}

function listCustom() {
  return typeof local.listCustomRecipes === 'function' ? local.listCustomRecipes() : [];
}

function getRecipe(id) {
  const r = local.getRecipe(id) || listCustom().find(x => x.id === id);
  return zh(r);
}

function addCustomRecipe(r) {
  if (typeof local.addCustomRecipe === 'function') {
    return local.addCustomRecipe(r);
  }
  return r;
}

module.exports = { zh, zhTags, listRecipes, listCustom, getRecipe, addCustomRecipe };