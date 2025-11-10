// Game State
let allWatches = [];
let gameWatches = []; // Filtered watches based on game mode
let gameMode = null; // Selected game mode: 'brand', 'price', 'style', or 'random'
let currentRound = 1;
let totalRounds = 10; // Default value, can be changed by user (5-10)
let currentChampion = null; // The winner from the previous round
let championPosition = null; // Track which side the champion is on ('left' or 'right')
let usedWatches = []; // Watches that have already battled
let currentPair = { left: null, right: null };
let roundHistory = []; // Track winner and loser for each round

// DOM Elements
const modeScreen = document.getElementById('mode-screen');
const battleScreen = document.getElementById('battle-screen');
const winnerScreen = document.getElementById('winner-screen');
const progressContainer = document.querySelector('.progress-container');
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
    // Don't start the game yet - wait for mode selection
    // Hide progress container on mode selection screen
    progressContainer.style.display = 'none';
}

// Round selection functions
function increaseRounds() {
    const roundInput = document.getElementById('round-count');
    let currentValue = parseInt(roundInput.value);
    if (currentValue < 10) {
        roundInput.value = currentValue + 1;
    }
}

function decreaseRounds() {
    const roundInput = document.getElementById('round-count');
    let currentValue = parseInt(roundInput.value);
    if (currentValue > 5) {
        roundInput.value = currentValue - 1;
    }
}

// Select game mode and start the battle
function selectGameMode(mode) {
    gameMode = mode;

    // Get selected number of rounds
    const roundInput = document.getElementById('round-count');
    totalRounds = parseInt(roundInput.value);

    console.log(`Game mode selected: ${mode}`);
    console.log(`Total rounds: ${totalRounds}`);

    // Filter watches based on selected mode
    gameWatches = filterWatchesByMode(mode);

    if (gameWatches.length < 2) {
        alert(`Not enough watches for ${mode} mode. Switching to random mode.`);
        gameMode = 'random';
        gameWatches = [...allWatches];
    }

    console.log(`${gameWatches.length} watches available for this mode`);

    // Shuffle the game watches
    shuffleArray(gameWatches);

    // Hide mode screen, show battle screen and progress
    modeScreen.classList.add('hidden');
    battleScreen.classList.remove('hidden');
    progressContainer.style.display = 'block';

    // Start the battle
    startNewRound();
}

// Filter watches based on game mode
function filterWatchesByMode(mode) {
    if (mode === 'random') {
        return [...allWatches];
    }

    if (mode === 'brand') {
        // Group watches by brand
        const brandCounts = {};
        allWatches.forEach(watch => {
            const brand = watch.brand || 'Unknown';
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });

        // Filter brands that have at least 2 watches
        const validBrands = Object.entries(brandCounts)
            .filter(([, count]) => count >= 2)
            .map(([brand, count]) => ({ brand, count }));

        if (validBrands.length === 0) {
            console.log('No brands with enough watches, using all watches');
            return [...allWatches];
        }

        // Randomly select one brand from valid brands
        const selectedBrand = validBrands[Math.floor(Math.random() * validBrands.length)];

        console.log(`Randomly selected brand: ${selectedBrand.brand} with ${selectedBrand.count} watches`);
        return allWatches.filter(watch => watch.brand === selectedBrand.brand);
    }

    if (mode === 'price') {
        // Group watches by price ranges
        const priceRanges = {
            'under100': { name: 'Under $100', watches: [] },
            '100to200': { name: '$100 - $200', watches: [] },
            '200to500': { name: '$200 - $500', watches: [] },
            '500to1000': { name: '$500 - $1,000', watches: [] },
            '1000to2500': { name: '$1,000 - $2,500', watches: [] },
            '2500to5000': { name: '$2,500 - $5,000', watches: [] },
            '5000to10000': { name: '$5,000 - $10,000', watches: [] },
            '10000to25000': { name: '$10,000 - $25,000', watches: [] },
            'over25000': { name: 'Over $25,000', watches: [] }
        };

        allWatches.forEach(watch => {
            const priceStr = watch.retailPrice || '';
            const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

            if (priceNum < 100) {
                priceRanges['under100'].watches.push(watch);
            } else if (priceNum < 200) {
                priceRanges['100to200'].watches.push(watch);
            } else if (priceNum < 500) {
                priceRanges['200to500'].watches.push(watch);
            } else if (priceNum < 1000) {
                priceRanges['500to1000'].watches.push(watch);
            } else if (priceNum < 2500) {
                priceRanges['1000to2500'].watches.push(watch);
            } else if (priceNum < 5000) {
                priceRanges['2500to5000'].watches.push(watch);
            } else if (priceNum < 10000) {
                priceRanges['5000to10000'].watches.push(watch);
            } else if (priceNum < 25000) {
                priceRanges['10000to25000'].watches.push(watch);
            } else {
                priceRanges['over25000'].watches.push(watch);
            }
        });

        // Filter ranges that have at least 2 watches
        const validRanges = Object.entries(priceRanges)
            .filter(([, data]) => data.watches.length >= 2)
            .map(([key, data]) => ({ key, ...data }));

        if (validRanges.length === 0) {
            console.log('No price ranges with enough watches, using all watches');
            return [...allWatches];
        }

        // Randomly select one price range from valid ranges
        const selectedRange = validRanges[Math.floor(Math.random() * validRanges.length)];

        console.log(`Randomly selected price range: ${selectedRange.name} with ${selectedRange.watches.length} watches`);
        return selectedRange.watches;
    }

    if (mode === 'style') {
        // Build a map of individual style tags to watches that have those tags
        const styleTagToWatches = {};

        allWatches.forEach(watch => {
            const styleStr = watch.style || 'Unknown';
            // Split by comma and trim whitespace to get individual style tags
            const styleTags = styleStr.split(',').map(tag => tag.trim());

            // Add this watch to each of its style tags
            styleTags.forEach(tag => {
                if (!styleTagToWatches[tag]) {
                    styleTagToWatches[tag] = [];
                }
                styleTagToWatches[tag].push(watch);
            });
        });

        // Filter to style tags that have at least 2 watches
        const validStyleTags = Object.entries(styleTagToWatches)
            .filter(([, watches]) => watches.length >= 2)
            .map(([tag, watches]) => ({ tag, count: watches.length }));

        if (validStyleTags.length === 0) {
            console.log('No style tags with enough watches, using all watches');
            return [...allWatches];
        }

        // Randomly select one style tag from valid tags
        const selectedStyleTag = validStyleTags[Math.floor(Math.random() * validStyleTags.length)];

        console.log(`Randomly selected style tag: ${selectedStyleTag.tag} with ${selectedStyleTag.count} watches`);
        return styleTagToWatches[selectedStyleTag.tag];
    }

    // Default to all watches
    return [...allWatches];
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
        // Expected columns: Style, Retail Price, Brand, Name, images
        // Handle multiple images - take the first one if comma-separated
        const imageUrl = watch.images ? watch.images.split(',')[0].trim() : '';

        // Construct the display name, avoiding brand duplication
        let displayName = '';
        const brandName = watch.Brand || '';
        const modelName = watch.Name || '';

        // Check if Name already starts with Brand to avoid duplication
        if (modelName.toLowerCase().startsWith(brandName.toLowerCase())) {
            // Name already includes brand, just use Name
            displayName = modelName.trim();
        } else {
            // Name doesn't include brand, add it
            displayName = `${brandName} ${modelName}`.trim();
        }

        const transformed = {
            id: index + 1, // Generate sequential ID
            name: displayName,
            image: imageUrl,
            brand: watch.Brand,
            style: watch.Style,
            retailPrice: watch['Retail Price']
        };

        if (index === 0) {
            console.log('First watch parsed:', transformed);
        }

        return transformed;
    }).filter(watch => {
        const isValid = watch.name && watch.image;
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
            style: "Dive",
            retailPrice: "$8,000"
        },
        {
            id: 2,
            name: "Omega Speedmaster",
            image: "https://images.unsplash.com/photo-1611928482473-7b27d24eab80?w=400&h=400&fit=crop",
            brand: "Omega",
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

    // Check if we ran out of watches in this game mode
    if (pair === null) {
        console.log('No more watches available in this mode. Tournament ends early.');
        showFinalWinner();
        return;
    }

    currentPair = pair;

    // Debug logging
    console.log(`Round ${currentRound}:`);
    if (currentRound === 1) {
        console.log('Left:', pair.left.name);
        console.log('Right:', pair.right.name);
    } else {
        console.log('Left:', pair.left.name, championPosition === 'left' ? '(Champion)' : '(Challenger)');
        console.log('Right:', pair.right.name, championPosition === 'right' ? '(Champion)' : '(Challenger)');
    }

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
        // First round: pick any two random watches from gameWatches
        const leftIndex = Math.floor(Math.random() * gameWatches.length);
        left = gameWatches[leftIndex];

        // Mark the first watch as used
        usedWatches.push(left);

        // Get available watches (not yet used)
        const availableWatches = gameWatches.filter(w => !usedWatches.some(u => u.id === w.id));
        const rightIndex = Math.floor(Math.random() * availableWatches.length);
        right = availableWatches[rightIndex];

        // Mark the second watch as used
        usedWatches.push(right);
    } else {
        // Subsequent rounds: champion stays in same position, new challenger on the other side
        // Get watches that haven't been used yet
        const availableWatches = gameWatches.filter(w => !usedWatches.some(u => u.id === w.id));

        // Check if we have any unused watches left
        if (availableWatches.length === 0) {
            // No more watches available in this game mode - tournament ends
            console.log('No unused watches remaining in this game mode');
            return null;
        }

        // Get new challenger from available watches
        const challengerIndex = Math.floor(Math.random() * availableWatches.length);
        const challenger = availableWatches[challengerIndex];

        // Mark the new challenger as used
        usedWatches.push(challenger);

        // Place champion and challenger based on championPosition
        if (championPosition === 'left') {
            left = currentChampion;
            right = challenger;
        } else {
            left = challenger;
            right = currentChampion;
        }
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
    const loser = position === 'left' ? currentPair.right : currentPair.left;

    // Record this round in history
    roundHistory.push({
        round: currentRound,
        winner: winner,
        loser: loser
    });

    // Debug logging
    console.log(`Selected ${position} watch: ${winner.name}`);
    console.log(`This watch will stay on the ${position.toUpperCase()} in the next round`);

    // Add visual feedback
    const selectedCard = position === 'left' ? cardLeft : cardRight;
    selectedCard.classList.add('winner-selected');

    // Set as the current champion and track their position
    currentChampion = winner;
    championPosition = position;

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

    // Display round history
    displayRoundHistory();

    // Hide battle screen and progress, show winner screen
    battleScreen.classList.add('hidden');
    progressContainer.style.display = 'none';
    winnerScreen.classList.remove('hidden');

    // Update progress bar to 100%
    progressFill.style.width = '100%';
}

// Display the round-by-round history
function displayRoundHistory() {
    const historyContainer = document.getElementById('round-history');

    if (!historyContainer) {
        console.warn('Round history container not found');
        return;
    }

    // Clear existing content
    historyContainer.innerHTML = '';

    // Create history list
    roundHistory.forEach(record => {
        const roundItem = document.createElement('div');
        roundItem.className = 'round-history-item';

        roundItem.innerHTML = `
            <div class="round-number">Round ${record.round}</div>
            <div class="round-result">
                <div class="winner-info">
                    <span class="result-label">Winner:</span>
                    <span class="watch-name-history">${record.winner.name}</span>
                </div>
                <div class="loser-info">
                    <span class="result-label">Loser:</span>
                    <span class="watch-name-history">${record.loser.name}</span>
                </div>
            </div>
        `;

        historyContainer.appendChild(roundItem);
    });
}

// Restart the game
function restartGame() {
    // Reset game state
    currentRound = 1;
    currentChampion = null;
    championPosition = null;
    usedWatches = [];
    gameMode = null;
    gameWatches = [];
    roundHistory = [];
    totalRounds = 10; // Reset to default

    // Reset round selector to default
    const roundInput = document.getElementById('round-count');
    if (roundInput) {
        roundInput.value = 10;
    }

    // Hide winner screen and progress, show mode selection screen
    winnerScreen.classList.add('hidden');
    battleScreen.classList.add('hidden');
    progressContainer.style.display = 'none';
    modeScreen.classList.remove('hidden');
}

// Share functions
function getShareMessage() {
    const winner = currentChampion;
    const gameUrl = window.location.href.split('?')[0]; // Remove any query params

    return {
        text: `I just found my perfect watch: ${winner.name}! 🎯⌚\n\nPlay Watch Battle and discover your dream timepiece!`,
        url: gameUrl,
        hashtags: 'WatchBattle,Watches,LuxuryWatches'
    };
}

function shareOnTwitter() {
    const share = getShareMessage();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(share.text)}&url=${encodeURIComponent(share.url)}&hashtags=${share.hashtags}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareOnFacebook() {
    const share = getShareMessage();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share.url)}&quote=${encodeURIComponent(share.text)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp() {
    const share = getShareMessage();
    const whatsappText = `${share.text}\n\n${share.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');
}

function copyLink() {
    const share = getShareMessage();
    const fullText = `${share.text}\n\n${share.url}`;

    navigator.clipboard.writeText(fullText).then(() => {
        // Show feedback
        const feedback = document.getElementById('copy-feedback');
        feedback.textContent = 'Copied to clipboard!';
        feedback.style.display = 'block';

        // Hide feedback after 3 seconds
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        const feedback = document.getElementById('copy-feedback');
        feedback.textContent = 'Failed to copy. Please try again.';
        feedback.style.display = 'block';

        setTimeout(() => {
            feedback.style.display = 'none';
        }, 3000);
    });
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', init);
