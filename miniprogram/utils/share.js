function createShareCard(path = '/pages/index/index', title = '健康体重管理 - 记录体重、饮食、运动') {
  return { title, path, imageUrl: '/static/share-cover.png' };
}

module.exports = createShareCard;
