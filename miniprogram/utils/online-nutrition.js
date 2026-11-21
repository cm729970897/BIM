const food = require('./food.js');

const ONLINE_ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';
const REQUEST_TIMEOUT = 8000;
const PAGE_SIZE = 5;

function toNum(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function mapProduct(p) {
  const n = p.nutriments || {};
  let kcal = toNum(n['energy-kcal_100g']);
  if (!kcal && n.energy_100g) kcal = Math.round(toNum(n.energy_100g) / 4.184);
  if (!kcal) return null;
  const tags = (p.categories_tags || []).slice(0, 3).map(t => (t || '').split(':').pop()).filter(Boolean);
  return {
    name: p.product_name_zh || p.product_name || p.generic_name || ('食物 ' + (p.code || '')),
    kcal: Math.round(kcal),
    protein: Math.round(toNum(n.proteins_100g) * 10) / 10,
    fat: Math.round(toNum(n.fat_100g) * 10) / 10,
    carbs: Math.round(toNum(n.carbohydrates_100g) * 10) / 10,
    unit: '每100克',
    tags,
    source: 'Open Food Facts',
    updated: formatDate(p.last_modified_t || p.last_modified_datetime)
  };
}

function searchOnline(keyword) {
  return new Promise(resolve => {
    let done = false;
    const finish = results => {
      if (!done) { done = true; resolve(results); }
    };
    try {
      wx.request({
        url: ONLINE_ENDPOINT,
        timeout: REQUEST_TIMEOUT,
        data: {
          search_terms: keyword,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: PAGE_SIZE,
          lc: 'zh',
          cc: 'cn'
        },
        success(res) {
          try {
            const products = (res.data && res.data.products) || [];
            const items = products.map(mapProduct).filter(Boolean);
            finish(items.slice(0, PAGE_SIZE));
          } catch (e) { finish([]); }
        },
        fail() { finish([]); }
      });
    } catch (e) { finish([]); }
  });
}

async function search(keyword) {
  const local = food.search(keyword).map(f => Object.assign({}, f, { source: '本地食物库', updated: '', online: false }));
  if (local.length) return { results: local, source: '本地数据', updated: '', online: false };
  let online = [];
  try { online = await searchOnline(keyword); } catch (e) { online = []; }
  if (online.length) {
    return { results: online, source: '联网数据', updated: online[0].updated, online: true };
  }
  return { results: [], source: '', updated: '', online: false };
}

module.exports = { search, searchOnline, ONLINE_ENDPOINT };
