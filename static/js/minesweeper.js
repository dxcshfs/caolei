document.addEventListener('DOMContentLoaded', function() {
    // 游戏状态变量
    let gameBoard = [];
    let rows = 16;
    let cols = 16;
    let mines = 40;
    let minesLeft = mines;
    let gameStarted = false;
    let gameOver = false;
    let timer = 0;
    let timerInterval;
    let firstClick = true;
    let isMobile = false;
    let flagMode = false;
    let longPressTimer;
    let touchStartTime = 0;
    let touchTimeout;
    
    // 检测是否为移动设备（为了测试，我们暂时将所有设备都视为移动设备）
    isMobile = true; // 强制启用移动端功能，方便在桌面浏览器中测试
    
    // DOM元素
    const boardElement = document.getElementById('game-board');
    const difficultySelect = document.getElementById('difficulty');
    const customSettings = document.getElementById('custom-settings');
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const minesInput = document.getElementById('mines');
    const newGameBtn = document.getElementById('new-game-btn');
    const minesLeftElement = document.getElementById('mines-left');
    const timerElement = document.getElementById('timer');
    const faceElement = document.getElementById('face');
    const gameMessageElement = document.getElementById('game-message');
    const flagModeCheckbox = document.getElementById('flag-mode');
    const flagModeContainer = document.getElementById('flag-mode-container');
    
    // 初始化游戏
    initGame();
    
    // 事件监听器
    difficultySelect.addEventListener('change', toggleCustomSettings);
    newGameBtn.addEventListener('click', startNewGame);
    faceElement.addEventListener('click', startNewGame);
    
    // 旗帜模式切换（仅在移动设备上显示）
    if (isMobile) {
        flagModeContainer.style.display = 'block';
        flagModeCheckbox.addEventListener('change', function() {
            flagMode = this.checked;
        });
    } else {
        flagModeContainer.style.display = 'none';
    }
    
    // 设置适合当前设备的单元格大小
    function setCellSize() {
        const viewportWidth = window.innerWidth;
        let cellSize = 30; // 默认大小
        
        if (viewportWidth <= 320) {
            cellSize = 16;
        } else if (viewportWidth <= 480) {
            cellSize = 20;
        } else if (viewportWidth <= 768) {
            cellSize = 25;
        }
        
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    }
    
    // 初始设置单元格大小
    setCellSize();
    
    // 窗口大小改变时重新设置单元格大小
    window.addEventListener('resize', setCellSize);
    
    // 切换自定义设置显示
    function toggleCustomSettings() {
        if (difficultySelect.value === 'custom') {
            customSettings.classList.remove('hidden');
        } else {
            customSettings.classList.add('hidden');
        }
    }
    
    // 初始化游戏
    function initGame() {
        updateMinesLeftDisplay();
        resetTimer();
        createBoard();
    }
    
    // 开始新游戏
    function startNewGame() {
        // 重置游戏状态
        gameOver = false;
        firstClick = true;
        resetTimer();
        faceElement.textContent = '😊';
        gameMessageElement.classList.add('hidden');
        
        // 根据难度设置游戏参数
        setGameParameters();
        
        // 更新剩余雷数显示
        minesLeft = mines;
        updateMinesLeftDisplay();
        
        // 创建游戏板
        createBoard();
    }
    
    // 根据难度设置游戏参数
    function setGameParameters() {
        switch (difficultySelect.value) {
            case 'easy':
                rows = 9;
                cols = 9;
                mines = 10;
                break;
            case 'medium':
                rows = 16;
                cols = 16;
                mines = 40;
                break;
            case 'hard':
                rows = 16;
                cols = 30;
                mines = 99;
                break;
            case 'custom':
                rows = parseInt(rowsInput.value) || 16;
                cols = parseInt(colsInput.value) || 16;
                mines = parseInt(minesInput.value) || 40;
                
                // 验证自定义参数
                rows = Math.min(Math.max(rows, 5), 30);
                cols = Math.min(Math.max(cols, 5), 30);
                mines = Math.min(Math.max(mines, 1), Math.floor(rows * cols * 0.8));
                
                // 更新输入框的值
                rowsInput.value = rows;
                colsInput.value = cols;
                minesInput.value = mines;
                break;
        }
    }
    
    // 创建游戏板
    function createBoard() {
        // 清空游戏板
        boardElement.innerHTML = '';
        
        // 设置CSS变量以控制网格大小
        boardElement.style.setProperty('--rows', rows);
        boardElement.style.setProperty('--cols', cols);
        
        // 初始化游戏板数组
        gameBoard = Array(rows).fill().map(() => Array(cols).fill(0));
        
        // 创建单元格
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // 添加事件监听器
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleCellRightClick);
                
                // 为移动设备添加触摸事件
                if (isMobile) {
                    cell.addEventListener('touchstart', handleTouchStart);
                    cell.addEventListener('touchend', handleTouchEnd);
                    cell.addEventListener('touchmove', handleTouchMove);
                    cell.addEventListener('touchcancel', handleTouchCancel);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    // 放置地雷
    function placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            
            // 确保不在第一次点击的位置及其周围放置地雷
            if ((Math.abs(r - firstRow) > 1 || Math.abs(c - firstCol) > 1) && gameBoard[r][c] !== -1) {
                gameBoard[r][c] = -1; // -1 表示地雷
                minesPlaced++;
            }
        }
        
        // 计算每个单元格周围的地雷数
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (gameBoard[r][c] !== -1) {
                    gameBoard[r][c] = countAdjacentMines(r, c);
                }
            }
        }
    }
    
    // 计算周围的地雷数
    function countAdjacentMines(row, col) {
        let count = 0;
        
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                if (gameBoard[r][c] === -1) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // 处理单元格点击
    function handleCellClick(event) {
        if (gameOver) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 如果是第一次点击，放置地雷并开始计时
        if (firstClick) {
            placeMines(row, col);
            startTimer();
            firstClick = false;
            gameStarted = true;
        }
        
        // 如果单元格已被标记为旗帜，不执行任何操作
        if (cell.classList.contains('flagged')) {
            return;
        }
        
        // 如果在旗帜模式下，标记旗帜而不是揭示单元格
        if (flagMode && !cell.classList.contains('revealed')) {
            if (cell.classList.contains('flagged')) {
                cell.classList.remove('flagged');
                minesLeft++;
            } else {
                cell.classList.add('flagged');
                minesLeft--;
            }
            updateMinesLeftDisplay();
            checkWinCondition();
            return;
        }
        
        // 揭示单元格
        revealCell(row, col);
    }
    
    // 处理单元格右键点击（标记旗帜）
    function handleCellRightClick(event) {
        event.preventDefault(); // 阻止默认的右键菜单
        
        if (gameOver || !gameStarted) return;
        
        const cell = event.target;
        
        // 如果单元格已经被揭示，不执行任何操作
        if (cell.classList.contains('revealed')) {
            return;
        }
        
        // 切换旗帜标记
        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            minesLeft++;
        } else {
            cell.classList.add('flagged');
            minesLeft--;
        }
        
        updateMinesLeftDisplay();
        checkWinCondition();
    }
    
    // 揭示单元格
    function revealCell(row, col) {
        const cellElement = getCellElement(row, col);
        
        // 如果单元格已经被揭示或标记为旗帜，不执行任何操作
        if (cellElement.classList.contains('revealed') || cellElement.classList.contains('flagged')) {
            return;
        }
        
        // 揭示单元格
        cellElement.classList.add('revealed');
        
        // 如果是地雷，游戏结束
        if (gameBoard[row][col] === -1) {
            cellElement.classList.add('mine');
            gameOver = true;
            endGame(false);
            return;
        }
        
        // 如果是数字，显示数字
        if (gameBoard[row][col] > 0) {
            cellElement.textContent = gameBoard[row][col];
            cellElement.classList.add(`number-${gameBoard[row][col]}`);
        }
        
        // 如果是空白单元格，递归揭示周围的单元格
        if (gameBoard[row][col] === 0) {
            for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                    if (r !== row || c !== col) {
                        revealCell(r, c);
                    }
                }
            }
        }
        
        // 检查是否获胜
        checkWinCondition();
    }
    
    // 获取单元格元素
    function getCellElement(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }
    
    // 检查是否获胜
    function checkWinCondition() {
        const totalCells = rows * cols;
        const revealedCells = document.querySelectorAll('.cell.revealed').length;
        const flaggedMines = document.querySelectorAll('.cell.flagged').length;
        
        // 如果所有非地雷单元格都被揭示，或者所有地雷都被正确标记，则获胜
        if (revealedCells + mines === totalCells || (minesLeft === 0 && flaggedMines === mines)) {
            gameOver = true;
            endGame(true);
        }
    }
    
    // 结束游戏
    function endGame(isWin) {
        clearInterval(timerInterval);
        
        if (isWin) {
            faceElement.textContent = '😎';
            gameMessageElement.textContent = '恭喜你赢了！';
            gameMessageElement.classList.remove('hidden', 'lose');
            gameMessageElement.classList.add('win');
            
            // 标记所有未标记的地雷
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (gameBoard[r][c] === -1) {
                        const cell = getCellElement(r, c);
                        if (!cell.classList.contains('flagged')) {
                            cell.classList.add('flagged');
                        }
                    }
                }
            }
        } else {
            faceElement.textContent = '😵';
            gameMessageElement.textContent = '游戏结束！你踩到了地雷。';
            gameMessageElement.classList.remove('hidden', 'win');
            gameMessageElement.classList.add('lose');
            
            // 显示所有地雷
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (gameBoard[r][c] === -1) {
                        const cell = getCellElement(r, c);
                        if (!cell.classList.contains('flagged')) {
                            cell.classList.add('revealed', 'mine');
                        }
                    } else if (getCellElement(r, c).classList.contains('flagged')) {
                        // 标记错误的旗帜
                        getCellElement(r, c).classList.add('revealed');
                        getCellElement(r, c).textContent = '❌';
                    }
                }
            }
        }
    }
    
    // 开始计时器
    function startTimer() {
        resetTimer();
        timerInterval = setInterval(function() {
            timer++;
            updateTimerDisplay();
        }, 1000);
    }
    
    // 重置计时器
    function resetTimer() {
        clearInterval(timerInterval);
        timer = 0;
        updateTimerDisplay();
    }
    
    // 更新计时器显示
    function updateTimerDisplay() {
        timerElement.textContent = timer;
    }
    
    // 更新剩余雷数显示
    function updateMinesLeftDisplay() {
        minesLeftElement.textContent = minesLeft;
    }
    
    // 触摸事件处理 - 开始触摸
    function handleTouchStart(event) {
        if (gameOver) return;
        
        // 防止触摸事件同时触发鼠标事件
        event.preventDefault();
        
        const touch = event.touches[0];
        const cell = event.target;
        
        // 记录触摸开始时间，用于检测长按
        touchStartTime = new Date().getTime();
        
        // 设置长按定时器
        touchTimeout = setTimeout(function() {
            // 长按操作 - 模拟右键点击（标记旗帜）
            if (!cell.classList.contains('revealed')) {
                if (cell.classList.contains('flagged')) {
                    cell.classList.remove('flagged');
                    minesLeft++;
                } else {
                    cell.classList.add('flagged');
                    minesLeft--;
                }
                updateMinesLeftDisplay();
                checkWinCondition();
            }
        }, 500); // 500毫秒长按阈值
    }
    
    // 触摸事件处理 - 结束触摸
    function handleTouchEnd(event) {
        // 防止触摸事件同时触发鼠标事件
        event.preventDefault();
        
        // 清除长按定时器
        clearTimeout(touchTimeout);
        
        const cell = event.target;
        const touchDuration = new Date().getTime() - touchStartTime;
        
        // 如果是短触摸（点击），且不在旗帜模式下
        if (touchDuration < 500 && !flagMode) {
            // 模拟点击操作
            if (!cell.classList.contains('flagged')) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                // 如果是第一次点击，放置地雷并开始计时
                if (firstClick) {
                    placeMines(row, col);
                    startTimer();
                    firstClick = false;
                    gameStarted = true;
                }
                
                // 揭示单元格
                revealCell(row, col);
            }
        }
        // 如果在旗帜模式下，短触摸也标记旗帜
        else if (flagMode) {
            if (!cell.classList.contains('revealed')) {
                if (cell.classList.contains('flagged')) {
                    cell.classList.remove('flagged');
                    minesLeft++;
                } else {
                    cell.classList.add('flagged');
                    minesLeft--;
                }
                updateMinesLeftDisplay();
                checkWinCondition();
            }
        }
    }
    
    // 触摸事件处理 - 移动触摸
    function handleTouchMove(event) {
        // 如果手指移动，取消长按操作
        clearTimeout(touchTimeout);
    }
    
    // 触摸事件处理 - 取消触摸
    function handleTouchCancel(event) {
        // 取消长按操作
        clearTimeout(touchTimeout);
    }
});