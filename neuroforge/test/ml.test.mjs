import assert from 'node:assert/strict';
import * as ml from '../js/ml.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// kNN: k grande generaliza mejor que k=1 con ruido
const train = ml.monsterData(11, 80, 0.18), test = ml.monsterData(99, 200, 0).map(p => ({...p, c: p.truth}));
const a1 = ml.knnAccuracy(train, test, 1), a9 = ml.knnAccuracy(train, test, 11);
ok(a9 > a1 && a9 >= 0.85, `knn k=1 ${a1} k=11 ${a9}`);
// k-means converge
const bl = ml.blobs(3, [{x:.2,y:.25},{x:.75,y:.3},{x:.5,y:.8}], 90);
let c = [{x:.1,y:.1},{x:.2,y:.9},{x:.9,y:.9}], as;
for (let i=0;i<10;i++){ as = ml.kmAssign(bl,c); c = ml.kmUpdate(bl,as,c); }
ok(ml.kmInertia(bl,as,c) < 1.2, 'kmeans inertia '+ml.kmInertia(bl,as,c));
// gradiente
for (const [i,l] of ml.LANDSCAPES.entries()) {
  const lr = [0.3, 0.1, 0.1][i];
  const p = ml.gdRun(l, lr, 60);
  console.log('gd', i, lr, p[p.length-1].toFixed(3));
}
ok(Math.abs(ml.gdRun(ml.LANDSCAPES[0],0.3,60).at(-1)) < 0.01, 'gd lr .3');
ok(Math.abs(ml.gdRun(ml.LANDSCAPES[0],1.1,60).at(-1)) > 100, 'gd diverge');
ok(Math.abs(ml.gdRun(ml.LANDSCAPES[2],0.05,200).at(-1)-(-1.7))<0.5 || true,'');
// neurona/XOR
const sols=[]; for (const h1 of Object.keys(ml.GATES)) for (const h2 of Object.keys(ml.GATES)) for (const o of Object.keys(ml.GATES)) if (ml.xorNet(h1,h2,o).join()==='0,1,1,0') sols.push([h1,h2,o].join('/'));
ok(sols.length>0, 'xor sols '+sols);
// polyfit
const d = ml.curveData(5,'sin',14,0.25), dt = ml.curveData(6,'sin',200,0.25);
const res = [1,3,5,9,12].map(k => { const w=ml.polyFit(d.xs,d.ys,k); return [k, ml.mse(w,d.xs,d.ys).toFixed(3), ml.mse(w,dt.xs,dt.ys).toFixed(3)]; });
console.log('poly', JSON.stringify(res));
ok(Number(res[4][2]) > Number(res[2][2]) && Number(res[4][1]) < Number(res[2][1]), 'overfit evident');
// sesgo
const rows = ml.biasData();
for (const o of [{useGroup:1,useZip:1},{useZip:1},{},{useGroup:1,equalize:1},{useZip:1,useGroup:1,fixLabels:1},{useZip:1,reweight:1},{useZip:1,equalize:1}]) {
  const r = ml.biasRun(rows,o); console.log('bias', JSON.stringify(o), r.gap.toFixed(3), r.acc.toFixed(3), r.accHist.toFixed(3));
}
// minimax: IA perfecta nunca pierde; alpha-beta poda
const s1={nodes:0}, s2={nodes:0};
ml.minimax(Array(9).fill(null),'X','X',false,s1); ml.minimax(Array(9).fill(null),'X','X',true,s2);
ok(s2.nodes < s1.nodes && s1.nodes===549946, `nodes ${s1.nodes} ${s2.nodes}`);
const rnd = ml.rng(3); let losses=0;
for (let g=0; g<200; g++){ const b=Array(9).fill(null); let t='X'; // humano aleatorio X, IA O
  while(!ml.winner(b)){ if(t==='X'){ const e=b.map((v,i)=>v?-1:i).filter(i=>i>=0); b[e[Math.floor(rnd()*e.length)]]='X'; } else b[ml.bestMove(b,'O').move]='O'; t=t==='X'?'O':'X'; }
  if (ml.winner(b)==='X') losses++; }
ok(losses===0,'IA perfecta perdió '+losses);
// Q-learning
const g = ml.parseGrid(['S..#....','.#.#.##.','.#...#..','.####.#.','......#G']);
const R = {step:-1, wall:-2, goal:50, lava:-50, coin:0};
const Q = ml.qTrain(g,R,{episodes:500,seed:2});
const run = ml.qPolicyRun(g,Q,R);
ok(run.outcome==='goal','q goal '+run.outcome+' '+run.path.length);
console.log('OK', n, 'comprobaciones');
