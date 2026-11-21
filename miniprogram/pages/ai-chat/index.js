const local = require('../../utils/local.js');
const food = require('../../utils/food.js');
const online = require('../../utils/online-nutrition.js');
const createShareCard = require('../../utils/share.js');

const makeMessage = (id, role, content) => ({
  id,
  role,
  content,
  lines: role === 'assistant' ? String(content).split('\n').filter(Boolean) : []
});

Page({behaviors: [require('../../behaviors/theme.js')],
  data: {
    messages: [],
    input: '',
    toView: '',
    foodKeyword: '',
    foodResults: [],
    foodSearched: false,
    foodEmpty: false,
    foodLoading: false,
    foodSource: '',
    foodUpdated: ''
  },

  onLoad() {
    this.cid = 'conv_' + Date.now();
    this.setData({
      messages: [makeMessage('0', 'assistant', '\u4f60\u597d\uff01\u6211\u662f\u5065\u5eb7\u52a9\u624b\u3002\n\u672c\u5730\u6570\u636e\u4f18\u5148\uff0c\u672a\u627e\u5230\u65f6\u518d\u8054\u7f51\u67e5\u8be2\u3002\n\u4f60\u4e5f\u53ef\u4ee5\u95ee\u6211\u996e\u98df\u642d\u914d\u3001\u8fd0\u52a8\u5165\u95e8\u548c\u4f53\u91cd\u8d8b\u52bf\u3002')]
    });
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  quick(e) {
    this.setData({ input: e.currentTarget.dataset.t });
  },

  send() {
    const msg = this.data.input.trim();
    if (!msg) return;
    const now = Date.now();
    const messages = [
      ...this.data.messages,
      makeMessage('u' + now, 'user', msg),
      makeMessage('a' + now, 'assistant', this.reply(msg))
    ];
    this.setData({ input: '', messages, toView: 'm' + (messages.length - 1) });
    local.saveChat({ id: this.cid, first: msg, time: new Date().toLocaleString(), messages });
  },

  reply(msg) {
    const foods = food.search(msg);
    if (foods.length === 1) {
      const f = foods[0];
      return `${f.name}（${f.unit}）：热量 ${f.kcal} kcal，蛋白质 ${f.protein} 克，脂肪 ${f.fat} 克，碳水 ${f.carbs} 克。`;
    }
    return local.ruleReply(msg);
  },

  onFoodInput(e) {
    this.setData({ foodKeyword: e.detail.value });
  },

  onFoodConfirm() {
    this.searchFood();
  },

  async searchFood() {
    const keyword = (this.data.foodKeyword || '').trim();
    if (!keyword) {
      wx.showToast({ title: '请输入要查询的食物名称', icon: 'none' });
      return;
    }
    this.setData({ foodLoading: true, foodSearched: true, foodEmpty: false, foodSource: '', foodUpdated: '' });
    const res = await online.search(keyword);
    this.setData({
      foodResults: res.results,
      foodSearched: true,
      foodEmpty: res.results.length === 0,
      foodLoading: false,
      foodSource: res.source,
      foodUpdated: res.updated
    });
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/ai-history/index' });
  },

  onShareAppMessage() {
    return createShareCard('/pages/ai-chat/index', '健康体重管理 - AI健康助手');
  },
});