const app = getApp();
const local = require('../../utils/local.js');

Page({
  behaviors: [require('../../behaviors/theme.js')],
  exportData(){const data={user:local.getUser(),goal:local.getGoal(),weights:local.listWeights(),bodies:local.listBody(),diet:local.listDiet(),exercise:local.listExercise(),habits:local.getHabits()};wx.setClipboardData({data:JSON.stringify(data,null,2),success:()=>wx.showModal({title:'数据已复制',content:'完整 JSON 数据已复制到剪贴板，可保存到本地。',showCancel:false})});},clearData(){wx.showModal({title:'清空全部数据',content:'此操作不可恢复，确认清空所有本地记录吗？',success:r=>{if (r.confirm) {
        local.clearAll();
        // 同步清掉内存登录态；否则 setup.onShow 会误判为仍已建档并循环跳转。
        app.globalData.userInfo = null;
        app.globalData.userId = null;
        wx.reLaunch({ url: '/pages/setup/index' });
      }}});}});
