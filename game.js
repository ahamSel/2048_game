class Game2048 {
    constructor() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        // Create cell elements first
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                
                // Create a ghost tile in each cell
                const ghost = document.createElement('div');
                ghost.classList.add('tile', 'ghost');
                cell.appendChild(ghost);
                
                this.gameBoard.appendChild(cell);
            }
        }
        this.addRandomTile();
        this.addRandomTile();
        this.renderBoard();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault(); // Prevent page scrolling
                const beforeMove = JSON.stringify(this.board);
                
                switch(e.key) {
                    case 'ArrowUp': this.move('up'); break;
                    case 'ArrowDown': this.move('down'); break;
                    case 'ArrowLeft': this.move('left'); break;
                    case 'ArrowRight': this.move('right'); break;
                }

                const afterMove = JSON.stringify(this.board);
                if (beforeMove !== afterMove) {
                    this.addRandomTile();
                    this.renderBoard();
                }
            }
        });
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
            
            // Add spawn animation
            const cell = this.gameBoard.children[r * 4 + c];
            const tile = document.createElement('div');
            tile.classList.add('tile', 'new-tile');
            tile.textContent = this.board[r][c];
            tile.classList.add(`tile-${this.board[r][c]}`);
            
            // Clear any existing tiles in the cell
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
            
            cell.appendChild(tile);
            
            // Remove the animation class after it's done
            setTimeout(() => {
                tile.classList.remove('new-tile');
            }, 300);
        }
    }

    renderBoard() {
        const tiles = this.gameBoard.children;
        
        // Only update non-moving tiles
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const index = r * 4 + c;
                const cell = tiles[index];
                const value = this.board[r][c];
                
                // Skip if there's a moving tile
                if (cell.querySelector('.moving')) {
                    continue;
                }
                
                // Clear any existing moving tiles
                const existingMoving = cell.querySelector('.moving');
                if (existingMoving) {
                    cell.removeChild(existingMoving);
                }
                
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile', 'moving');
                    tile.textContent = value;
                    tile.classList.add(`tile-${value}`);
                    cell.appendChild(tile);
                }
            }
        }
        
        this.scoreDisplay.textContent = this.score;
    }

    move(direction) {
        const previousPositions = this.getTilePositions();
        let moved = false;
        const rotatedBoard = this.rotateBoard(direction);
        const mergedPositions = new Set(); // Track merged positions
        
        for (let r = 0; r < 4; r++) {
            const originalRow = [...rotatedBoard[r]];
            const row = rotatedBoard[r].filter(val => val !== 0);
            
            // Check if tiles will move within the row
            if (row.length !== originalRow.length || row.some((val, idx) => val !== originalRow[idx])) {
                moved = true;
            }
            
            for (let c = 0; c < row.length - 1; c++) {
                if (row[c] === row[c + 1]) {
                    row[c] *= 2;
                    this.score += row[c];
                    row.splice(c + 1, 1);
                    moved = true;
                    
                    // Track merged position
                    const pos = this.getPositionAfterRotation(r, c, direction);
                    mergedPositions.add(`${pos.r}-${pos.c}`);
                }
            }
            
            while (row.length < 4) {
                row.push(0);
            }
            
            rotatedBoard[r] = row;
        }
        
        this.board = this.unrotateBoard(rotatedBoard, direction);
        
        if (moved) {
            const newPositions = this.getTilePositions();
            this.animateMovement(previousPositions, newPositions, mergedPositions);
        }
        
        return moved;
    }

    getTilePositions() {
        const positions = new Map();
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const value = this.board[r][c];
                if (value !== 0) {
                    positions.set(`${r}-${c}`, { value, r, c });
                }
            }
        }
        return positions;
    }

    animateMovement(previousPositions, newPositions, mergedPositions) {
        const cells = this.gameBoard.children;
        const cellSize = 115;
        const usedSourceCells = new Set();
        const mergeAnimations = new Map(); // Track merge animations

        // Clear all moving tiles first
        for (let i = 0; i < cells.length; i++) {
            const movingTiles = cells[i].querySelectorAll('.moving');
            movingTiles.forEach(tile => tile.remove());
        }

        // Determine movement direction
        let primaryDirection = 'none';
        if (newPositions.size > 0 && previousPositions.size > 0) {
            const [firstNewPos] = newPositions.values();
            const [firstPrevPos] = previousPositions.values();
            if (Math.abs(firstNewPos.r - firstPrevPos.r) > Math.abs(firstNewPos.c - firstPrevPos.c)) {
                primaryDirection = firstNewPos.r > firstPrevPos.r ? 'down' : 'up';
            } else {
                primaryDirection = firstNewPos.c > firstPrevPos.c ? 'right' : 'left';
            }
        }

        // Sort positions based on movement direction
        const sortedNewPositions = [...newPositions].sort((a, b) => {
            const [, posA] = a;
            const [, posB] = b;
            if (primaryDirection === 'down' || primaryDirection === 'up') {
                return posA.c !== posB.c ? posA.c - posB.c : 
                       (primaryDirection === 'down' ? posB.r - posA.r : posA.r - posB.r);
            } else {
                return posA.r !== posB.r ? posA.r - posB.r :
                       (primaryDirection === 'right' ? posB.c - posA.c : posA.c - posB.c);
            }
        });

        // Create and animate new tiles
        for (const [newKey, newPos] of sortedNewPositions) {
            const value = newPos.value;
            const isMergeDestination = mergedPositions.has(`${newPos.r}-${newPos.c}`);
            const targetValue = isMergeDestination ? value / 2 : value;
            
            // Find source tiles
            const sourceTiles = [];
            for (const [prevKey, prevPos] of previousPositions) {
                if (prevPos.value === targetValue && !usedSourceCells.has(`${prevPos.r}-${prevPos.c}`)) {
                    let score = 0;
                    const rowDiff = newPos.r - prevPos.r;
                    const colDiff = newPos.c - prevPos.c;

                    // Scoring logic
                    if (primaryDirection === 'down' && rowDiff < 0) score += 1000;
                    if (primaryDirection === 'up' && rowDiff > 0) score += 1000;
                    if (primaryDirection === 'right' && colDiff < 0) score += 1000;
                    if (primaryDirection === 'left' && colDiff > 0) score += 1000;
                    
                    score += Math.abs(rowDiff) + Math.abs(colDiff);
                    
                    if ((primaryDirection === 'up' || primaryDirection === 'down') && colDiff !== 0) score += 500;
                    if ((primaryDirection === 'left' || primaryDirection === 'right') && rowDiff !== 0) score += 500;

                    sourceTiles.push({ pos: prevPos, score });
                }
            }

            // Sort source tiles by score
            sourceTiles.sort((a, b) => a.score - b.score);

            // For merge, we need two source tiles
            const tilesToAnimate = isMergeDestination ? 
                sourceTiles.slice(0, 2) : 
                sourceTiles.slice(0, 1);

            for (const {pos: sourcePos} of tilesToAnimate) {
                const sourceCell = cells[sourcePos.r * 4 + sourcePos.c];
                const targetCell = cells[newPos.r * 4 + newPos.c];
                
                // Clear the source cell
                while (sourceCell.firstChild) {
                    sourceCell.removeChild(sourceCell.firstChild);
                }
                
                const tile = document.createElement('div');
                tile.classList.add('tile', 'moving');
                tile.textContent = targetValue;
                tile.classList.add(`tile-${targetValue}`);
                
                const deltaX = (newPos.c - sourcePos.c) * cellSize;
                const deltaY = (newPos.r - sourcePos.r) * cellSize;
                tile.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
                
                targetCell.appendChild(tile);
                
                tile.offsetHeight;
                
                requestAnimationFrame(() => {
                    tile.style.transition = 'transform 0.15s ease-in-out';
                    tile.style.transform = 'translate(0, 0)';
                });

                usedSourceCells.add(`${sourcePos.r}-${sourcePos.c}`);

                // Add to merge animations if this is a merge destination
                if (isMergeDestination) {
                    if (!mergeAnimations.has(`${newPos.r}-${newPos.c}`)) {
                        mergeAnimations.set(`${newPos.r}-${newPos.c}`, []);
                    }
                    mergeAnimations.get(`${newPos.r}-${newPos.c}`).push(tile);
                }
            }
        }

        // Handle merge animations after movement
        setTimeout(() => {
            for (const [, tiles] of mergeAnimations) {
                if (tiles.length === 2) {
                    tiles.forEach(tile => {
                        tile.classList.add('merge');
                    });
                }
            }
        }, 150);

        // Final cleanup
        setTimeout(() => {
            // Clear all cells first
            for (let i = 0; i < cells.length; i++) {
                while (cells[i].firstChild) {
                    cells[i].removeChild(cells[i].firstChild);
                }
            }
            // Render the final state
            this.renderBoard();
        }, 300);
    }

    isPositionUsed(position, newPositions) {
        for (const [key, pos] of newPositions) {
            if (pos.r === position.r && pos.c === position.c && key !== `${position.r}-${position.c}`) {
                return true;
            }
        }
        return false;
    }

    getPositionAfterRotation(r, c, direction) {
        switch(direction) {
            case 'up': return {r: c, c: r};
            case 'down': return {r: 3-c, c: r};
            case 'left': return {r, c};
            case 'right': return {r, c: 3-c};
        }
    }

    rotateBoard(direction) {
        switch(direction) {
            case 'up': return this.transposeBoard(this.board);
            case 'down': return this.transposeBoard(this.board).map(row => row.reverse());
            case 'left': return this.board;
            case 'right': return this.board.map(row => row.reverse());
        }
    }

    unrotateBoard(board, direction) {
        switch(direction) {
            case 'up': return this.transposeBoard(board);
            case 'down': return this.transposeBoard(board.map(row => row.reverse()));
            case 'left': return board;
            case 'right': return board.map(row => row.reverse());
        }
    }

    transposeBoard(board) {
        return board[0].map((_, colIndex) => board.map(row => row[colIndex]));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
