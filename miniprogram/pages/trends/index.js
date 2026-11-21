const local=require('../../utils/local.js');
const RANGES=[
  {days:7,label:'7 天'},{days:15,label:'15 天'},{days:30,label:'30 天'},
  {days:45,label:'45 天'},{days:60,label:'60 天'}
];
const MAX_SPAN=1095;
const pad=n=>String(n).padStart(2,'0');
const toStr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());

Page({behaviors: [require('../../behaviors/theme.js')],
  data:{
    ranges:RANGES,
    range:30,
    mode:'range',
    customDays:'',
    weights:[],
    stat:{}
  },
  onLoad(){ this.load(); },
  onShow(){ this.load(); },
  setRange(e){ this.setData({ mode:'range', range:+e.currentTarget.dataset.r }); this.load(); },
  enableCustom(){ this.setData({ mode:'custom', customDays:this.data.customDays||'' }); },
  onCustomDays(e){ this.setData({ customDays:e.detail.value.replace(/\D/g,'') }); },
  applyCustom(){
    const days=Number(this.data.customDays);
    if(!Number.isInteger(days)||days<61){ wx.showToast({ title:'请输入大于 60 天的天数', icon:'none' }); return; }
    if(days>MAX_SPAN){ wx.showToast({ title:'查询跨度不能超过 3 年（1095 天）', icon:'none' }); return; }
    this.setData({ mode:'custom', range:days });
    this.load();
  },
  load(){
    let weights;
    const days=this.data.mode==='custom' ? Number(this.data.customDays) : this.data.range;
    if(!Number.isInteger(days)||days<1){ weights=[]; } else {
      const cutoff=new Date();
      cutoff.setDate(cutoff.getDate()-days+1);
      weights=local.listWeights().filter(x=>x.date>=toStr(cutoff)).sort((a,b)=>a.date.localeCompare(b.date));
    }
    weights=weights.map(x=>({ date:x.date, value:x.weight, bmi:x.bmi }));
    const vals=weights.map(x=>x.value);
    this.setData({
      weights:weights.slice().reverse(),
      stat:vals.length?{ max:Math.max(...vals).toFixed(1), min:Math.min(...vals).toFixed(1), drop:weights.length>1?(weights[0].value-weights[weights.length-1].value).toFixed(1):'0.0' }:{}
    });
    this.drawChart(weights);
  },
  drawChart(data){
    const query=wx.createSelectorQuery().in(this).select('#chart');
    query.fields({ width:1, height:1 }).exec(()=>{
      const w=wx.getSystemInfoSync().windowWidth-96,h=240,ctx=wx.createCanvasContext('weightChart',this);
      ctx.clearRect(0,0,w,h);
      if(!data.length){ ctx.draw(); return; }
      const vals=data.map(d=>d.value),min=Math.min(...vals)-1,max=Math.max(...vals)+1,pad=30,step=(w-pad*2)/Math.max(1,data.length-1),range=max-min||1;
      ctx.clearRect(0,0,w,h);
      ctx.setStrokeStyle('#3A7D44'); ctx.setLineWidth(2);
      data.forEach((d,i)=>{ const x=pad+step*i,y=pad+(h-pad*2)*(1-(d.value-min)/range); if(i)ctx.lineTo(x,y); else ctx.moveTo(x,y); });
      ctx.stroke();
      data.forEach((d,i)=>{ const x=pad+step*i,y=pad+(h-pad*2)*(1-(d.value-min)/range); ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.setFillStyle('#6DB33F'); ctx.fill(); });
      ctx.draw();
    });
  }
});