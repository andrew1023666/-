const mainBoard = document.getElementById('ultimate-board');
const statusDisplay = document.getElementById('status');
const localBtn = document.getElementById('local-mode-btn');
const onlineBtn = document.getElementById('online-mode-btn');
const connPanel = document.getElementById('connection-panel');

let currentPlayer = 'O';
let nextRequiredBoard = -1; 
let bigGameState = Array(9).fill(null);
let peer, conn, myRole = null, isOnline = false;

// --- 模式切換 ---
localBtn.onclick = () => {
    isOnline = false;
    localBtn.classList.add('active');
    onlineBtn.classList.remove('active');
    connPanel.style.display = 'none';
    resetGame();
    statusDisplay.innerText = "本地模式：輪到 O 下棋";
};

onlineBtn.onclick = () => {
    onlineBtn.classList.add('active');
    localBtn.classList.remove('active');
    connPanel.style.display = 'block';
    initPeer();
};

// --- PeerJS 連線邏輯 ---
function initPeer() {
    if (peer) return;
    peer = new Peer();
    peer.on('open', id => document.getElementById('my-peer-id').innerText = id);
    peer.on('connection', c => {
        conn = c; myRole = 'X'; isOnline = true;
        setupConn();
        alert("對手已連線！你是 X");
    });
}

document.getElementById('connect-btn').onclick = () => {
    const id = document.getElementById('join-id').value;
    if (!id) return;
    conn = peer.connect(id);
    myRole = 'O'; isOnline = true;
    setupConn();
};

function setupConn() {
    statusDisplay.innerText = `連線成功！你是 ${myRole}`;
    conn.on('data', data => handleMove(null, data.b, data.c, true));
}

// --- 遊戲邏輯 ---
function createBoard() {
    mainBoard.innerHTML = '';
    for (let b = 0; b < 9; b++) {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'local-board active';
        boardDiv.id = `board-${b}`;
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.b = b; cell.dataset.c = c;
            cell.onclick = (e) => handleMove(e, b, c, false);
            boardDiv.appendChild(cell);
        }
        mainBoard.appendChild(boardDiv);
    }
}

function handleMove(e, bIdx, cIdx, isRemote) {
    if (isOnline && !isRemote && currentPlayer !== myRole) return;
    if (nextRequiredBoard !== -1 && bIdx !== nextRequiredBoard) return;
    
    const target = isRemote ? document.querySelector(`.cell[data-b="${bIdx}"][data-c="${cIdx}"]`) : e.target;
    if (target.innerText !== '' || bigGameState[bIdx] === 'FULL') return;

    if (isOnline && !isRemote) conn.send({ b: bIdx, c: cIdx });

    target.innerText = currentPlayer;
    target.classList.add('taken');
    target.style.color = currentPlayer === 'O' ? 'var(--accent-o)' : 'var(--accent-x)';

    // 檢查小區勝負
    const localCells = Array.from(document.querySelectorAll(`.cell[data-b="${bIdx}"]`)).map(c => c.innerText);
    if (bigGameState[bIdx] === null && checkWin(localCells)) {
        bigGameState[bIdx] = currentPlayer;
        const bDiv = document.getElementById(`board-${bIdx}`);
        bDiv.classList.add(`win-${currentPlayer.toLowerCase()}`);
        bDiv.setAttribute('data-winner', currentPlayer);
    }

    // 決定下一個合法的區
    const nextCells = Array.from(document.querySelectorAll(`.cell[data-b="${cIdx}"]`)).map(c => c.innerText);
    nextRequiredBoard = nextCells.includes('') ? cIdx : -1;

    if (checkWin(bigGameState)) {
        statusDisplay.innerText = `🎉 恭喜玩家 ${currentPlayer} 獲勝！`;
        nextRequiredBoard = -2;
    } else {
        currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
        updateUI();
    }
}

function checkWin(s) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(l => s[l[0]] && s[l[0]] === s[l[1]] && s[l[0]] === s[l[2]]);
}

function updateUI() {
    statusDisplay.innerText = `輪到 ${currentPlayer} 下棋`;
    statusDisplay.style.color = currentPlayer === 'O' ? 'var(--accent-o)' : 'var(--accent-x)';
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.classList.toggle('active', nextRequiredBoard === -1 || nextRequiredBoard === i);
    });
}

function resetGame() {
    currentPlayer = 'O';
    nextRequiredBoard = -1;
    bigGameState = Array(9).fill(null);
    createBoard();
    updateUI();
}

// 彈窗
const modal = document.getElementById("rules-modal");
document.getElementById("rules-btn").onclick = () => modal.style.display = "block";
document.querySelector(".close-btn").onclick = () => modal.style.display = "none";

resetGame();