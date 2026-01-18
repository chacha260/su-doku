/**
 * UI Orchestrator
 */
// import { store } from '../core/store.js'; // REMOVED
const store = App.Store; // Alias for convenience

// Elements
const app = document.getElementById('app');
let boardElement;

// Icons (SVG Strings)
const ICONS = {
    undo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    note: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    eraser: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
};

/**
 * Renders the entire app structure (called once).
 */
App.UI.initApp = function () {
    // Re-bind store alias in case of timing issues (usually fine if loaded sequentially)
    const store = App.Store;

    app.innerHTML = `
        <header class="animate-fade">
            <h1>Sudoku</h1>
            <div class="stats-bar">
                <div class="stat-item">
                     <span>Difficulty: <strong id="difficulty-display">Easy</strong></span>
                </div>
                <div class="stat-item">
                     <span>Mistakes: <strong id="mistakes-display">0/3</strong></span>
                </div>
                <div class="stat-item highlight">
                    <span id="timer-display">00:00</span>
                </div>
            </div>
        </header>

        <div id="board-container" class="animate-pop"></div>

        <div class="controls animate-fade">
            <button class="control-btn" id="btn-undo">${ICONS.undo} Undo</button>
            <button class="control-btn" id="btn-erase">${ICONS.eraser} Erase</button>
            <button class="control-btn" id="btn-note">${ICONS.note} Note <span id="note-status">OFF</span></button>
            <button class="control-btn" id="btn-hint">Hint</button> 
            <button class="control-btn" id="btn-new">New Game</button>
        </div>

        <div class="numpad animate-fade">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="num-btn" data-num="${n}">${n}</button>`).join('')}
        </div>

        <div id="game-over-modal" class="modal-overlay">
            <div class="modal-content">
                <h2>Congratulations! 🎉</h2>
                <p>You solved the puzzle!</p>
                <p>Time: <strong id="final-time"></strong></p>
                <button class="btn-primary" onclick="window.location.reload()">Play Again</button>
            </div>
        </div>
    `;

    boardElement = document.getElementById('board-container');

    // Bind Events
    bindEvents();

    // Subscribe to store
    store.subscribe(render);

    // Start Game
    store.initGame('easy');
}

function bindEvents() {
    // Numpad
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const num = parseInt(e.target.dataset.num);
            store.inputNumber(num);
        });
    });

    // Keys
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key >= '1' && key <= '9') {
            store.inputNumber(parseInt(key));
        }
        if (key === 'Backspace' || key === 'Delete') {
            store.inputNumber(0);
        }
        if (key === 'ArrowUp') moveSelection(-1, 0);
        if (key === 'ArrowDown') moveSelection(1, 0);
        if (key === 'ArrowLeft') moveSelection(0, -1);
        if (key === 'ArrowRight') moveSelection(0, 1);
        if (key === 'z' && (e.ctrlKey || e.metaKey)) {
            store.undo();
        }
        if (key === 'n') {
            store.toggleNoteMode();
        }
    });

    // Controls
    document.getElementById('btn-undo').addEventListener('click', () => store.undo());
    document.getElementById('btn-erase').addEventListener('click', () => store.inputNumber(0));
    document.getElementById('btn-note').addEventListener('click', () => store.toggleNoteMode());
    document.getElementById('btn-hint').addEventListener('click', () => store.getHint());
    document.getElementById('btn-new').addEventListener('click', () => {
        if (confirm('Start new game?')) store.initGame('easy');
    });
}

function moveSelection(dRow, dCol) {
    const { selectedCell } = store.state;
    if (!selectedCell) {
        store.selectCell(0, 0);
        return;
    }
    const newRow = Math.max(0, Math.min(8, selectedCell.row + dRow));
    const newCol = Math.max(0, Math.min(8, selectedCell.col + dCol));
    store.selectCell(newRow, newCol);
}

/**
 * The main render loop.
 * efficient DOM updates by re-rendering the board grid.
 */
function render(state) {
    // Update Stats
    document.getElementById('timer-display').textContent = formatTime(state.timer);
    document.getElementById('mistakes-display').textContent = `${state.mistakes || 0}`;

    const noteBtn = document.getElementById('btn-note');
    if (state.isNoteMode) {
        noteBtn.classList.add('active');
        document.getElementById('note-status').textContent = "ON";
    } else {
        noteBtn.classList.remove('active');
        document.getElementById('note-status').textContent = "OFF";
    }

    if (state.status === 'won') {
        document.getElementById('game-over-modal').classList.add('open');
        document.getElementById('final-time').textContent = formatTime(state.timer);
    }

    renderBoard(state);
}


function renderBoard(state) {
    // Only rebuild if strict necessity (react-like check would be better, but innerHTML is fast enough for 81 elements)
    // We can optimize by only updating classes if structure exists, but clean rebuild ensures consistency.

    const { board, initialBoard, selectedCell, notes } = state;

    // Check if board needs creation
    if (!boardElement.children.length) {
        boardElement.innerHTML = `<div class="sudoku-board"></div>`;
    }
    const grid = boardElement.firstElementChild;
    grid.innerHTML = ''; // Clear

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cellVal = board[r][c];
            const isInitial = initialBoard[r][c] !== 0;
            const isSelected = selectedCell && selectedCell.row === r && selectedCell.col === c;

            // Highlights
            let isHighlighted = false;
            let isSameNum = false;

            if (selectedCell) {
                const sameRow = selectedCell.row === r;
                const sameCol = selectedCell.col === c;
                const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(r / 3) &&
                    Math.floor(selectedCell.col / 3) === Math.floor(c / 3);

                if (sameRow || sameCol || sameBox) isHighlighted = true;
                if (cellVal !== 0 && cellVal === board[selectedCell.row][selectedCell.col]) isSameNum = true;
            }

            const cell = document.createElement('div');
            cell.className = `cell 
                ${isInitial ? 'initial' : 'user-input'} 
                ${isSelected ? 'selected' : ''} 
                ${isHighlighted ? 'highlighted' : ''} 
                ${isSameNum ? 'same-number' : ''}
            `;

            cell.onclick = () => store.selectCell(r, c);

            if (cellVal !== 0) {
                cell.textContent = cellVal;
            } else {
                // Render Notes
                const cellNotes = notes[`${r}-${c}`];
                if (cellNotes && cellNotes.length > 0) {
                    const noteGrid = document.createElement('div');
                    noteGrid.className = 'note-grid';
                    for (let i = 1; i <= 9; i++) {
                        const noteItem = document.createElement('div');
                        noteItem.className = 'note-item';
                        if (cellNotes.includes(i)) noteItem.textContent = i;
                        noteGrid.appendChild(noteItem);
                    }
                    cell.appendChild(noteGrid);
                }
            }

            grid.appendChild(cell);
        }
    }
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
