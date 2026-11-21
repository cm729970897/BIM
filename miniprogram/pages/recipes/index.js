const rc = require('../../utils/recipeCn.js');
Page({behaviors: [require('../../behaviors/theme.js')],
  data: { tag: 'all', list: [], showForm: false, form: { name: '', kcal: '', protein: '', ingredients: '', steps: '' } },
  onLoad() { this.fetch(); },
  setTag(e) { this.setData({ tag: e.currentTarget.dataset.t }); this.fetch(); },
  fetch() { this.setData({ list: rc.listRecipes(this.data.tag), showForm: false }); },
  goDetail(e) { wx.navigateTo({ url: '/pages/recipe-detail/index?id=' + e.currentTarget.dataset.id }); },
  openForm() { this.setData({ showForm: true }); },
  closeForm() { this.setData({ showForm: false }); },
  onInput(e) { const k = e.currentTarget.dataset.k; this.setData({ ['form.' + k]: e.detail.value }); },
  saveCustom() {
    const f = this.data.form;
    const name = (f.name || '').trim();
    if (!name) { wx.showToast({ title: '请填写食谱名称', icon: 'none' }); return; }
    const kcal = Math.max(0, +f.kcal || 0);
    const protein = Math.max(0, +f.protein || 0);
    const ingredients = (f.ingredients || '').split('\n').map(s => s.trim()).filter(Boolean);
    const steps = (f.steps || '').split('\n').map(s => s.trim()).filter(Boolean);
    rc.addCustomRecipe({
      id: 'custom_' + Date.now(),
      name,
      kcal,
      protein,
      fat: 0,
      carbs: 0,
      tags: ['custom'],
      ingredients,
      steps,
      custom: true
    });
    this.setData({ form: { name: '', kcal: '', protein: '', ingredients: '', steps: '' } });
    wx.showToast({ title: '已添加', icon: 'success' });
    this.fetch();
  }
});