/**
 * 可选的联网健康搜索客户端（服务端代理适配层）。
 *
 * 安全边界：
 * - 本小程序是纯本地工程，没有自有后端，因此【默认禁用】联网搜索。
 * - 启用方法：开发者部署自己的 HTTPS 服务端代理（见 README「Bing 权威搜索回退」），
 *   通过该代理调用官方 Bing Web Search API（服务端持有订阅密钥，绝不下发到客户端），
 *   然后把代理地址写入本地配置键 bmi_search_cfg：{ "enabled": true, "proxyUrl": "https://你的域名/health-search" }。
 * - 客户端【不】直接抓取 bing.com 网页、【不】携带订阅密钥、【不】伪造联网结果。
 *   请求超时或未配置时一律返回 null，由调用方回退本地规则。
 *
 * 请求契约（POST JSON 到 proxyUrl）：
 *   请求  -> { "q": "用户查询词" }
 *   响应  -> { "sources": [ { "title": "标题", "url": "https://…", "domain": "www.who.int", "snippet": "摘要文本" } ] }
 *   仅当响应里的 domain 命中下方权威白名单时才允许展示其 snippet，否则忽略，绝不展示不可信来源。
 * 权威白名单示例： WHO、美国CDC、中国疾病预防控制中心、政府(.gov/.gov.cn)、主要医疗机构与卫生机构。
 */

const CFG_KEY = 'bmi_search_cfg';
const TIMEOUT_MS = 6000;

const AUTHORITATIVE = [
  'who.int', 'cdc.gov', 'chinacdc.cn', 'nhc.gov.cn', 'gov.cn',
  'who.org', 'fda.gov', 'mayoclinic.org', 'nhs.uk', 'health.gov',
  'pubmed.ncbi.nlm.nih.gov', 'dxy.cn', 'msdmanuals.cn'
];

function getConfig() {
  try {
    return wx.getStorageSync(CFG_KEY) || null;
  } catch (e) {
    return null;
  }
}

function isAuthoritative(host) {
  const h = (host || '').toLowerCase();
  return AUTHORITATIVE.some(d => h === d || h.endsWith('.' + d));
}

/**
 * 搜索健康关键词。配置启用且代理可达时返回简短来源列表（已权威白名单过滤）；
 * 否则返回 null，调用方应回退本地规则。绝不抛错、绝不伪造。
 * @param {string} q 查询词
 * @returns {Promise<Array<{title:string,url:string,domain:string,snippet:string}>|null>}
 */
function search(q) {
  const cfg = getConfig();
  if (!cfg || !cfg.enabled || !cfg.proxyUrl) return Promise.resolve(null);
  const keyword = (q || '').trim();
  if (!keyword) return Promise.resolve(null);
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done) { done = true; resolve(r); } };
    try {
      wx.request({
        url: cfg.proxyUrl,
        method: 'POST',
        timeout: TIMEOUT_MS,
        data: { q: keyword },
        success(res) {
          try {
            const sources = (res.data && res.data.sources) || [];
            const filtered = sources
              .filter(s => isAuthoritative(s.domain))
              .slice(0, 3)
              .map(s => ({ title: s.title || '', url: s.url || '', domain: s.domain || '', snippet: s.snippet || '' }));
            finish(filtered.length ? filtered : null);
          } catch (e) { finish(null); }
        },
        fail() { finish(null); }
      });
    } catch (e) { finish(null); }
  });
}

module.exports = { search, getConfig, setConfig: cfg => wx.setStorageSync(CFG_KEY, cfg), isAuthoritative };