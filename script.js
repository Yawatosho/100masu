(function(){
  function init() {
    const correctAnswers = [
      ["総記","図書館・図書館学","図書・書誌学","百科事典","一般論文集・一般講演集","逐次刊行物","団体：学会，協会，会議","ジャーナリズム・新聞","叢書・全集・選集","貴重書・郷土資料・その他の特別コレクション"],
      ["哲学","哲学各論","東洋思想","西洋哲学","心理学","倫理学・道徳","宗教","神道","仏教","キリスト教"],
      ["歴史","日本史","アジア史・東洋史","ヨーロッパ史・西洋史","アフリカ史","北アメリカ史","南アメリカ史","オセアニア史・両極地方史","伝記","地理・地誌・紀行"],
      ["社会科学","政治","法律","経済","財政","統計","社会","教育","風俗習慣・民俗学・民族学","国防・軍事"],
      ["自然科学","数学","物理学","化学","天文学・宇宙科学","地球科学・地学","生物科学・一般生物学","植物学","動物学","医学・薬学"],
      ["技術・工学","建設工学・土木工学","建築学","機械工学","電気工学","海洋工学・船舶工学","金属工学・鉱山工学","化学工業","製造工業","家政学・生活科学"],
      ["産業","農業","園芸","蚕糸業","畜産業","林業","水産業","商業","運輸・交通","通信事業"],
      ["芸術・美術","彫刻","絵画","版画","写真","工芸","音楽","演劇","スポーツ・体育","諸芸・娯楽"],
      ["言語","日本語","中国語","英語","ドイツ語","フランス語","スペイン語","イタリア語","ロシア語","その他の諸言語"],
      ["文学","日本文学","中国文学","英米文学","ドイツ文学","フランス文学","スペイン文学","イタリア文学","ロシア・ソビエト文学","その他の諸文学"]
    ];

    let startTime, timerInterval;
    let currentRow = 0, currentCol = 0;
    let lastCorrect = 0, lastFinalSec = 0;
    let rowOrder = [], colOrder = [];
    let soundEnabled = true;
    let gameStarted = false;

    // 重複呼び出し防止用フラグ
    let finishCalled = false;
    let resultSoundPlayed = false;

    const pad = n => n.toString().padStart(2, '0');

    // 配列シャッフル
    const shuffle = arr => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    function initOrder(mode) {
      const base = [...Array(10).keys()];
      if (mode === 'expert') {
        rowOrder = shuffle(base.slice());
        colOrder = shuffle(base.slice());
      } else {
        rowOrder = base.slice();
        colOrder = base.slice();
      }
    }

    function buildGrid() {
      const table = document.getElementById('grid');
      table.innerHTML = '';
      const header = document.createElement('tr');
      header.appendChild(document.createElement('th'));
      for (let j = 0; j < 10; j++) {
        const th = document.createElement('th');
        th.textContent = pad(colOrder[j] * 10);
        header.appendChild(th);
      }
      table.appendChild(header);
      for (let i = 0; i < 10; i++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = rowOrder[i];
        tr.appendChild(th);
        for (let j = 0; j < 10; j++) {
          const td = document.createElement('td');
          td.id = `cell-${i}-${j}`;
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
    }

    function createOptions(i, j) {
      const r = rowOrder[i], c = colOrder[j];
      const row = [...correctAnswers[r]];
      let opts = shuffle(row).slice(0, 5);
      const correct = correctAnswers[r][c];
      if (!opts.includes(correct)) {
        opts.pop();
        opts.push(correct);
      }
      return shuffle(opts);
    }

    // サウンド再生ラッパー
    function playIfEnabled(audioElem) {
      if (!soundEnabled) return;
      audioElem.currentTime = 0;
      audioElem.play().catch(() => {});
    }

    function renderOptions() {
      const div = document.getElementById('options');
      div.innerHTML = '';
      const selectSound = document.getElementById('selectSound');
      createOptions(currentRow, currentCol).forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.textContent = `${idx + 1}. ${opt}`;
        btn.onclick = () => {
          playIfEnabled(selectSound);
          document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = opt;
          moveNext();
        };
        div.appendChild(btn);
      });
    }

    function updateFocus() {
      document.querySelectorAll('td').forEach(td => td.classList.remove('focus'));
      const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
      if (cell) cell.classList.add('focus');
      renderOptions();
    }

    function moveNext() {
      if (currentRow === 9 && currentCol === 9) {
        finish();
        return;
      }
      currentCol++;
      if (currentCol >= 10) {
        currentCol = 0;
        currentRow++;
      }
      updateFocus();
    }

    function finish() {
      if (finishCalled) return;
      finishCalled = true;

      clearInterval(timerInterval);
      document.getElementById('options').style.display = 'none';

      const revealSound = document.getElementById('revealSound');
      const resultSound = document.getElementById('resultSound');
      playIfEnabled(revealSound);

      const info = [];
      let correctCount = 0;
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const td = document.getElementById(`cell-${i}-${j}`);
          const r = rowOrder.length ? rowOrder[i] : i;
          const c = colOrder.length ? colOrder[j] : j;
          const ok = td.textContent === correctAnswers[r][c];
          if (ok) correctCount++;
          else td.setAttribute('data-correct', correctAnswers[r][c]);
          info.push({ td, ok });
        }
      }

      const baseSec = Math.floor((Date.now() - startTime) / 1000);
      const wrongCount = 100 - correctCount;
      const finalSec = baseSec + wrongCount * 5;
      lastCorrect = correctCount;
      lastFinalSec = finalSec;
      const prev = localStorage.getItem('ndcBestTimeSec');
      if (!prev || finalSec < prev) {
        localStorage.setItem('ndcBestTimeSec', finalSec);
      }

      let idx = 0;
      function revealLoop() {
        if (idx < info.length) {
          const { td, ok } = info[idx++];
          td.style.backgroundColor = ok ? '#dfd' : '#fdd';
          setTimeout(revealLoop, 50);
        } else {
          revealSound.pause();
          revealSound.currentTime = 0;
          if (!resultSoundPlayed) {
            playIfEnabled(resultSound);
            resultSoundPlayed = true;
          }
          document.getElementById('result').innerHTML =
            `正答: ${correctCount}/100 / 誤答: ${wrongCount}（5秒×${wrongCount}秒）<br>` +
            `クリアタイム: ${pad(Math.floor(finalSec / 60))}:${pad(finalSec % 60)}`;
          document.getElementById('shareBtn').style.display = 'inline-block';
          displayBest();
        }
      }
      revealLoop();
    }

    function startGame() {
      finishCalled = false;
      resultSoundPlayed = false;

      const mode = document.getElementById('modeSelect').value;
      initOrder(mode);
      buildGrid();
      document.getElementById('options').style.display = 'flex';
      currentRow = 0;
      currentCol = 0;
      updateFocus();

      document.getElementById('result').textContent = '';
      document.getElementById('shareBtn').style.display = 'none';
      startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent =
          `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`;
      }, 1000);

      document.getElementById('controlBtn').textContent = 'リトライ';
      gameStarted = true;
    }

    function restartGame() { clearInterval(timerInterval); startGame(); }

    function handleControl() {
      const startSound = document.getElementById('startSound');
      playIfEnabled(startSound);
      if (gameStarted) restartGame(); else startGame();
    }

    function shareResult() {
      const mode = document.getElementById('modeSelect').value;
      const modeLabel = mode === 'normal' ? 'ノーマルモード' : 'エキスパートモード';
      const text = `#100マスNDC ${modeLabel} 正答数:${lastCorrect}/100 クリアタイム:${pad(
        Math.floor(lastFinalSec / 60)
      )}:${pad(lastFinalSec % 60)} ${location.href}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    }

    // トグル
    const toggleBtn = document.getElementById('soundToggle');
    toggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      toggleBtn.textContent = soundEnabled ? 'ON' : 'OFF';
    });

    document.getElementById('controlBtn').addEventListener('click', handleControl);
    document.getElementById('shareBtn').addEventListener('click', shareResult);
    document.addEventListener('keydown', e => {
      if (['1','2','3','4','5'].includes(e.key)) {
        document.querySelectorAll('#options button')[parseInt(e.key)-1]?.click();
      }
    });
    window.addEventListener('load', () => { displayBest(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

