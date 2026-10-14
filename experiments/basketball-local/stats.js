(function (root) {
  'use strict';
  const labels = {two_made:'两分命中',two_miss:'两分未中',three_made:'三分命中',three_miss:'三分未中',ft_made:'罚球命中',ft_miss:'罚球未中',assist:'助攻'};
  function summarize(events) {
    const s = {points:0,fgm:0,fga:0,threeMade:0,threeAttempts:0,ftm:0,fta:0,assists:0,confirmed:0};
    const seen = new Set();
    for (const e of events) {
      if (!e.id || seen.has(e.id) || e.status !== 'confirmed' || e.player !== 'wolf7' || !labels[e.type]) continue;
      seen.add(e.id); s.confirmed++;
      if (e.type.startsWith('two_') || e.type.startsWith('three_')) {
        s.fga++;
        if (e.type.endsWith('_made')) {s.fgm++; s.points += e.type.startsWith('two_') ? 2 : 3;}
        if (e.type.startsWith('three_')) {s.threeAttempts++; if (e.type === 'three_made') s.threeMade++;}
      } else if (e.type.startsWith('ft_')) {
        s.fta++; if (e.type === 'ft_made') {s.ftm++; s.points++;}
      } else if (e.type === 'assist') s.assists++;
    }
    return s;
  }
  const api = {labels, summarize};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TrialStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
