// Game State
let allWatches = [];
let currentRound = 1;
const totalRounds = 10;
let currentChampion = null; // The winner from the previous round
let usedWatches = []; // Watches that have already battled
let currentPair = { left: null, right: null };

// DOM Elements
const battleScreen = document.getElementById('battle-screen');
const winnerScreen = document.getElementById('winner-screen');
const currentRoundDisplay = document.getElementById('current-round');
const progressFill = document.getElementById('progress-fill');

// Watch card elements
const watchImageLeft = document.getElementById('watch-image-left');
const watchNameLeft = document.getElementById('watch-name-left');
const watchImageRight = document.getElementById('watch-image-right');
const watchNameRight = document.getElementById('watch-name-right');
const cardLeft = document.getElementById('card-left');
const cardRight = document.getElementById('card-right');

// Winner screen elements
const winnerImage = document.getElementById('winner-image');
const winnerName = document.getElementById('winner-name');

// Initialize the game
async function init() {
    await loadWatchData();
    startNewRound();
}

// Google Sheets CSV URL (published sheet)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpZSzUVXWOulxipcds7UeUJzHImmTmw1FLhK1JdPv4gyB_2jf74z85TaCO867kI_MXGO6kGdobbDIg/pub?output=csv';

// Load watch data from Google Sheets
async function loadWatchData() {
    try {
        // Try loading from Google Sheets first
        console.log('Fetching data from Google Sheets...');
        const response = await fetch(GOOGLE_SHEET_CSV_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        console.log('CSV data received:', csvText.substring(0, 200) + '...'); // Log first 200 chars

        // Parse CSV and transform to watch objects
        allWatches = parseCSVToWatches(csvText);

        if (allWatches.length === 0) {
            throw new Error('No watches found in sheet');
        }

        console.log(`Loaded ${allWatches.length} watches from Google Sheets`);
        console.log('Sample watch:', allWatches[0]);

        // Shuffle the watches array for random matchups
        shuffleArray(allWatches);
    } catch (error) {
        console.error('Error loading watch data from Google Sheets:', error);

        // Try fallback to local JSON file
        try {
            console.log('Attempting to load from watches.json...');
            const response = await fetch('watches.json');
            allWatches = await response.json();
            console.log(`Loaded ${allWatches.length} watches from JSON file`);
            shuffleArray(allWatches);
        } catch (jsonError) {
            console.error('Error loading JSON fallback:', jsonError);
            // Last resort: use sample data
            console.log('Using sample data fallback (2 watches only)');
            allWatches = generateSampleData();
        }
    }
}

// Parse CSV data to watch objects
function parseCSVToWatches(csvText) {
    const lines = csvText.trim().split('\n');
    console.log(`Parsing ${lines.length} lines from CSV`);

    // Remove header row
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('Headers found:', headers);

    const dataRows = lines.slice(1);

    const watches = dataRows.map((row, index) => {
        // Parse CSV row (handles quoted values)
        const values = parseCSVRow(row);

        const watch = {};
        headers.forEach((header, index) => {
            watch[header] = values[index] || '';
        });

        // Transform to app format
        // Expected columns: id, style, retail price, brand, Name, Model, Image
        const transformed = {
            id: parseInt(watch.id) || 0,
            name: `${watch.brand} ${watch.Name} ${watch.Model}`.trim(),
            image: watch.Image,
            brand: watch.brand,
            model: watch.Model,
            style: watch.style,
            retailPrice: watch['retail price']
        };

        if (index === 0) {
            console.log('First watch parsed:', transformed);
        }

        return transformed;
    }).filter(watch => {
        const isValid = watch.id && watch.name && watch.image;
        if (!isValid) {
            console.warn('Filtered out invalid watch:', watch);
        }
        return isValid;
    });

    console.log(`Parsed ${watches.length} valid watches`);
    return watches;
}

// Parse a single CSV row (handles quoted commas)
function parseCSVRow(row) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    // Push the last value
    values.push(currentValue.trim());

    return values;
}

// Generate sample data as fallback
function generateSampleData() {
    return [
        {
            id: 1,
            name: "Rolex Submariner",
            image: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=400&h=400&fit=crop",
            brand: "Rolex",
            model: "Submariner",
            style: "Dive",
            retailPrice: "$8,000"
        },
        {
            id: 2,
            name: "Omega Speedmaster",
            image: "https://images.unsplash.com/photo-1611928482473-7b27d24eab80?w=400&h=400&fit=crop",
            brand: "Omega",
            model: "Speedmaster",
            style: "Chronograph",
            retailPrice: "$6,000"
        }
    ];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Start a new round
function startNewRound() {
    if (currentRound > totalRounds) {
        showFinalWinner();
        return;
    }

    // Update UI
    currentRoundDisplay.textContent = currentRound;
    updateProgressBar();

    // Get two random watches for this round
    const pair = getRandomPair();
    currentPair = pair;

    // Display the watches
    displayWatches(pair.left, pair.right);

    // Remove winner selection styling
    cardLeft.classList.remove('winner-selected');
    cardRight.classList.remove('winner-selected');
}

// Get a random pair of watches for tournament-style battle
function getRandomPair() {
    let left, right;

    if (currentRound === 1) {
        // First round: pick any two random watches
        const leftIndex = Math.floor(Math.random() * allWatches.length);
        left = allWatches[leftIndex];

        // Mark the first watch as used
        usedWatches.push(left);

        // Get available watches (not yet used)
        const availableWatches = allWatches.filter(w => !usedWatches.some(u => u.id === w.id));
        const rightIndex = Math.floor(Math.random() * availableWatches.length);
        right = availableWatches[rightIndex];

        // Mark the second watch as used
        usedWatches.push(right);
    } else {
        // Subsequent rounds: current champion vs a new challenger
        left = currentChampion;

        // Get watches that haven't been used yet
        const availableWatches = allWatches.filter(w => !usedWatches.some(u => u.id === w.id));

        // If no unused watches, reset and use from all watches
        if (availableWatches.length === 0) {
            const poolCopy = allWatches.filter(w => w.id !== currentChampion.id);
            const rightIndex = Math.floor(Math.random() * poolCopy.length);
            right = poolCopy[rightIndex];
        } else {
            const rightIndex = Math.floor(Math.random() * availableWatches.length);
            right = availableWatches[rightIndex];
        }

        // Mark the new challenger as used
        usedWatches.push(right);
    }

    return { left, right };
}

// Display watches on cards
function displayWatches(leftWatch, rightWatch) {
    watchImageLeft.src = leftWatch.image;
    watchImageLeft.alt = leftWatch.name;
    watchNameLeft.textContent = leftWatch.name;

    watchImageRight.src = rightWatch.image;
    watchImageRight.alt = rightWatch.name;
    watchNameRight.textContent = rightWatch.name;
}

// Handle winner selection
function selectWinner(position) {
    const winner = position === 'left' ? currentPair.left : currentPair.right;

    // Add visual feedback
    const selectedCard = position === 'left' ? cardLeft : cardRight;
    selectedCard.classList.add('winner-selected');

    // Set as the current champion for the next round
    currentChampion = winner;

    // Wait a bit for animation, then move to next round
    setTimeout(() => {
        currentRound++;
        startNewRound();
    }, 500);
}

// Update progress bar
function updateProgressBar() {
    const progress = ((currentRound - 1) / totalRounds) * 100;
    progressFill.style.width = progress + '%';
}

// Show final winner
function showFinalWinner() {
    // The current champion is the final winner
    const finalWinner = currentChampion;

    // Update winner screen
    winnerImage.src = finalWinner.image;
    winnerImage.alt = finalWinner.name;
    winnerName.textContent = finalWinner.name;

    // Hide battle screen, show winner screen
    battleScreen.classList.add('hidden');
    winnerScreen.classList.remove('hidden');

    // Update progress bar to 100%
    progressFill.style.width = '100%';
}

// Restart the game
function restartGame() {
    // Reset game state
    currentRound = 1;
    currentChampion = null;
    usedWatches = [];

    // Reshuffle watches
    shuffleArray(allWatches);

    // Hide winner screen, show battle screen
    winnerScreen.classList.add('hidden');
    battleScreen.classList.remove('hidden');

    // Start new game
    startNewRound();
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', init);
