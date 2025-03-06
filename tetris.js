document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const gameOverDiv = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    
    // モバイルコントロール
    const rotateBtn = document.getElementById('rotateBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const downBtn = document.getElementById('downBtn');
    
    // ゲーム設定
    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30;
    const COLORS = [
        null, // 空のセル用
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
    ];
    
    // テトリミノの形状
    const SHAPES = [
        null, // 空のセル用
        // I
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // J
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        // L
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        // O
        [
            [4, 4],
            [4, 4]
        ],
        // S
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        // T
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        // Z
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // ゲーム変数
    let board = createEmptyBoard();
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let level = 1;
    let dropTime = 1000; // 初期落下速度（ミリ秒）
    let dropCounter = 0;
    let lastTime = 0;
    let gameStarted = false;
    let gamePaused = false;
    let gameOver = false;
    let animationId = null;
    
    // 空のボードを作成
    function createEmptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    // ボードを描画
    function drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const value = board[y][x];
                if (value !== 0) {
                    drawBlock(x, y, value);
                }
            }
        }
    }
    
    // 単位ブロックを描画
    function drawBlock(x, y, value) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    
    // ピースを描画
    function drawPiece() {
        if (!currentPiece) return;
        
        const { shape, x, y, type } = currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    drawBlock(x + col, y + row, type);
                }
            }
        }
    }
    
    // ゲーム画面を描画
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // グリッド線
        ctx.strokeStyle = '#333';
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
        
        drawBoard();
        drawPiece();
    }
    
    // 軸回転した結果を取得
    function getRotatedMatrix(matrix) {
        const result = [];
        for (let i = 0; i < matrix[0].length; i++) {
            const row = [];
            for (let j = matrix.length - 1; j >= 0; j--) {
                row.push(matrix[j][i]);
            }
            result.push(row);
        }
        return result;
    }
    
    // ピースの回転
    function rotate() {
        if (!currentPiece || gamePaused) return;
        
        const originalShape = currentPiece.shape;
        currentPiece.shape = getRotatedMatrix(originalShape);
        
        // 回転後に衝突する場合は元に戻す
        if (checkCollision()) {
            currentPiece.shape = originalShape;
        }
    }
    
    // ピースを移動
    function movePiece(dx, dy) {
        if (!currentPiece || gamePaused) return;
        
        currentPiece.x += dx;
        currentPiece.y += dy;
        
        // 衝突した場合は元の位置に戻す
        if (checkCollision()) {
            currentPiece.x -= dx;
            currentPiece.y -= dy;
            
            // 下に移動しようとして衝突した場合は固定する
            if (dy > 0) {
                solidifyPiece();
                removeCompleteRows();
                generateNewPiece();
            }
            
            return false;
        }
        
        return true;
    }
    
    // 衝突チェック
    function checkCollision() {
        const { shape, x, y } = currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    // いずれかの条件に当てはまれば衝突
                    if (
                        boardX < 0 || boardX >= COLS || // 左右の境界
                        boardY >= ROWS || // 下の境界
                        (boardY >= 0 && board[boardY][boardX] !== 0) // 他のブロックとの衝突
                    ) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // ピースを分解からボードに固定
    function solidifyPiece() {
        const { shape, x, y, type } = currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardY = y + row;
                    
                    // ピースが上部境界を越えたらゲームオーバー
                    if (boardY < 0) {
                        endGame();
                        return;
                    }
                    
                    board[boardY][x + col] = type;
                }
            }
        }
    }
    
    // 完成した行を削除
    function removeCompleteRows() {
        let rowsCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            const rowFull = board[y].every(value => value !== 0);
            
            if (rowFull) {
                // 行を削除して上から空行を追加
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(0));
                rowsCleared++;
                y++; // 同じ行を再チェック
            }
        }
        
        // スコアの計算とレベルアップ
        if (rowsCleared > 0) {
            // スコア計算（行数に応じて増加）
            const points = [0, 100, 300, 500, 800];
            score += points[rowsCleared] * level;
            scoreElement.textContent = score;
            
            // 1000点ごとにレベルアップ
            const newLevel = Math.floor(score / 1000) + 1;
            if (newLevel > level) {
                level = newLevel;
                levelElement.textContent = level;
                // レベルが上がると落下速度が上がる
                dropTime = Math.max(100, 1000 - (level - 1) * 100);
            }
        }
    }
    
    // 新しいピースを生成
    function generateNewPiece() {
        if (nextPiece) {
            currentPiece = nextPiece;
        } else {
            const pieceType = Math.floor(Math.random() * 7) + 1;
            currentPiece = {
                shape: [...SHAPES[pieceType]],
                x: Math.floor(COLS / 2) - Math.floor(SHAPES[pieceType][0].length / 2),
                y: -2, // 上から少し見える状態でスタート
                type: pieceType
            };
        }
        
        // 次のピースを準備
        const nextType = Math.floor(Math.random() * 7) + 1;
        nextPiece = {
            shape: [...SHAPES[nextType]],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[nextType][0].length / 2),
            y: -2,
            type: nextType
        };
        
        // 新しいピースが配置された時点で衝突する場合はゲームオーバー
        if (checkCollision()) {
            endGame();
        }
    }
    
    // ハードドロップ（即時固定）
    function hardDrop() {
        if (!currentPiece || gamePaused) return;
        
        while (movePiece(0, 1)) {
            // 衝突するまで下に移動
        }
    }
    
    // ゲームのメインループ
    function update(time = 0) {
        if (gameOver || !gameStarted || gamePaused) {
            return;
        }
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropTime) {
            movePiece(0, 1);
            dropCounter = 0;
        }
        
        draw();
        animationId = requestAnimationFrame(update);
    }
    
    // ゲームを開始
    function startGame() {
        if (gameStarted && !gamePaused) return;
        
        if (gamePaused) {
            gamePaused = false;
            pauseBtn.textContent = '一時停止';
            lastTime = performance.now();
            animationId = requestAnimationFrame(update);
            return;
        }
        
        // ゲームの初期化
        board = createEmptyBoard();
        score = 0;
        level = 1;
        dropTime = 1000;
        gameStarted = true;
        gamePaused = false;
        gameOver = false;
        gameOverDiv.style.display = 'none';
        scoreElement.textContent = '0';
        levelElement.textContent = '1';
        
        generateNewPiece();
        lastTime = performance.now();
        animationId = requestAnimationFrame(update);
    }
    
    // ゲームを一時停止
    function pauseGame() {
        if (!gameStarted || gameOver) return;
        
        if (gamePaused) {
            gamePaused = false;
            pauseBtn.textContent = '一時停止';
            lastTime = performance.now();
            animationId = requestAnimationFrame(update);
        } else {
            gamePaused = true;
            pauseBtn.textContent = '再開';
            cancelAnimationFrame(animationId);
        }
    }
    
    // ゲームオーバー処理
    function endGame() {
        gameOver = true;
        cancelAnimationFrame(animationId);
        finalScoreElement.textContent = score;
        gameOverDiv.style.display = 'block';
    }
    
    // キーボード入力を処理
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                movePiece(0, 1);
                break;
            case 'ArrowUp':
                rotate();
                break;
            case ' ':
                hardDrop();
                break;
            case 'p':
                pauseGame();
                break;
        }
    });
    
    // ボタンイベント
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', startGame);
    
    // モバイルコントロール
    rotateBtn.addEventListener('click', rotate);
    leftBtn.addEventListener('click', () => movePiece(-1, 0));
    rightBtn.addEventListener('click', () => movePiece(1, 0));
    downBtn.addEventListener('click', () => movePiece(0, 1));
    
    // 初期表示
    draw();
    ctx.fillStyle = '#111';
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('スタートボタンを押してください', canvas.width / 2, canvas.height / 2);
});