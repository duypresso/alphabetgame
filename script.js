let score = 0;
let currentLetter = '';
let gameStarted = false;

function createLetterButtons() {
    const letterButtons = document.getElementById('letterButtons');
    letterButtons.innerHTML = '';
    for (let i = 65; i <= 90; i++) {
        const button = document.createElement('button');
        button.textContent = String.fromCharCode(i);
        button.addEventListener('click', () => checkAnswer(String.fromCharCode(i)));
        button.disabled = !gameStarted;
        letterButtons.appendChild(button);
    }
}

function generateRandomLetter() {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function updateDisplay() {
    document.getElementById('currentLetter').textContent = currentLetter;
    document.getElementById('score').textContent = score;
}

function checkAnswer(selectedLetter) {
    if (!gameStarted) return;

    const button = Array.from(document.querySelectorAll('.letter-buttons button'))
        .find(btn => btn.textContent === selectedLetter);

    if (selectedLetter === currentLetter) {
        score++;
        button.classList.add('correct');
    } else {
        button.classList.add('incorrect');
    }

    setTimeout(() => {
        button.classList.remove('correct', 'incorrect');
        currentLetter = generateRandomLetter();
        updateDisplay();
    }, 500);
}

function startGame() {
    gameStarted = true;
    score = 0;
    currentLetter = generateRandomLetter();
    updateDisplay();
    Array.from(document.querySelectorAll('.letter-buttons button')).forEach(button => {
        button.disabled = false;
    });
    document.getElementById('startButton').disabled = true;
}

function resetGame() {
    gameStarted = false;
    score = 0;
    currentLetter = '';
    updateDisplay();
    Array.from(document.querySelectorAll('.letter-buttons button')).forEach(button => {
        button.disabled = true;
    });
    document.getElementById('startButton').disabled = false;
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resetButton').addEventListener('click', resetGame);

// Initialize the game
createLetterButtons();
resetGame();
