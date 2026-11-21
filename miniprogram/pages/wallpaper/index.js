const local = require('../../utils/local.js');
const wallpaperUtil = local.wallpaper;

const INTERVAL_OPTIONS = [
  { label: '关闭自动切换', value: 0 },
  { label: '每 30 秒', value: 30 },
  { label: '每 1 分钟', value: 60 },
  { label: '每 5 分钟', value: 300 }
];

Page({behaviors: [require('../../behaviors/theme.js')], 
  data: {
    builtin: [],
    custom: [],
    intervalOptions: INTERVAL_OPTIONS,
    intervalIdx: 0,
    intervalText: '关闭自动切换',
    previewCss: '',
    previewImg: '',
    hasWallpaper: false
  },

  onLoad() {
    this.load();
  },

  load() {
    const cfg = wallpaperUtil.getWallpaper();
    const items = cfg.items || [];
    const ids = items.map(i => i.id);
    const builtinPool = wallpaperUtil.DEFAULT_WALLPAPERS;
    const builtin = builtinPool.map(b => ({ ...b, on: ids.indexOf(b.id) >= 0 }));
    const custom = (cfg.items || []).filter(i => i.type === 'image').map(c => ({ ...c, on: true }));
    const intervalIdx = Math.max(0, INTERVAL_OPTIONS.findIndex(o => o.value === +cfg.interval));
    const cur = wallpaperUtil.currentWallpaper();
    this.setData({
      builtin,
      custom,
      intervalIdx,
      intervalText: INTERVAL_OPTIONS[intervalIdx].label,
      previewCss: cur && cur.type === 'gradient' ? cur.css : '',
      previewImg: cur && cur.type === 'image' ? cur.path : '',
      hasWallpaper: items.length > 0
    });
  },

  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const cfg = wallpaperUtil.getWallpaper();
    let items = cfg.items || [];
    const idx = items.findIndex(i => i.id === id);
    let item = null;
    if (idx >= 0) {
      items = items.filter(i => i.id !== id);
    } else {
      const pool = [...wallpaperUtil.DEFAULT_WALLPAPERS, ...(cfg.items || [])];
      item = pool.find(i => i.id === id);
      if (item) items.push(item);
    }
    if (items.length === 0) {
      wx.showToast({ title: '至少保留一张壁纸', icon: 'none' });
      return;
    }
    wallpaperUtil.saveWallpaper({ ...cfg, items });
    this.load();
    if (item) {
      this.setData({ previewCss: item.type === 'gradient' ? item.css : '', previewImg: item.type === 'image' ? item.path : '' });
    }
  },

  previewItem(e) {
    const id = e.currentTarget.dataset.id;
    const pool = [...wallpaperUtil.DEFAULT_WALLPAPERS, ...(this.data.custom)];
    const item = pool.find(i => i.id === id);
    if (!item) return;
    this.setData({
      previewCss: item.type === 'gradient' ? item.css : '',
      previewImg: item.type === 'image' ? item.path : ''
    });
  },

  setInterval(e) {
    const idx = +e.detail.value;
    const cfg = wallpaperUtil.getWallpaper();
    wallpaperUtil.saveWallpaper({ ...cfg, interval: INTERVAL_OPTIONS[idx].value });
    this.setData({ intervalIdx: idx, intervalText: INTERVAL_OPTIONS[idx].label });
  },

  chooseImage() {
    const imgOk = wx.chooseImage;
    const picker = imgOk || wx.chooseMedia;
    picker.call(wx, {
      count: 9,
      sizeType: ['compressed'],
      mediaType: imgOk ? undefined : ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPaths = imgOk ? (res.tempFilePaths || []) : res.tempFiles.map(f => f.tempFilePath);
        if (!tempPaths.length) return;
        let done = 0;
        const added = [];
        tempPaths.forEach((p, i) => {
          wx.saveFile({
            tempFilePath: p,
            success: (s) => {
              added.push({ id: 'img_' + Date.now() + '_' + i, type: 'image', name: '自定义壁纸', path: s.savedFilePath });
              done++;
              if (done === tempPaths.length) this.addImages(added);
            },
            fail: () => {
              added.push({ id: 'img_' + Date.now() + '_' + i, type: 'image', name: '自定义壁纸', path: p });
              done++;
              if (done === tempPaths.length) this.addImages(added);
            }
          });
        });
      },
      fail: () => {
        wx.showToast({ title: '未选择图片', icon: 'none' });
      }
    });
  },

  addImages(added) {
    const cfg = wallpaperUtil.getWallpaper();
    const items = (cfg.items || []).concat(added);
    wallpaperUtil.saveWallpaper({ ...cfg, items });
    this.load();
    wx.showToast({ title: '已添加 ' + added.length + ' 张壁纸', icon: 'success' });
  },

  removeImage(e) {
    const id = e.currentTarget.dataset.id;
    const cfg = wallpaperUtil.getWallpaper();
    const items = (cfg.items || []).filter(i => i.id !== id);
    wallpaperUtil.saveWallpaper({ ...cfg, items });
    this.load();
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});