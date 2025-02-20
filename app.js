const grid = document.getElementById('grid');
const generateWallsBtn = document.getElementById('generateWalls');
const gridSizeInput = document.getElementById('gridSize');
const algorithmSelect = document.getElementById('algorithm');
const startBtn = document.getElementById('startVisualization');
const fromDiv = document.getElementById('from');
const distanceDiv = document.getElementById('distance');
const toDiv = document.getElementById('to');
const timerDiv = document.getElementById('timer');
const color = {};

color.grid = 'bg-gray-700';
color.startNode = 'bg-white';
color.endNode = 'bg-rose-500';
color.bgWall = 'bg-black';
color.neighbor = 'bg-gray-400/60';
color.path = 'bg-green-500';

let gridSize = 20;
let cells = [];
let start = null;
let end = null;
let touchStartTime;
let longPressTimer;
let startTime;
let timerInterval;
let isTimerRunning = false;

function startTimer() {
  if (!isTimerRunning) {
      startTime = performance.now();
      isTimerRunning = true;
      timerInterval = setInterval(() => {
          const currentTime = performance.now();
          const elapsedTime = currentTime - startTime;
          timerDiv.textContent = `Time: ${elapsedTime.toFixed(2)} ms`;
      }, 10); // Update every 10ms for smooth display
  }
}

function stopTimer() {
  if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
  }
}



function createGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
  cells = [];

  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add(color.grid, 'aspect-square', 'rounded');
    cell.addEventListener('mousedown', (e) => handleCellInteraction(e, i));
    cell.addEventListener('touchstart', (e) => handleTouchStart(e, i));
    cell.addEventListener('touchend', (e) => handleTouchEnd(e, i));

    grid.appendChild(cell);
    cells.push({
      element: cell,
      isWall: false,
      distance: Infinity,
      visited: false
    });
  }

  updateInfoDisplay();
}

function handleCellInteraction(event, index) {
  event.preventDefault();
  if (event.button === 0) { // Left click
    setStartNode(index);
  } else if (event.button === 2) { // Right click
    setEndNode(index);
  }
  updateStartButton();
}

function handleTouchStart(event, index) {
  event.preventDefault();
  touchStartTime = new Date().getTime();
  longPressTimer = setTimeout(() => {
    setEndNode(index);
    updateStartButton();
  }, 500); // 500ms for long press
}

function handleTouchEnd(event, index) {
  event.preventDefault();
  const touchEndTime = new Date().getTime();
  clearTimeout(longPressTimer);

  if (touchEndTime - touchStartTime < 500) {
    setStartNode(index);
    updateStartButton();
  }
}

function setStartNode(index) {
  if (start !== null) {
    cells[start].element.classList.remove(color.startNode);
  }
  start = index;
  cells[start].element.classList.add(color.startNode);
  cells[start].isWall = false;
  updateInfoDisplay();
}

function setEndNode(index) {
  if (end !== null) {
    cells[end].element.classList.remove(color.endNode);
  }
  end = index;
  cells[end].element.classList.add(color.endNode);
  cells[end].isWall = false;
  updateInfoDisplay();
}

function updateStartButton() {
  start !== null && end !== null ? enableStartBtn() : disableStartBtn();
}

function enableNav() {
  gridSizeInput.disabled = false;
  gridSizeInput.classList.remove('opacity-50', 'cursor-not-allowed');
  algorithmSelect.disabled = false;
  algorithmSelect.classList.remove('opacity-50', 'cursor-not-allowed');
}

function disableNav() {
  gridSizeInput.disabled = true;
  gridSizeInput.classList.add('opacity-50', 'cursor-not-allowed');
  algorithmSelect.disabled = true;
  algorithmSelect.classList.add('opacity-50', 'cursor-not-allowed');
}

function enableResetBtn() {
  generateWallsBtn.disabled = false;
  generateWallsBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

function disableResetBtn() {
  generateWallsBtn.disabled = true;
  generateWallsBtn.classList.add('opacity-50', 'cursor-not-allowed');
}

function enableStartBtn() {
  startBtn.disabled = false;
  startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

function disableStartBtn() {
  startBtn.disabled = true;
  startBtn.classList.add('opacity-50', 'cursor-not-allowed');
}

function toggleWall(index) {
  if (index !== start && index !== end) {
    cells[index].isWall = !cells[index].isWall;
    cells[index].element.classList.toggle(color.bgWall);
  }
}

function generateWalls() {
  start = null;
  end = null;
  updateStartButton();
  createGrid();
  hideErrorButton();
  timerDiv.textContent = `Time: 0 ms`;

  for (let i = 0; i < cells.length; i++) {
    if (i !== start && i !== end && Math.random() < 0.3) {
      cells[i].isWall = true;
      cells[i].element.classList.add(color.bgWall, 'cell-wall', 'bg-cover', 'bg-center', 'bg-no-repeat');
    } else {
      cells[i].isWall = false;
      cells[i].element.classList.remove(color.bgWall, 'cell-wall', 'bg-cover', 'bg-center', 'bg-no-repeat');
    }
  }
}

function hideErrorButton() {
  distanceDiv.classList.remove('bg-gradient-to-br', 'from-red-400', 'via-red-900', 'to-black', 'animate-bounce', 'shadow');
  distanceDiv.classList.add('bg-green-500');
}

function getNeighbors(index) {
  const neighbors = [];
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  if (row > 0) neighbors.push(index - gridSize);
  if (row < gridSize - 1) neighbors.push(index + gridSize);
  if (col > 0) neighbors.push(index - 1);
  if (col < gridSize - 1) neighbors.push(index + 1);

  return neighbors.filter(i => !cells[i].isWall);
}

async function bfs() {
  startTimer();
  const queue = [start];
  cells[start].visited = true;
  cells[start].distance = 0;
  const parent = new Array(cells.length).fill(null);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === end) {
      stopTimer();
      console.log('Path found (BFS):', reconstructPath(parent));
      return true;
    } 

    for (const neighbor of getNeighbors(current)) {
      if (!cells[neighbor].visited) {
        cells[neighbor].visited = true;
        cells[neighbor].distance = cells[current].distance + 1;
        parent[neighbor] = current;
        queue.push(neighbor);

        if (neighbor !== end) {
          cells[neighbor].element.classList.add(color.neighbor, 'animate-pulse');
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }
  }

  stopTimer();
  console.log('No path found (BFS)');
  return false;
}

async function dijkstra() {
  startTimer();
  const pq = [{ index: start, distance: 0 }];
  cells[start].distance = 0;
  const parent = new Array(cells.length).fill(null);

  while (pq.length > 0) {
    pq.sort((a, b) => a.distance - b.distance);
    const { index: current } = pq.shift();

    if (current === end) {
      stopTimer();
      console.log('Path found (Dijkstra):', reconstructPath(parent));
      return true;
    } 

    for (const neighbor of getNeighbors(current)) {
      const newDistance = cells[current].distance + 1;
      if (newDistance < cells[neighbor].distance) {
        cells[neighbor].distance = newDistance;
        parent[neighbor] = current;
        pq.push({ index: neighbor, distance: newDistance });

        if (neighbor !== end) {
          cells[neighbor].element.classList.add(color.neighbor, 'animate-pulse');
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }
  }

  stopTimer();
  console.log('No path found (Dijkstra)');
  return false;
}

function reconstructPath(parent) {
  const path = [];
  let current = end;
  
  while (current !== null) {
    path.unshift(current);
    current = parent[current];
  }
  
  return path;
}

async function visualizePath() {
  let current = end;
  while (current !== start) {
    const neighbors = getNeighbors(current);
    const prevNode = neighbors.reduce((a, b) => cells[a].distance < cells[b].distance ? a : b);
    if (prevNode !== start) {
      cells[prevNode].element.classList.remove(color.neighbor, 'animate-pulse');
      cells[prevNode].element.classList.add(color.path);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    current = prevNode;
  }
  updateInfoDisplay();
}

function updateInfoDisplay() {
  fromDiv.textContent = start !== null ? `From: ${start}` : 'From: Not set';
  distanceDiv.textContent = `Distance: ${end !== null && cells[end].distance !== Infinity ? cells[end].distance : 0}`;
  toDiv.textContent = end !== null ? `To: ${end}` : 'To: Not set';
}

function resetGrid() {
  stopTimer();
  for (const cell of cells) {
    cell.distance = Infinity;
    cell.visited = false;
    cell.element.classList.remove(color.neighbor, 'animate-pulse', color.path);
  }
  distanceDiv.classList.remove('bg-white');
  distanceDiv.classList.add('bg-green-500');
  timerDiv.textContent = 'Time: 0 ms';
  updateInfoDisplay();
}

function showNoPathFound() {
  distanceDiv.textContent = 'No path found';
  distanceDiv.classList.remove('bg-green-500');
  distanceDiv.classList.add('bg-gradient-to-br', 'from-red-400', 'via-red-900', 'to-black', 'animate-bounce', 'shadow');
}

createGrid();
generateWalls();

generateWallsBtn.addEventListener('click', generateWalls);
gridSizeInput.addEventListener('change', () => {
  gridSize = parseInt(gridSizeInput.value);
  start = null;
  end = null;
  createGrid();
  generateWalls();
  updateStartButton();
});
startBtn.addEventListener('click', async () => {
  resetGrid();
  hideErrorButton();
  disableStartBtn();
  disableResetBtn();
  disableNav();
  let pathFound;
  pathFound = algorithmSelect.value === 'bfs' ? await bfs() : await dijkstra();
  pathFound ? await visualizePath() : showNoPathFound();
  // Stop in all cases
  stopTimer();
  enableNav();
  enableStartBtn();
  enableResetBtn();
});

// Prevent context menu on right-click
grid.addEventListener('contextmenu', (e) => e.preventDefault());