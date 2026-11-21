const foods = [
  { name: '鸡胸肉', kcal: 165, protein: 31, fat: 3.6, carbs: 0, tags: ['protein', '高蛋白', '肉类'] },
  { name: '鸡蛋', kcal: 144, protein: 13, fat: 11, carbs: 1.3, tags: ['protein', '高蛋白', '早餐'], unit: '每100克（约2个）' },
  { name: '三文鱼', kcal: 208, protein: 20, fat: 13, carbs: 0, tags: ['protein', '鱼类', '优质脂肪'] },
  { name: '虾仁', kcal: 99, protein: 24, fat: 0.3, carbs: 0.2, tags: ['protein', '海鲜', '低脂'] },
  { name: '北豆腐', kcal: 81, protein: 8, fat: 4.5, carbs: 2, tags: ['protein', '豆制品'] },
  { name: '糙米饭', kcal: 123, protein: 2.7, fat: 1, carbs: 26, tags: ['staple', '主食', '粗粮'] },
  { name: '米饭', kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.9, tags: ['staple', '主食', '精米'] },
  { name: '燕麦', kcal: 389, protein: 16.9, fat: 6.9, carbs: 66, tags: ['staple', '主食', '早餐'] },
  { name: '全麦面包', kcal: 246, protein: 9, fat: 3.2, carbs: 46, tags: ['staple', '主食', '早餐'], unit: '每100克（约3片）' },
  { name: '红薯', kcal: 86, protein: 1.6, fat: 0.1, carbs: 20.1, tags: ['staple', '粗粮', '薯类'] },
  { name: '玉米', kcal: 106, protein: 3.3, fat: 1.2, carbs: 21, tags: ['staple', '粗粮'] },
  { name: '西兰花', kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, tags: ['vegetable', '蔬菜'] },
  { name: '菠菜', kcal: 23, protein: 2.9, fat: 0.4, carbs: 3.6, tags: ['vegetable', '蔬菜', '叶菜'] },
  { name: '黄瓜', kcal: 16, protein: 0.7, fat: 0.1, carbs: 3.6, tags: ['vegetable', '蔬菜', '低热量'] },
  { name: '番茄', kcal: 15, protein: 0.9, fat: 0.2, carbs: 3.3, tags: ['vegetable', '蔬菜'] },
  { name: '香蕉', kcal: 89, protein: 1.1, fat: 0.3, carbs: 23, tags: ['fruit', '水果'] },
  { name: '苹果', kcal: 53, protein: 0.3, fat: 0.2, carbs: 13.7, tags: ['fruit', '水果'] },
  { name: '橙子', kcal: 47, protein: 0.9, fat: 0.1, carbs: 11.8, tags: ['fruit', '水果'] },
  { name: '蓝莓', kcal: 57, protein: 0.7, fat: 0.3, carbs: 14.5, tags: ['fruit', '水果', '浆果'] },
  { name: '牛奶', kcal: 54, protein: 3.4, fat: 2.7, carbs: 4.7, tags: ['dairy', '奶类', '早餐'], unit: '每100毫升' },
  { name: '无糖酸奶', kcal: 72, protein: 5.8, fat: 2.7, carbs: 6.2, tags: ['dairy', '奶类', '加餐'] },
  { name: '西蓝花', kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, tags: ['vegetable', '蔬菜'], alias: ['西兰花'] },
  { name: '土豆', kcal: 77, protein: 2, fat: 0.1, carbs: 17.5, tags: ['staple', '薯类'] },
  { name: '花生', kcal: 567, protein: 25.8, fat: 49.2, carbs: 16.1, tags: ['nuts', '坚果', '高脂肪'] }
];

const normalize = text => (text || '').toString().trim().toLowerCase().replace(/[（()）：:，,。.、\s]/g, '');

function matches(food, key) {
  if (!key) return false;
  const name = normalize(food.name);
  const alias = (food.alias || []).map(normalize);
  const names = [name].concat(alias);
  return names.some(n => n.includes(key)) || food.tags.some(tag => normalize(tag).includes(key)) || key.includes(name) || alias.some(a => key.includes(a));
}

module.exports = {
  search(keyword) {
    const key = normalize(keyword);
    if (!key) return [];
    return foods.filter(food => matches(food, key)).map(food => ({
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      fat: food.fat,
      carbs: food.carbs,
      tags: food.tags,
      unit: food.unit || '每100克'
    }));
  },
  list: foods
};