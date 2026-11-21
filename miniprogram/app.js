App({
  globalData: {
    userId: null,
    userInfo: null
  },
  onLaunch() {
    const user = wx.getStorageSync('bmi_user');
    if (user) {
      this.globalData.userId = user._id || user.userId;
      this.globalData.userInfo = user;
    }
  },
  getUser() {
    return this.globalData.userInfo;
  },
  getUserId() {
    return this.globalData.userId;
  }
});
