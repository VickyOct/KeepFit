'use strict';
(() => {
  const d = window.TRIAL_DATA;
  const $ = id => document.getElementById(id);
  if (!d) {$('source').textContent='分析结果尚未生成，请完成本机试验后刷新。';return;}
  const m = d.meta, offset = m.source_start_seconds, base='runs/free-throw/';
  const key = `basketball-review-v1:${m.video_id}:${offset}:${m.duration_seconds}`;
  let state = {selected:[],events:[],dismissed:[]}, history = [], activeCue = null, editing = null;
  try {const saved=JSON.parse(localStorage.getItem(key)); if(saved&&Array.isArray(saved.events)&&Array.isArray(saved.selected)&&Array.isArray(saved.dismissed)) state=saved;} catch {}
  const v = $('video'), ctx = $('overlay').getContext('2d');
  v.src=base+m.video_path;
  $('overlay').width=m.width;$('overlay').height=m.height;$('seek').max=m.duration_seconds;
  const trackMap = new Map(d.tracks.map(t=>[t.id,t]));
  const fmt = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
  const short = t => fmt(t).split('.')[0];
  $('source').textContent=`2026.06.30 · Snow White vs Wolf · 原视频 ${short(offset)}–${short(offset+m.duration_seconds)}`;
  $('bench').textContent=`${m.model} · CPU ${m.threads} 线程 · 输入 ${m.imgsz}px。抽取 ${m.sampled_frames} 帧，耗时 ${m.elapsed_seconds} 秒。${m.ball_detected_frames} 帧出现篮球检测框；这不是准确率或召回率。未进行球衣号码 OCR、投篮结果或助攻模型训练。`;
  function notify(s){$('message').textContent=s;}
  function save(before=true){if(before)history.push(localStorage.getItem(key));try{localStorage.setItem(key,JSON.stringify(state));}catch{notify('浏览器无法保存，请立即导出校对结果。');}render();}
  function change(fn){history.push(JSON.stringify(state));fn();save(false);}
  function seek(t){v.currentTime=Math.max(0,Math.min(m.duration_seconds,t));$('eventTime').value=fmt(offset+v.currentTime);draw();}
  function resetEditor(){activeCue=null;editing=null;$('note').value='';$('eventType').value='';$('eventTime').value=fmt(offset+v.currentTime);$('confirm').textContent='确认并计入 7 号';renderCues();}
  function nearestFrame(t){let lo=0,hi=d.frames.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(d.frames[mid].time<=t)lo=mid;else hi=mid-1;}return d.frames[lo];}
  function draw(){
    const ready=v.readyState>=2&&!v.seeking;
    ctx.clearRect(0,0,m.width,m.height);
    // Compose the decoded video and annotations together for embedded browsers.
    if(ready)ctx.drawImage(v,0,0,m.width,m.height);
    if(!v.error)$('videoStatus').textContent=ready?'':v.seeking?'正在定位视频画面…':'正在读取视频画面…';
    const frame=nearestFrame(v.currentTime);if(ready&&$('showBoxes').checked&&frame&&Math.abs(frame.time-v.currentTime)<.5){
    ctx.font='bold 24px Segoe UI';ctx.lineWidth=3;
    for(const p of frame.people){const [x,y,x2,y2]=p.box;const chosen=state.selected.includes(p.id),ref=p.id===m.reference?.track_id&&Math.abs(v.currentTime-m.reference.time)<.7;ctx.strokeStyle=chosen||ref?'#91ffad':p.red_fraction>.12?'#ffbd67':'#79d7f7';ctx.strokeRect(x,y,x2-x,y2-y);const label=`T${p.id}${chosen?' · 7':ref?' · 7号参考':''}`;const tw=ctx.measureText(label).width;ctx.fillStyle='#101316d9';ctx.fillRect(x,Math.max(0,y-31),tw+12,30);ctx.fillStyle=ctx.strokeStyle;ctx.fillText(label,x+5,Math.max(24,y-8));}
    for(const b of frame.balls){ctx.strokeStyle='#d4ff7d';ctx.strokeRect(b.box[0],b.box[1],b.box[2]-b.box[0],b.box[3]-b.box[1]);}
  }$('seek').value=v.currentTime;$('clock').textContent=`原视频 ${fmt(offset+v.currentTime)}`;$('youtube').href=m.source_url+'&t='+Math.floor(offset+v.currentTime);}
  function tick(){draw();if(!v.paused)requestAnimationFrame(tick);}
  // A paused initial seek also needs a repaint when its decoded frame arrives.
  if(typeof v.requestVideoFrameCallback==='function'){
    const presented=()=>{draw();v.requestVideoFrameCallback(presented);};
    v.requestVideoFrameCallback(presented);
  }
  v.addEventListener('play',()=>{$('play').textContent='暂停';if(typeof v.requestVideoFrameCallback!=='function')tick();});
  v.addEventListener('pause',()=>{$('play').textContent='播放';draw();});
  for(const event of ['loadeddata','canplay','seeked','seeking','waiting','timeupdate'])v.addEventListener(event,draw);
  v.addEventListener('loadedmetadata',()=>seek(Math.max(0,1879-offset)));
  $('reference').onclick=()=>{v.pause();seek(1879-offset);resetEditor();notify('用户指出这一刻的罚篮球员是红衣 7 号；命中结果需另行确认。');};
  v.addEventListener('error',()=>{
    const message=v.error?.code===3||v.error?.code===4?'浏览器无法解码此视频，可先通过下方链接在原视频核对。':'视频读取失败，请重新运行本机启动脚本后刷新页面。';
    $('videoStatus').textContent=message;ctx.clearRect(0,0,m.width,m.height);notify(message);
  });
  $('play').onclick=()=>v.paused?v.play().catch(()=>notify('无法播放视频，请检查本机文件。')):v.pause();
  $('back').onclick=()=>seek(v.currentTime-5);$('forward').onclick=()=>seek(v.currentTime+5);$('seek').oninput=e=>seek(Number(e.target.value));$('rate').onchange=e=>v.playbackRate=Number(e.target.value);$('showBoxes').onchange=draw;
  $('useTime').onclick=()=>$('eventTime').value=fmt(offset+v.currentTime);$('newEvent').onclick=()=>{resetEditor();notify('可手动补录模型漏掉的事件。');};
  $('confirm').onclick=()=>{
    if(!TrialStats.labels[$('eventType').value]){notify('请先选择已核对的事件类型。');return;}
    const match=/^(\d+):([0-5]?\d(?:\.\d+)?)$/.exec($('eventTime').value.trim());
    if(!match){notify('时间请填写为 分:秒，例如 06:12.5。');return;}
    const time=Number(match[1])*60+Number(match[2])-offset;
    if(time<0||time>m.duration_seconds){notify('时间必须在当前片段范围内。');return;}
    const existing=editing||state.events.find(e=>activeCue&&e.cue_id===activeCue.id)?.id;
    const event={id:existing||crypto.randomUUID(),player:'wolf7',type:$('eventType').value,status:'confirmed',time:Math.round(time*1000)/1000,source_time:Math.round((offset+time)*1000)/1000,note:$('note').value.trim(),cue_id:activeCue?.id||state.events.find(e=>e.id===editing)?.cue_id||null,track_id:activeCue?.track_id||null};
    change(()=>{state.events=state.events.filter(e=>e.id!==event.id);state.events.push(event);});resetEditor();notify('已保存到本机校对记录。');
  };
  function button(text,handler){const b=document.createElement('button');b.textContent=text;b.onclick=handler;return b;}
  function renderCues(){const el=$('cues');el.replaceChildren();const filter=$('cueFilter').value;
    const cues=d.cues.filter(c=>filter==='all'||filter==='selected'&&state.selected.includes(c.track_id)||filter==='red'&&(trackMap.get(c.track_id)?.red_fraction||0)>.12);
    $('cueCount').textContent=`(${cues.length})`;
    if(!cues.length){el.textContent=filter==='selected'?'先在下方关联 7 号轨迹；也可手动补录事件。':'没有符合条件的提示；这不代表没有发生出手。';return;}
    for(const cue of cues){const row=document.createElement('div');row.className='cue'+(activeCue?.id===cue.id?' active':'');const done=state.dismissed.includes(cue.id)||state.events.some(e=>e.cue_id===cue.id);if(done)row.classList.add('done');
      row.append(button(`${short(offset+cue.time)} · T${cue.track_id}${cue.origin==='user_reference'?' · 你的罚篮参考':''}${done?' · 已处理':''}`,()=>{v.pause();resetEditor();activeCue=cue;seek(cue.time-2);$('eventTime').value=fmt(offset+cue.time);renderCues();notify(cue.origin==='user_reference'?'用户提供的罚篮参考；出手时间和命中结果仍需确认。':'请先确认是不是 7 号，再判断事件。');}));
      row.append(button(state.dismissed.includes(cue.id)?'恢复提示':'忽略',()=>change(()=>{state.dismissed=state.dismissed.includes(cue.id)?state.dismissed.filter(x=>x!==cue.id):[...state.dismissed,cue.id];})));el.append(row);
    }
  }
  function renderGallery(){const gallery=$('gallery');gallery.replaceChildren();const shown=d.tracks.filter(t=>t.samples>=5&&(!$('redOnly').checked||t.red_fraction>.12)).sort((a,b)=>(b.id===m.reference?.track_id)-(a.id===m.reference?.track_id)||a.start-b.start);
    for(const t of shown){const card=document.createElement('div');card.className='track'+(state.selected.includes(t.id)?' selected':'');const title=document.createElement('h3');title.textContent=`T${t.id} · ${short(offset+t.start)}–${short(offset+t.end)}`;card.append(title);if(t.id===m.reference?.track_id){const hint=document.createElement('p');hint.className='small';hint.style.color='var(--green)';hint.textContent='31:19 罚篮参考轨迹 · 整段待核对';card.append(hint);}
      const crops=document.createElement('div');crops.className='crops';for(const c of t.crops){const b=button('',()=>{v.pause();seek(c.time);});const img=document.createElement('img');img.src=base+c.path;img.alt=`T${t.id}，原视频 ${fmt(offset+c.time)}`;img.loading='lazy';b.append(img);crops.append(b);}card.append(crops);
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state.selected.includes(t.id);input.onchange=()=>change(()=>{state.selected=input.checked?[...state.selected,t.id]:state.selected.filter(x=>x!==t.id);});label.append(input,document.createTextNode(' 我确认这段属于红衣 7 号'));card.append(label);gallery.append(card);
    }if(!shown.length)gallery.textContent='没有符合筛选条件的轨迹。取消红衣筛选查看全部。';
  }
  function render(){const s=TrialStats.summarize(state.events),has=s.confirmed>0;$('points').textContent=has?s.points:'—';$('fg').textContent=has?`${s.fgm} / ${s.fga}`:'—';$('three').textContent=has?`${s.threeMade} / ${s.threeAttempts}`:'—';$('ft').textContent=has?`${s.ftm} / ${s.fta}`:'—';$('assists').textContent=has?s.assists:'—';$('coverage').textContent=has?`已确认 ${s.confirmed} 条事件，仅代表已核对部分；不是整场统计。`:'尚未确认任何事件，横线不代表零次。';
    const events=$('events');events.replaceChildren();$('eventCount').textContent=`(${s.confirmed})`;
    for(const e of [...state.events].sort((a,b)=>a.time-b.time)){const row=document.createElement('div');row.className='event';row.append(button(`${short(offset+e.time)} ${TrialStats.labels[e.type]}`,()=>{v.pause();seek(e.time);editing=e.id;activeCue=null;$('eventTime').value=fmt(offset+e.time);$('eventType').value=e.type;$('note').value=e.note||'';$('confirm').textContent='保存修改';}));row.append(button('移除',()=>change(()=>{state.events=state.events.filter(x=>x.id!==e.id);})));events.append(row);}
    if(!state.events.length){events.className='empty';events.textContent='还没有确认的统计。';}else events.className='';
    $('undo').disabled=!history.length;renderCues();renderGallery();draw();
  }
  $('undo').onclick=()=>{const prev=history.pop();if(prev){state=JSON.parse(prev);save(false);resetEditor();notify('已撤销最近一次修改。');}};
  $('export').onclick=()=>{const payload={schema_version:1,source:m.source_url,source_start_seconds:offset,clip_duration_seconds:m.duration_seconds,target:'Wolf #7',coverage:'manually_confirmed_events_only',...state,stats:TrialStats.summarize(state.events)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`wolf7-${m.video_id}-${offset}-review.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('校对结果已导出。');};
  $('cueFilter').onchange=renderCues;$('redOnly').onchange=renderGallery;
  render();
})();
