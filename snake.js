document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const upBtn = document.getElementById('upBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const downBtn = document.getElementById('downBtn');

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let gameStarted = false;
    let gameOver = false;
    let score = 0;
    
    // スネークの初期位置と速度
    let snake = [
        { x: 10, y: 10 }
    ];
    let velocityX = 0;
    let velocityY = 0;
    
    // 食べ物の初期位置
    let foodX = Math.floor(Math.random() * tileCount);
    let foodY = Math.floor(Math.random() * tileCount);
    
    // ゲームループ
    function gameLoop() {
        if (gameOver) {
            drawGameOver();
            return;
        }
        
        if (!gameStarted) {
            drawStart();
            requestAnimationFrame(gameLoop);
            return;
        }
        
        updateSnake();
        
        // 衝突検出
        if (checkCollision()) {
            gameOver = true;
            drawGameOver();
            return;
        }
        
        clearCanvas();
        checkFoodCollision();
        drawFood();
        drawSnake();
        
        setTimeout(() => {
            requestAnimationFrame(gameLoop);
        }, 100); // スピード調整
    }
    
    // キャンバスをクリア
    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // スネークの更新
    function updateSnake() {
        // 新しい頭部位置を計算
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        
        // 頭部を先頭に追加
        snake.unshift(head);
        
        // 食べ物を食べていなければ尻尾を削除
        if (snake[0].x === foodX && snake[0].y === foodY) {
            score++;
            scoreElement.textContent = score;
            generateFood();
        } else {
            snake.pop();
        }
    }
    
    // スネークの描画
    function drawSnake() {
        ctx.fillStyle = 'green';
        for (let i = 0; i < snake.length; i++) {
            ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            
            // 頭部は別の色で描画
            if (i === 0) {
                ctx.fillStyle = 'darkgreen';
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
                ctx.fillStyle = 'green';
            }
        }
    }
    
    // 食べ物の描画
    function drawFood() {
        ctx.fillStyle = 'red';
        ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
    }
    
    // 食べ物の生成
    function generateFood() {
        let newFoodX, newFoodY;
        let foodOnSnake = true;
        
        // スネークの体と被らない位置に食べ物を生成
        while (foodOnSnake) {
            foodOnSnake = false;
            newFoodX = Math.floor(Math.random() * tileCount);
            newFoodY = Math.floor(Math.random() * tileCount);
            
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newFoodX && snake[i].y === newFoodY) {
                    foodOnSnake = true;
                    break;
                }
            }
        }
        
        foodX = newFoodX;
        foodY = newFoodY;
    }
    
    // 食べ物との衝突チェック
    function checkFoodCollision() {
        if (snake[0].x === foodX && snake[0].y === foodY) {
            score++;
            scoreElement.textContent = score;
            generateFood();
            // 尾を追加する必要はない（updateSnakeで処理される）
        }
    }
    
    // 衝突検出
    function checkCollision() {
        // 壁との衝突
        if (snake[0].x < 0 || snake[0].x >= tileCount || snake[0].y < 0 || snake[0].y >= tileCount) {
            return true;
        }
        
        // 自分自身との衝突
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // スタート画面の描画
    function drawStart() {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('スタートボタンを押してください', 60, canvas.height / 2);
    }
    
    // ゲームオーバー画面の描画
    function drawGameOver() {
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('ゲームオーバー', 100, canvas.height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText(`スコア: ${score}`, 150, canvas.height / 2 + 10);
        ctx.fillText('リセットボタンを押してください', 60, canvas.height / 2 + 50);
    }
    
    // ゲームリセット
    function resetGame() {
        gameStarted = false;
        gameOver = false;
        score = 0;
        scoreElement.textContent = '0';
        snake = [{ x: 10, y: 10 }];
        velocityX = 0;
        velocityY = 0;
        generateFood();
        clearCanvas();
        drawStart();
    }
    
    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (!gameStarted && !gameOver && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            gameStarted = true;
        }
        
        // 同じ方向には進めないようにする（例: 右に進んでいるときに左には曲がれない）
        switch (e.key) {
            case 'ArrowUp':
                if (velocityY !== 1) { // 下向きでない場合のみ
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) { // 上向きでない場合のみ
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) { // 右向きでない場合のみ
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) { // 左向きでない場合のみ
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
        }
    });
    
    // ボタン操作
    startBtn.addEventListener('click', () => {
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        }
    });
    
    resetBtn.addEventListener('click', resetGame);
    
    // モバイルコントロール
    upBtn.addEventListener('click', () => {
        if (velocityY !== 1) {
            velocityX = 0;
            velocityY = -1;
        }
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        }
    });
    
    downBtn.addEventListener('click', () => {
        if (velocityY !== -1) {
            velocityX = 0;
            velocityY = 1;
        }
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        }
    });
    
    leftBtn.addEventListener('click', () => {
        if (velocityX !== 1) {
            velocityX = -1;
            velocityY = 0;
        }
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        }
    });
    
    rightBtn.addEventListener('click', () => {
        if (velocityX !== -1) {
            velocityX = 1;
            velocityY = 0;
        }
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        }
    });
    
    // ゲームの初期化と開始
    resetGame();
    gameLoop();
});