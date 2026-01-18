/**
 * Game Store
 * Manages the state of the application.
 */
// import { generatePuzzle, isValidMove } from './sudoku.js'; // REMOVED

class GameStore {
    constructor() {
        this.state = {
            board: [],          // Current state of the grid
            initialBoard: [],   // The immutable starting puzzle
            solution: [],       // The answer key
            notes: {},          // Map of cell index (r-c) to array of numbers
            history: [],        // Undo stack
            future: [],         // Redo stack
            selectedCell: null, // {row, col}
            difficulty: 'easy',
            status: 'idle',     // idle, playing, won, paused
            timer: 0,
            isNoteMode: false,
            mistakes: 0
        };
        this.listeners = new Set();
        this.timerInterval = null;
    }

    /**
     * Subscribe to state changes.
     * @param {Function} callback 
     * @returns {Function} unsubscribe
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify() {
        // Debounce slightly or just run
        this.listeners.forEach(cb => cb(this.state));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    // --- Actions ---

    initGame(difficulty = 'easy') {
        const { puzzle, solution } = App.Core.generatePuzzle(difficulty);
        this.stopTimer();

        this.state = {
            ...this.state,
            board: JSON.parse(JSON.stringify(puzzle)),
            initialBoard: JSON.parse(JSON.stringify(puzzle)),
            solution,
            notes: {},
            history: [],
            future: [],
            selectedCell: null,
            difficulty,
            status: 'playing',
            timer: 0,
            mistakes: 0
        };

        this.startTimer();
        this.notify();
    }

    selectCell(row, col) {
        this.setState({ selectedCell: { row, col } });
    }

    toggleNoteMode() {
        this.setState({ isNoteMode: !this.state.isNoteMode });
    }

    inputNumber(num) {
        const { selectedCell, board, initialBoard, isNoteMode, notes, history } = this.state;
        if (!selectedCell) return;
        if (this.state.status !== 'playing') return;

        const { row, col } = selectedCell;

        // Immutable check
        if (initialBoard[row][col] !== 0) return;

        if (isNoteMode) {
            // Toggle note
            const key = `${row}-${col}`;
            const currentNotes = notes[key] || [];
            const newNotes = currentNotes.includes(num)
                ? currentNotes.filter(n => n !== num)
                : [...currentNotes, num].sort();

            this.setState({
                notes: { ...notes, [key]: newNotes }
            });
        } else {
            // Enter number
            if (board[row][col] === num) return; // No change

            // Save to history
            const newHistory = [...history, {
                board: JSON.parse(JSON.stringify(board)),
                notes: { ...notes }
            }];

            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[row][col] = num;

            // Check correctness immediately? (Optional design choice, let's just allow it but track mistakes if we wanted to validation)
            // For now, simple input.

            // Auto-clean notes for this cell and peers? 
            // Let's implement smart note cleaning for "High Functionality"
            const newNotes = { ...notes };
            delete newNotes[`${row}-${col}`];
            // Remove this number from notes of peers (row, col, box)
            // (Implementation choice: keep simple for now, add smarts if needed)

            this.setState({
                board: newBoard,
                history: newHistory,
                future: [],
                notes: newNotes
            });

            this.checkWinCondition(newBoard);
        }
    }

    undo() {
        const { history, board, notes } = this.state;
        if (history.length === 0) return;

        const previous = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        this.setState({
            board: previous.board,
            notes: previous.notes,
            history: newHistory,
            future: [...this.state.future, { board, notes }]
        });
    }

    // Timer Logic
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.setState({ timer: this.state.timer + 1 });
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    getHint() {
        if (this.state.status !== 'playing') return;
        const { board, solution } = this.state;

        // Find an empty cell
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) emptyCells.push({ r, c });
            }
        }

        if (emptyCells.length === 0) return;

        // Pick random empty cell
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { r, c } = randomCell;

        // Fill it
        this.selectCell(r, c);
        this.inputNumber(solution[r][c]);
    }

    checkWinCondition(currentBoard) {
        // Simple check: is full and matches solution
        // Or valid
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (currentBoard[r][c] === 0) return; // Not full
                if (currentBoard[r][c] !== this.state.solution[r][c]) return; // Wrong
            }
        }
        this.stopTimer();
        this.setState({ status: 'won' });
    }
}

// Export to Namespace
App.Store = new GameStore();
// export const store = new GameStore();
