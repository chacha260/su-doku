/**
 * Sudoku Core Logic
 * Handles board generation, solving, and validation.
 */

// Basic Sudoku Types and Constants
const GRID_SIZE = 9;
const BOX_SIZE = 3;
const EMPTY = 0;

/**
 * Checks if a number can be placed at a specific position.
 * @param {number[][]} board 
 * @param {number} row 
 * @param {number} col 
 * @param {number} num 
 * @returns {boolean}
 */
App.Core.isValidMove = function (board, row, col, num) {
    if (board[row][col] !== EMPTY) return false;

    // Row Check
    for (let c = 0; c < GRID_SIZE; c++) {
        if (board[row][c] === num) return false;
    }

    // Col Check
    for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r][col] === num) return false;
    }

    // Box Check
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = 0; r < BOX_SIZE; r++) {
        for (let c = 0; c < BOX_SIZE; c++) {
            if (board[boxRow + r][boxCol + c] === num) return false;
        }
    }

    return true;
}

// Assign other functions to Namespace
App.Core.solveSudoku = solveSudoku;
App.Core.generateFullBoard = generateFullBoard;
App.Core.generatePuzzle = generatePuzzle;

/**
 * Solves the board using backtracking.
 * @param {number[][]} board 
 * @param {boolean} randomize - Randomize number order for generation
 * @returns {boolean}
 */
function solveSudoku(board, randomize = false) {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col] === EMPTY) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                if (randomize) shuffleArray(nums);

                for (const num of nums) {
                    if (isValidMove(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board, randomize)) return true;
                        board[row][col] = EMPTY;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * Counts number of solutions (to ensure uniqueness).
 * Caps at 2 to save performance (0, 1, or >1).
 */
function countSolutions(board) {
    let count = 0;

    function solve(currentBoard) {
        if (count > 1) return;

        let row = -1;
        let col = -1;
        let isEmpty = false;

        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (currentBoard[i][j] === EMPTY) {
                    row = i;
                    col = j;
                    isEmpty = true;
                    break;
                }
            }
            if (isEmpty) break;
        }

        if (!isEmpty) {
            count++;
            return;
        }

        for (let num = 1; num <= 9; num++) {
            if (isValidMove(currentBoard, row, col, num)) {
                currentBoard[row][col] = num;
                solve(currentBoard);
                currentBoard[row][col] = EMPTY;
            }
        }
    }

    solve(JSON.parse(JSON.stringify(board)));
    return count;
}


/**
 * Generates a full valid board.
 */
function generateFullBoard() {
    const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(EMPTY));
    solveSudoku(board, true);
    return board;
}

/**
 * Generates a puzzle by removing numbers from a full board.
 * Ensures a unique solution exists.
 * @param {string} difficulty - 'easy', 'medium', 'hard', 'expert'
 */
function generatePuzzle(difficulty = 'easy') {
    const fullBoard = generateFullBoard();
    const solution = JSON.parse(JSON.stringify(fullBoard));
    const puzzle = JSON.parse(JSON.stringify(fullBoard));

    let attempts;
    switch (difficulty) {
        case 'medium': attempts = 40; break;
        case 'hard': attempts = 50; break;
        case 'expert': attempts = 60; break;
        case 'easy': default: attempts = 30; break;
    }

    // Try removing cells
    while (attempts > 0) {
        let row = Math.floor(Math.random() * GRID_SIZE);
        let col = Math.floor(Math.random() * GRID_SIZE);

        while (puzzle[row][col] === EMPTY) {
            row = Math.floor(Math.random() * GRID_SIZE);
            col = Math.floor(Math.random() * GRID_SIZE);
        }

        const backup = puzzle[row][col];
        puzzle[row][col] = EMPTY;

        const solutions = countSolutions(puzzle);
        if (solutions !== 1) {
            puzzle[row][col] = backup; // Put it back if unique solution is lost
            attempts--; // Count as a failed attempt to remove more hard ones
        }
    }

    return { puzzle, solution };
}

// Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
