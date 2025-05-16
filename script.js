'use strict'
// 1行目に記載している 'use strict' は削除しないでください

document.addEventListener("DOMContentLoaded", () => {
  const circles = document.querySelectorAll('.circle1, .circle2, .circle3');
  const sticks = document.querySelectorAll('.stick1, .stick2, .stick3');
  const field = document.querySelector('.field');
  let originalPosition = { left: 0, top: 0};
  
  circles.forEach(circle => {
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

      const onMouseUp = () => {
        isDragging = false;
        circle.style.cursor = 'grab';
        sticks.forEach(stick => stick.style.backgroundColor = 'brown');

        const stick = getTouchingStick(circle);
        if (stick) {
          snapToStick(circle, stick);
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });      
  });

  /* 対象の円盤の上に、他の円盤が接して重なっているかを判定*/
  function isCoveredByOther(targetCircle){
    const targetRect = targetCircle.getBoundingClientRect();
    //const targetBottom = targetRect.top + targetRect.height;

    return Array.from(document.querySelectorAll('.circle1, .circle2, .circle3')).some(other => {
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
    const placedCircles = Array.from(document.querySelectorAll('.circle1, .circle2, .circle3')).filter(other => {
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
        return currRect.tp < topRect.top ? curr : top;
      });

      const topSize = parseInt(topDisk.dataset.size);

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
});


