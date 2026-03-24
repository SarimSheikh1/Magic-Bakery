// Magic Bakery Game Logic

// --- Game State ---
let gems = 0;
let unlockedThemes = ['light'];
let currentTheme = 'light';
let isFreePlay = false;

// Customers Configuration
// Fairies (love sparkle cupcakes), Dragons (fire muffins), Unicorns (rainbow cookies), Yetis (snowflake cakes)
const customers = [
    { type: 'Fairy', sprite: '🧚', treat: 'Cupcake', topping: 'sparkles', toppingSprite: '✨' },
    { type: 'Dragon', sprite: '🐉', treat: 'Muffin', topping: 'fire', toppingSprite: '🔥' },
    { type: 'Unicorn', sprite: '🦄', treat: 'Cookie', topping: 'rainbow', toppingSprite: '🌈' },
    { type: 'Yeti', sprite: '⛄', treat: 'Cake', topping: 'snowflake', toppingSprite: '❄️' }
];

let currentCustomer = null;
let currentPhase = 'mixing'; // mixing -> pouring -> decorating

// --- DOM Elements ---
const screens = {
    mainMenu: document.getElementById('screen-main-menu'),
    bakery: document.getElementById('screen-bakery'),
    freePlay: document.getElementById('screen-free-play'),
    shop: document.getElementById('screen-shop')
};

const topBar = document.getElementById('top-bar');
const gemCountEl = document.getElementById('gem-count');

const stations = {
    mixing: document.getElementById('station-mixing'),
    pouring: document.getElementById('station-pouring'),
    decorating: document.getElementById('station-decorating')
};

// Character Area
const customerSprite = document.getElementById('customer-sprite');
const orderBubble = document.getElementById('order-bubble');
const orderItem = document.getElementById('order-item');

// Feedback
const feedbackOverlay = document.getElementById('feedback-overlay');
const feedbackText = document.getElementById('feedback-text');

// --- Initialization ---
function init() {
    updateGems(0);
    bindEvents();
}

function bindEvents() {
    // Nav Buttons
    document.getElementById('btn-play-quest').addEventListener('click', () => startBakeryMode());
    document.getElementById('btn-play-free').addEventListener('click', () => showScreen('freePlay'));
    document.getElementById('btn-shop').addEventListener('click', () => showScreen('shop'));
    document.getElementById('btn-back').addEventListener('click', () => {
        showScreen('mainMenu');
        resetBakery();
    });

    // Mixing Mechanics
    document.querySelector('.bowl-container').addEventListener('click', handleMixing);

    // Pouring Mechanics (Dragging pitcher)
    setupPouring();

    // Decorating Mechanics
    setupDecorating();
    
    document.getElementById('btn-serve').addEventListener('click', serveOrder);

    // Shop
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => buyItem(e.target.parentElement.dataset.id));
    });
}

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenId].classList.remove('hidden');
    
    if (screenId === 'mainMenu') {
        topBar.classList.add('hidden');
    } else {
        topBar.classList.remove('hidden');
    }

    if (screenId === 'freePlay') {
        startFreePlayMode();
    }
}

// --- Free Play Mechanics ---
function startFreePlayMode() {
    isFreePlay = true;
    const freePlayArea = document.getElementById('free-play-area');
    freePlayArea.innerHTML = `
        <div class="free-play-grid">
            <button onclick="isFreePlay = true; showScreen('bakery'); startMixingPhase();">Let's Bake!</button>
        </div>
    `;
    
    // In free play, no customer spawns!
    customerSprite.classList.add('hidden');
    orderBubble.classList.add('hidden');
}

function updateGems(amount) {
    gems += amount;
    gemCountEl.innerText = gems;
}

function showFeedback(text, duration = 1500) {
    feedbackText.innerText = text;
    feedbackOverlay.classList.remove('hidden');
    setTimeout(() => {
        feedbackOverlay.classList.add('hidden');
    }, duration);
}

// --- Menu Actions ---

function startBakeryMode() {
    isFreePlay = false;
    showScreen('bakery');
    spawnCustomer();
    startMixingPhase();
}

function spawnCustomer() {
    currentCustomer = customers[Math.floor(Math.random() * customers.length)];
    customerSprite.innerText = currentCustomer.sprite;
    customerSprite.classList.remove('hidden');
    
    orderItem.innerText = currentCustomer.treat + " + " + currentCustomer.toppingSprite;
    orderBubble.classList.remove('hidden');
}

// --- Stations Mechanics ---

// 1. Mixing Phase
let mixProgress = 0;
function startMixingPhase() {
    currentPhase = 'mixing';
    resetStations();
    stations.mixing.classList.remove('hidden');
    mixProgress = 0;
    document.getElementById('mixing-progress').style.width = '0%';
    document.getElementById('mixing-bowl').style.height = '10%';
}

function handleMixing(e) {
    if (currentPhase !== 'mixing') return;
    
    // Add simple animation
    e.target.style.animation = 'none';
    void e.target.offsetWidth; // trigger reflow
    e.target.style.animation = 'mix-wiggle 0.2s';
    
    mixProgress += 10;
    document.getElementById('mixing-progress').style.width = mixProgress + '%';
    document.getElementById('mixing-bowl').style.height = (10 + mixProgress * 0.9) + '%';
    
    if (mixProgress >= 100) {
        showFeedback('Perfect Mix!');
        setTimeout(() => startPouringPhase(), 1500);
    }
}

// 2. Pouring Phase
function startPouringPhase() {
    currentPhase = 'pouring';
    resetStations();
    stations.pouring.classList.remove('hidden');
    
    // reset pan
    document.querySelectorAll('.pan-spot').forEach(spot => {
        spot.classList.remove('filled');
        spot.dataset.filled = 'false';
    });

    // Reset pitcher position
    const pitcher = document.getElementById('batter-pitcher');
    pitcher.style.position = 'relative';
    pitcher.style.left = '0';
    pitcher.style.top = '0';
}

function setupPouring() {
    const pitcher = document.getElementById('batter-pitcher');
    let isDragging = false;

    // Make pitcher follow mouse
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const containerRect = document.getElementById('game-container').getBoundingClientRect();
            const x = e.clientX - containerRect.left - (pitcher.offsetWidth / 2);
            const y = e.clientY - containerRect.top - (pitcher.offsetHeight / 2);
            
            pitcher.style.position = 'absolute';
            pitcher.style.left = x + 'px';
            pitcher.style.top = y + 'px';
            pitcher.style.zIndex = '1000';
        }
    });

    pitcher.addEventListener('mousedown', (e) => {
        isDragging = true;
        pitcher.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => { 
        if (isDragging) {
            isDragging = false; 
            pitcher.classList.remove('pouring');
            pitcher.style.cursor = 'grab';
            // Snap back or keep? Let's snap back if not over a spot
        }
    });

    document.querySelectorAll('.pan-spot').forEach(spot => {
        spot.addEventListener('mouseenter', () => {
            if (isDragging && currentPhase === 'pouring' && spot.dataset.filled === 'false') {
                pitcher.classList.add('pouring');
                spot.classList.add('filled');
                spot.dataset.filled = 'true';
                checkPouringDone();
            }
        });
    });
}

function checkPouringDone() {
    const spots = document.querySelectorAll('.pan-spot');
    let allFilled = true;
    spots.forEach(spot => {
        if (spot.dataset.filled === 'false') allFilled = false;
    });
    if (allFilled) {
        showFeedback('Oven Time!');
        stations.pouring.classList.add('hidden');
        setTimeout(() => startDecoratingPhase(), 2000); // Simulate oven
    }
}

// 3. Decorating Phase
function startDecoratingPhase() {
    currentPhase = 'decorating';
    resetStations();
    stations.decorating.classList.remove('hidden');
    
    const treatsContainer = document.getElementById('baked-treats');
    treatsContainer.innerHTML = '';
    
    // Generate baked treats
    for(let i=0; i<4; i++) {
        const treat = document.createElement('div');
        treat.className = 'treat';
        treat.innerHTML = currentCustomer.treat === 'Cupcake' ? '🧁' : 
                          currentCustomer.treat === 'Muffin' ? '🥮' : 
                          currentCustomer.treat === 'Cookie' ? '🍪' : '🎂';
        treat.dataset.hasTopping = 'false';
        
        // Setup drop target
        treat.addEventListener('dragover', e => e.preventDefault());
        treat.addEventListener('drop', handleDrop);
        
        treatsContainer.appendChild(treat);
    }
    document.getElementById('btn-serve').classList.remove('hidden');
}

function setupDecorating() {
    const toppings = document.querySelectorAll('.topping');
    toppings.forEach(t => {
        t.addEventListener('dragstart', e => {
            e.dataTransfer.setData('type', t.dataset.type);
            e.dataTransfer.setData('sprite', t.innerText);
        });
    });
}

function handleDrop(e) {
    if (currentPhase !== 'decorating') return;
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const sprite = e.dataTransfer.getData('sprite');
    
    // Find closest treat if a child was dropped on
    let target = e.target;
    if (!target.classList.contains('treat')) {
        target = target.closest('.treat');
    }
    
    if (target && target.dataset.hasTopping === 'false') {
        const toppingEl = document.createElement('div');
        toppingEl.style.position = 'absolute';
        toppingEl.style.pointerEvents = 'none'; // Prevent interfering with future drops
        toppingEl.innerText = sprite;
        toppingEl.dataset.type = type;
        
        target.appendChild(toppingEl);
        target.dataset.hasTopping = 'true';
        target.dataset.toppingType = type;
    }
}

function serveOrder() {
    if (isFreePlay) {
        showFeedback('Delicious Creation!');
        setTimeout(() => {
            showScreen('mainMenu');
        }, 2000);
        return;
    }

    // Check if the order is correct
    let matches = 0;
    document.querySelectorAll('.treat').forEach(t => {
        if (t.dataset.toppingType === currentCustomer.topping) {
            matches++;
        }
    });

    if (matches > 0) {
        const earned = matches * 5;
        updateGems(earned);
        showFeedback(`Yay! +${earned} 💎`);
        setTimeout(() => {
            // Next customer
            startBakeryMode();
        }, 2000);
    } else {
        showFeedback('Oops! Wrong topping!');
        setTimeout(() => {
            // Retry
            startDecoratingPhase();
        }, 2000);
    }
}

function resetStations() {
    Object.values(stations).forEach(s => s.classList.add('hidden'));
    document.getElementById('btn-serve').classList.add('hidden');
}

function resetBakery() {
    customerSprite.classList.add('hidden');
    orderBubble.classList.add('hidden');
    resetStations();
}

// --- Shop Implementation ---
function buyItem(id) {
    if (id === 'theme_dark') {
        if (gems >= 50) {
            updateGems(-50);
            document.documentElement.dataset.theme = 'dark';
            showFeedback('Dark Theme Unlocked!');
        } else {
            showFeedback('Not enough gems!');
        }
    }
}

// Run
window.onload = init;
