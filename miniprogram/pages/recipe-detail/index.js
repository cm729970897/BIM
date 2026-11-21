const local = require('../../utils/local.js');
const rc = require('../../utils/recipeCn.js');

Page({behaviors: [require('../../behaviors/theme.js')],
  data: { recipe: null, favorited: false },

  onLoad(options) {
    this.recipeId = options.id;
    const recipe = rc.getRecipe(options.id);
    this.setData({
      recipe,
      favorited: local.getFavorites().some(x => x.id === options.id)
    });
  },

  addMealPlan() {
    if (!this.data.recipe) return;
    local.addMenu(this.data.recipe);
    wx.showToast({ title: '已加入菜单', icon: 'success' });
  },

  toggleFav() {
    if (!this.data.recipe) return;
    const favorited = local.toggleFavorite(this.data.recipe);
    this.setData({ favorited });
    wx.showToast({ title: favorited ? '已收藏' : '已取消收藏', icon: 'success' });
  }
});
