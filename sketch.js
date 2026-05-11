let capture;
let faceMesh; // 宣告 ml5.faceMesh 物件
let handPose; // 宣告 ml5.handPose 物件
let faces = []; // 用來儲存臉部偵測結果
let hands = []; // 用來儲存手勢偵測結果
let earringImages = []; // 儲存耳環圖片陣列
let currentEarringIndex = 0; // 當前選擇的耳環索引

function preload() {
  // 載入五款耳環圖片
  earringImages[0] = loadImage('pic/acc1_ring.png');
  earringImages[1] = loadImage('pic/acc2_pearl.png');
  earringImages[2] = loadImage('pic/acc3_tassel.png');
  earringImages[3] = loadImage('pic/acc4_jade.png');
  earringImages[4] = loadImage('pic/acc5_phoenix.png');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  // 設定攝影機擷取影像的內部解析度，這有助於模型穩定處理
  capture.size(640, 480);
  // 隱藏預設在畫布下方的影片元件
  capture.hide();

  // 初始化 FaceMesh 模型，並設定模型載入完成後的回呼函式
  faceMesh = ml5.faceMesh(capture, modelReady);
  // 設定當偵測到臉部時的回呼函式
  faceMesh.on('face', gotFaces);

  // 初始化 HandPose 模型
  handPose = ml5.handPose(capture, () => console.log('HandPose Model Loaded!'));
  // 設定當偵測到手勢時的回呼函式
  handPose.on('hands', results => hands = results);
}

function modelReady() { console.log('FaceMesh Model Loaded!'); }
function gotFaces(results) { faces = results; }

function draw() {
  background('#e7c6ff');

  let vWidth = windowWidth * 0.5;
  let vHeight = windowHeight * 0.5;

  // 計算置中座標
  let x = (width - vWidth) / 2;
  let y = (height - vHeight) / 2;

  push();
  // 實作左右顛倒：移動到影像顯示區域的右側，再進行水平鏡像縮放
  translate(x + vWidth, y);
  scale(-1, 1);
  image(capture, 0, 0, vWidth, vHeight);

  // 偵測手指數量來決定顯示哪款耳環
  if (hands.length > 0) {
    let hand = hands[0];
    let count = 0;
    
    // 辨識四根手指 (食指、中指、無名指、小指) 是否伸直
    // 邏輯：指尖 (Tip) 的 Y 座標小於第二關節 (Pip) 的 Y 座標
    const tips = [8, 12, 16, 20];
    const joints = [6, 10, 14, 18];
    for (let i = 0; i < 4; i++) {
      if (hand.keypoints[tips[i]].y < hand.keypoints[joints[i]].y) count++;
    }
    // 辨識大拇指 (簡化邏輯：指尖高於根部關節)
    if (hand.keypoints[4].y < hand.keypoints[2].y) count++;

    // 如果偵測到 1~5 根手指，切換對應圖片
    if (count >= 1 && count <= 5) currentEarringIndex = count - 1;
  }

  // 繪製耳垂標記與耳環
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    // FaceMesh 索引：234 為左耳垂附近，454 為右耳垂附近
    let points = [face.keypoints[234], face.keypoints[454]];

    for (let pt of points) {
      if (pt) {
        // 將原始攝影機座標 (0-640) 映射到顯示寬度 (vWidth)
        let mappedX = map(pt.x, 0, capture.width, 0, vWidth);
        let mappedY = map(pt.y, 0, capture.height, 0, vHeight);

        // 繪製黃色圓圈
        fill(255, 255, 0);
        noStroke();
        circle(mappedX, mappedY, 10);

        // 繪製耳環圖片 (設定置中並調整大小)
        imageMode(CENTER);
        image(earringImages[currentEarringIndex], mappedX, mappedY + 10, vWidth * 0.08, vWidth * 0.08);
        imageMode(CORNER); // 恢復預設模式避免影響其他繪製
      }
    }
  }
  pop();
}

function windowResized() {
  // 當視窗大小改變時，同步調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
