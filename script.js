'use strict'
// 1行目に記載している 'use strict' は削除しないでください

const circles = document.querySelectorAll('[class^="circle"]');
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
  document.querySelectorAll('[class^="circle"]').forEach(e => e.remove());
  
  for (let i=0; i<num; i++){
    const size = num - i; // サイズが大きいものほど下に置く
    const circle = document.createElement('div');
    
    // 動的に .circle1, .circle2, ... をクラスに追加
    circle.classList.add(`circle${i+1}`);
    circle.dataset.size = size;
    
    // サイズに応じて幅を変える （最大200px、最小100px）
    const maxWidth = 200;
    const diffWidth = 25;
    let width = maxWidth;
    if (i > 0){
      width = maxWidth - diffWidth * i;
    }
    
    // スタイル適用
    circle.style.position = 'absolute';
    circle.style.width = `${width}px`;
    circle.style.height = '50px';
    circle.style.left = `${200 - width / 2 + 15}px`;
    circle.style.top = `${500 - i * 50}px`;
    circle.style.borderRadius = '10px';
    circle.style.textAlign = 'center';
    circle.style.cursor = 'grab';
    circle.style.userSelect = 'none';
    circle.style.display = 'table';
    circle.style.backgroundColor = colors[i];
    
    // 中央の数字表示
    const inner = document.createElement('div');
    inner.textContent = `${i+1}`;
    inner.style.display = 'table-cell';
    inner.style.verticalAlign = 'middle';
    
    circle.appendChild(inner);
    field.appendChild(circle);
    
    attachDragEvent(circle);
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
  
  return Array.from(document.querySelectorAll('[class^="circle"]')).some(other => {
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
function getTouchingStick(circle) {
  const circleRect = circle.getBoundingClientRect();
  return Array.from(document.querySelectorAll('.stick1, .stick2, .stick3')).find(stick => {
    const stickRect = stick.getBoundingClientRect();
    const isOverlapping =
    circleRect.right > stickRect.left &&
    circleRect.left < stickRect.right &&
    circleRect.bottom > stickRect.top &&
    circleRect.top < stickRect.bottom;
    return isOverlapping;
  }) || null;
}

function snapToStick(circle, stick){
  const field = document.querySelector('.field');
  const fieldRect = field.getBoundingClientRect();
  const stickRect = stick.getBoundingClientRect();
  const circleWidth = circle.offsetWidth;
  
  // 1. 左右中央に吸着（field基準に変換）
  const stickCenterInField = (stickRect.left - fieldRect.left) + stick.offsetWidth / 2;
  const newLeft = stickCenterInField - circleWidth / 2;
  
  // サイズ制限の追加
  const movingSize = parseInt(circle.dataset.size);
  
  // 2. 現在その棒に積まれている円盤の数を数える
  const placedCircles = Array.from(document.querySelectorAll('[class^="circle"]')).filter(other => {
    if (other === circle) return false;
    
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
      circle.style.left = `${originalPosition.left}px`;
      circle.style.top = `${originalPosition.top}px`;
      
      return; // スナップしない
    }
  }
  
  // 3. 上に積む位置を決定
  circle.style.left = `${newLeft}px`;
  
  const circleHeight = circle.offsetHeight;
  const stackIndex = placedCircles.length;
  const stickTop = stickRect.top - fieldRect.top;
  const newTop = stickTop + stick.offsetHeight - (stackIndex + 1) * circleHeight;
  
  circle.style.top = `${newTop}px`; 
  
}

function attachDragEvent(circle){
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let originalStick = null;
  
  circle.addEventListener('mousedown', (e) => {
    if (isCoveredByOther(circle)) {
      return;
    }
    
    // 現在位置を保存（吸着失敗時に戻す用）
    const computed = getComputedStyle(circle);
    originalPosition.left = parseInt(computed.left);
    originalPosition.top = parseInt(computed.top);
    
    console.log(originalPosition);
    
    isDragging = true;
    
    const rect = circle.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    originalStick = getTouchingStick(circle);
    
    // マウスをクリックしたとき
    const onMouseMove = (e) => {
      if (isDragging) {
        const left = e.clientX - fieldRect.left - offsetX;
        const top = e.clientY - fieldRect.top - offsetY;
        
        const maxLeft = field.clientWidth - circle.offsetWidth;
        const maxTop = field.clientHeight - circle.offsetHeight;
        circle.style.left = Math.max(0, Math.min(left, maxLeft)) + "px";
        circle.style.top = Math.max(0, Math.min(top, maxTop)) + "px";
        
        const touchingStick = getTouchingStick(circle);
        
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
      circle.style.cursor = 'grab';
      sticks.forEach(stick => stick.style.backgroundColor = 'brown');
      
      const stick = getTouchingStick(circle);
      // 円盤がスティックと触れている時
      if (stick) {
        snapToStick(circle, stick);
      }else{
        // 元の位置に戻す
        circle.style.left = `${originalPosition.left}px`;
        circle.style.top = `${originalPosition.top}px`;
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
  const allCircles = document.querySelectorAll('[class^="circle"]');
  const stick3 = document.querySelector('.stick3');
  const stick3Rect = stick3.getBoundingClientRect();
  
  // スティック3に乗っている円盤を取得
  const onStick3 = Array.from(allCircles).filter(circle => {
    const rect = circle.getBoundingClientRect();
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

function solveHanoi(n, from, to, aux, moves) {
  if (n === 0) return;
  // from から aux(経由) まで
  solveHanoi(n - 1, from, aux, to, moves);
  moves.push([from, to]);
  // aux(経由) から to まで
  solveHanoi(n - 1, aux, to, from, moves);
}

const stickMap = {
  'A': document.querySelector('.stick1'),
  'B': document.querySelector('.stick2'),
  'C': document.querySelector('.stick3')
};

function moveDiskAuto(fromStick, toStick) {
  // fromStick 上の一番上の円盤を取得
  const disksOnFrom = Array.from(document.querySelectorAll('[class^="circle"]')).filter(circle => {
    const rect = circle.getBoundingClientRect();
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

function autoSolve() {
  const numDisks = parseInt(range.value);
  const moves = [];

  // ステップ1: 移動手順を生成 from: A to: B ax(経由): C
  solveHanoi(numDisks, 'A', 'C', 'B', moves)

  // ステップ2: 移動を順に実行（毎秒1手ずつ）
  moves.forEach((move, index) => {
    setTimeout(() => {
      const [from, to] = move;
      moveDiskAuto(stickMap[from], stickMap[to]);
      checkGameClear();
    }, 700 * index); // 700ms間隔で再生
  });
}

document.getElementById("autoButton").addEventListener("click", () =>{
  // 初期化
  createDisks(parseInt(range.value));
  setTimeout(() => {
    autoSolve();
  }, 1000);
})

