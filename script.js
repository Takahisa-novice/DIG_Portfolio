'use strict'
// 1行目に記載している 'use strict' は削除しないでください

const disks = document.querySelectorAll('[class^="disk"]');
const sticks = document.querySelectorAll('.stick1, .stick2, .stick3');
const field = document.querySelector('.field');

let originalPosition = { left: 0, top: 0};

/* 動的に円盤の数を増やす */
const range = document.getElementById('diskRange');
const countLabel = document.getElementById('diskCount');
const colors = ['cornflowerblue', 'orange', 'palegreen', 'crimson', 'violet'];

countLabel.textContent = range.value;

const createDisks = (num) => {
  // 既存の Game Clear メッセージを除去
  const oldMsg = document.querySelector('.game-clear-msg');
  if (oldMsg) oldMsg.remove();

  // 既存の .circle1, .circle2, ... を削除
  document.querySelectorAll('[class^="disk"]').forEach(e => e.remove());
  
  for (let i=0; i<num; i++){
    const size = num - i; // サイズが大きいものほど下に置く
    const disk = document.createElement('div');
    
    // 動的に .circle1, .circle2, ... をクラスに追加
    disk.classList.add(`disk${i+1}`);
    disk.dataset.size = size;
    
    // サイズに応じて幅を変える （最大200px、最小100px）
    const maxWidth = 200;
    const diffWidth = 25;
    let width = maxWidth;
    if (i > 0){
      width = maxWidth - diffWidth * i;
    }
    
    // スタイル適用
    disk.style.position = 'absolute';
    disk.style.width = `${width}px`;
    disk.style.height = '50px';
    disk.style.left = `${200 - width / 2 + 15}px`;
    disk.style.top = `${500 - i * 50}px`;
    disk.style.borderRadius = '10px';
    disk.style.textAlign = 'center';
    disk.style.cursor = 'grab';
    disk.style.userSelect = 'none';
    disk.style.display = 'table';
    disk.style.backgroundColor = colors[i];
    
    // 中央の数字表示
    const inner = document.createElement('div');
    inner.textContent = `${i+1}`;
    inner.style.display = 'table-cell';
    inner.style.verticalAlign = 'middle';
    
    disk.appendChild(inner);
    field.appendChild(disk);
    
    attachDragEvent(disk);
  }
}

// 初期表示
createDisks(parseInt(range.value));
// ボタンにイベントをつける
document.getElementById("resetButton").addEventListener("click", () => {
  createDisks(parseInt(range.value));
});

// スライダーイベント
range.addEventListener('input', () => {
  const val = parseInt(range.value);
  countLabel.textContent = val;
  createDisks(val);
});

/* 対象の円盤の上に、他の円盤が接して重なっているかを判定*/
function isCoveredByOther(targetCircle){
  const targetRect = targetCircle.getBoundingClientRect();
  //const targetBottom = targetRect.top + targetRect.height;
  
  return Array.from(document.querySelectorAll('[class^="disk"]')).some(other => {
    if (other === targetCircle) return false;
    
    const otherRect = other.getBoundingClientRect();
    const otherRectBottom = otherRect.top + otherRect.height;
    // ターゲットの左上と他のオブジェクトの底が接する
    const verticalGap = Math.abs(targetRect.top - otherRectBottom);
    // 他のターゲットと水平方向に重なっているかどうか → 垂直方向に重なっていたら動かせない
    const horizontallyAligned = otherRect.left < targetRect.right && otherRect.right > targetRect.left;
    
    return verticalGap === 0 && horizontallyAligned;
  })
}

// 円盤が現在接しているstickがあれば返す
function getTouchingStick(disk) {
  const diskRect = disk.getBoundingClientRect();
  return Array.from(document.querySelectorAll('.stick1, .stick2, .stick3')).find(stick => {
    const stickRect = stick.getBoundingClientRect();
    const isOverlapping =
    diskRect.right > stickRect.left &&
    diskRect.left < stickRect.right &&
    diskRect.bottom > stickRect.top &&
    diskRect.top < stickRect.bottom;
    return isOverlapping;
  }) || null;
}

function snapToStick(disk, stick){
  const field = document.querySelector('.field');
  const fieldRect = field.getBoundingClientRect();
  const stickRect = stick.getBoundingClientRect();
  const circleWidth = disk.offsetWidth;
  
  // 1. 左右中央に吸着（field基準に変換）
  const stickCenterInField = (stickRect.left - fieldRect.left) + stick.offsetWidth / 2;
  const newLeft = stickCenterInField - circleWidth / 2;
  
  // サイズ制限の追加
  const movingSize = parseInt(disk.dataset.size);
  
  // 2. 現在その棒に積まれている円盤の数を数える
  const placedCircles = Array.from(document.querySelectorAll('[class^="disk"]')).filter(other => {
    if (other === disk) return false;
    
    const otherRect = other.getBoundingClientRect();
    const otherCenter = otherRect.left + otherRect.width / 2;
    const stickCenter = stickRect.left + stickRect.width / 2;
    return Math.abs(otherCenter - stickCenter) < 5;
  });
  
  if (placedCircles.length > 0){
    // 一番上にある円盤のサイズを取得
    const topDisk = placedCircles.reduce((top, curr) => {
      const topRect = top.getBoundingClientRect();
      const currRect = curr.getBoundingClientRect();
      return currRect.top < topRect.top ? curr : top;
    });
    
    const topSize = parseInt(topDisk.dataset.size);
    
    console.log(topSize);
    
    if (movingSize > topSize) {
      alert("小さい円盤の上に大きい円盤は置けません！");
      
      // 元の位置に戻す
      disk.style.left = `${originalPosition.left}px`;
      disk.style.top = `${originalPosition.top}px`;
      
      return; // スナップしない
    }
  }
  
  // 3. 上に積む位置を決定
  disk.style.left = `${newLeft}px`;
  
  const circleHeight = disk.offsetHeight;
  const stackIndex = placedCircles.length;
  const stickTop = stickRect.top - fieldRect.top;
  const newTop = stickTop + stick.offsetHeight - (stackIndex + 1) * circleHeight;
  
  disk.style.top = `${newTop}px`; 
  
}

function attachDragEvent(disk){
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let originalStick = null;
  
  disk.addEventListener('mousedown', (e) => {
    if (isCoveredByOther(disk)) {
      return;
    }
    
    // 現在位置を保存（吸着失敗時に戻す用）
    const computed = getComputedStyle(disk);
    originalPosition.left = parseInt(computed.left);
    originalPosition.top = parseInt(computed.top);
    
    console.log(originalPosition);
    
    isDragging = true;
    
    const rect = disk.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    originalStick = getTouchingStick(disk);
    
    // マウスをクリックしたとき
    const onMouseMove = (e) => {
      if (isDragging) {
        const left = e.clientX - fieldRect.left - offsetX;
        const top = e.clientY - fieldRect.top - offsetY;
        
        const maxLeft = field.clientWidth - disk.offsetWidth;
        const maxTop = field.clientHeight - disk.offsetHeight;
        disk.style.left = Math.max(0, Math.min(left, maxLeft)) + "px";
        disk.style.top = Math.max(0, Math.min(top, maxTop)) + "px";
        
        const touchingStick = getTouchingStick(disk);
        
        sticks.forEach(stick => {
          if (stick === touchingStick && stick !== originalStick) {
            stick.style.backgroundColor = 'lightpink';
          } else {
            stick.style.backgroundColor = 'brown';
          }
        });
      }
    };
    
    // マウスを手放した時
    const onMouseUp = () => {
      isDragging = false;
      disk.style.cursor = 'grab';
      sticks.forEach(stick => stick.style.backgroundColor = 'brown');
      
      const stick = getTouchingStick(disk);
      // 円盤がスティックと触れている時
      if (stick) {
        snapToStick(disk, stick);
      }else{
        // 元の位置に戻す
        disk.style.left = `${originalPosition.left}px`;
        disk.style.top = `${originalPosition.top}px`;
      }
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // ゲームクリア判定
      checkGameClear();
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });      
  
}

/* ゲームクリアをチェックする関数 */
function checkGameClear(){
  const allCircles = document.querySelectorAll('[class^="disk"]');
  const stick3 = document.querySelector('.stick3');
  const stick3Rect = stick3.getBoundingClientRect();
  
  // スティック3に乗っている円盤を取得
  const onStick3 = Array.from(allCircles).filter(disk => {
    const rect = disk.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 円盤の中心がスティック3の範囲内にあるかどうか
    return (
      centerX > stick3Rect.left &&
      centerX < stick3Rect.right &&
      centerY > stick3Rect.top &&
      centerY < stick3Rect.bottom
    );
  });
  
  // すべての円盤がスティック3に乗っているか？
  if (onStick3.length === allCircles.length) {
    showGameClearMessage();
  }
}

/* 表示用のメッセージ */
function showGameClearMessage() {
  if (document.querySelector('.game-clear-msg')) return; // 二重表示防止
  const msg = document.createElement('div');
  msg.classList.add('game-clear-msg');
  msg.textContent = '🎉 Game Clear! 🎉';
  msg.style.position = 'absolute';
  msg.style.top = '50%';
  msg.style.left = '50%';
  msg.style.transform = 'translate(-50%, -50%)';
  msg.style.fontSize = '48px';
  msg.style.fontWeight = 'bold';
  msg.style.color = 'green';
  msg.style.zIndex = 999;
  msg.style.backgroundColor = 'white';
  msg.style.padding = '20px';
  msg.style.borderRadius = '10px';
  msg.style.boxShadow = '0 0 10px gray';
  
  document.body.appendChild(msg);
}

// ------- 自動ソルバー --------

function hanoiDpWithNamedSticks(diskStateDict, goalStickName){
  const stickToNum = { "stick1": 0, "stick2": 1, "stick3": 2};
  const numToStick = { 0: "stick1", 1: "stick2", 2: "stick3"};
  const goalRod = stickToNum[goalStickName];

  const disks = Object.keys(diskStateDict).sort((a, b) => {
    return parseInt(b.replace("disk", "")) - parseInt(a.replace("disk", ""));
  });

  console.log(disks);

  const n = disks.length;

  const startState = disks.map(d => diskStateDict[d]);
  console.log(startState);
  const goalState = Array(n).fill(goalRod);

  const stateKey = (state) => state.join(",");
  
  const visited = new Map();
  visited.set(stateKey(startState), null);
  
  const queue = [startState];
  
  function legalMoves(state){
    const pegs = { 0: [], 1: [], 2: [] };
    for(let i = n - 1; i >= 0; i--){
      pegs[state[i]].push(i);
    }
  
    const moves = [];
    for (let f = 0; f < 3; f++){
      if (pegs[f].length === 0) continue;
      const disk = pegs[f][pegs[f].length - 1];
      for (let t = 0; t < 3; t++){
        if (f === t) continue;
        if (pegs[t].length === 0 || pegs[t][pegs[t].length - 1] > disk){
          const newState = [...state];
          newState[disk] = t;
          moves.push({ state: newState, disk, from: f, to: t });
        }
      }
    }
    return moves;
  }
  
  let foundGoal = false;
  
  while (queue.length > 0){
    const current = queue.shift();
    if (stateKey(current) === stateKey(goalState)){
      foundGoal = true;
      break;
    }
    
    for (const move of legalMoves(current)){
      const key = stateKey(move.state);
      if (!visited.has(key)){
        visited.set(key, {
          prev: current,
          disk: move.disk,
          from: move.from,
          to: move.to
        });
        queue.push(move.state);
      }
    }
  }
  
  // Reconstruct path
  const path = [];
  let state = goalState;
  while (visited.get(stateKey(state)) !== null){
    const info = visited.get(stateKey(state));
    path.push({
      disk: "disk" + (info.disk + 1),
      from: numToStick[info.from],
      to: numToStick[info.to]
    });
    state = info.prev;
  }
  path.reverse();
  return path;
}


const stickMap = {
  'stick1': document.querySelector('.stick1'),
  'stick2': document.querySelector('.stick2'),
  'stick3': document.querySelector('.stick3')
};

function moveDiskAuto(fromStick, toStick) {
  // fromStick 上の一番上の円盤を取得
  const disksOnFrom = Array.from(document.querySelectorAll('[class^="disk"]')).filter(disk => {
    const rect = disk.getBoundingClientRect();
    const fromRect = fromStick.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const fromCenter = fromRect.left + fromRect.width / 2;
    return Math.abs(center - fromCenter) < 5;
  });

  if (disksOnFrom.length === 0) return;

  // 一番上の円盤を探す
  const topDisk = disksOnFrom.reduce((top, curr) => {
    const topRect = top.getBoundingClientRect();
    const currRect = curr.getBoundingClientRect();
    return currRect.top < topRect.top ? curr : top;
  });

  // 吸着関数を使って移動させる
  snapToStick(topDisk, toStick);
}

// 現在の棒ごとの状態を取得
function getCurrentState(){
  const state = {};
  const disks = Array.from(document.querySelectorAll('[class^="disk"]'));
  const stickToNum = {"stick1": 0, "stick2": 1, "stick3": 2};

  disks.forEach(disk => {
    const diskRect = disk.getBoundingClientRect();
    const diskName = disk.className;
    const centerX = diskRect.left + diskRect.width / 2;

    ["stick1", "stick2", "stick3"].forEach(i => {
      const stickRect = stickMap[i].getBoundingClientRect();
      const stickCenterX = stickRect.left ; stickRect.width / 2;

      if (Math.abs(centerX - stickCenterX) < 30){
        state[diskName] = stickToNum[i];
      }
    })
  })
  return state;
}

function autoSolve() {
  const start = getCurrentState();

  const goal = "stick3";

  console.log(start);

  const steps = hanoiDpWithNamedSticks(start, goal);

  // ステップ2: 移動を順に実行（毎秒1手ずつ）
  steps.forEach((step, index) => {
    setTimeout(() => {
      // keyはstick1,stick2,stick3
      console.log(`${index + 1}. Move ${step.disk} from ${step.from} to ${step.to}`);
      moveDiskAuto(stickMap[step.from], stickMap[step.to]);
      checkGameClear();
    }, 700 * index); // 700ms間隔で再生
  });
}

document.getElementById("autoButton").addEventListener("click", () =>{
  // 初期化 createDisks(parseInt(range.value));
  setTimeout(() => {
    autoSolve();
  }, 1000);
})
