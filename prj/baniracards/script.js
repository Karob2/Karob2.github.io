/*
python -m http.server --bind 127.0.0.1
http://127.0.0.1:8000/index.html
*/

// TODO: Add rules.

// TODO: Ensure that there are at least a few of each element and type. (Moot if players create their own decks.)
// TODO: Maybe return to overflow notation. (Probably not.)
// TODO: Game over when score reaches 0 or there are no possible moves?

var cardDB;
var deckSize = 50;
var handSize = 7;
var shinyCount = 3;
var guiState, gameState;
var finalCard;
var statBalance = {
    points: 3.847,
    draw: 1.493,
    stamina: 2.615
};
var bonusCard = {
    "id": "bonus",
    "atk": "0", //-1
    "atype": "",
    "batch": "",
    "category": "",
    "ctr": "0",
    "def": "1", //1
    "name": "",
    "rarity": "",
    "skill": "",
    "type": ""
};

var fieldSlots = document.getElementsByClassName('field');
var handSlots = document.getElementsByClassName('hand');
var fieldCost = document.getElementsByClassName('field-cost');
var handCost = document.getElementsByClassName('hand-cost');
var discardSlot;
var deckSlot;
var dragSlot;

var elements = ['aquamarine', 'amethyst', 'ruby', 'topaz', 'emerald', 'sapphire', 'diamond'];
var types = ['sun', 'moon', 'star'];
var rarities = ['shiny', 'bronze', 'silver', 'gold', 'rainbow'];
var regularRarities = ['bronze', 'silver', 'gold', 'rainbow'];
var stats = ['points', 'draw', 'stamina'];

var slots = ['aquamarine', 'amethyst', 'ruby', 'topaz', 'emerald', 'sapphire', 'diamond', 'sun', 'moon', 'free']; //'special'
const getImageUrl = str => {
    if (str === 'bonus') return 'url(dango.png)';
    else return `url('https://isml.moe/c/img/${str}.png')`;
};
// const getImageUrl = str => 'url(blank.png)';
// var rarityCombos = {
//     bronze: { cost: 6, match: ['shiny'] },
//     silver: { cost: 4, match: ['bronze', 'shiny'] },
//     gold: { cost: 2, match: ['bronze', 'silver', 'shiny'] },
//     rainbow: { cost: 0, match: ['bronze', 'silver', 'gold', 'shiny'] },
//     shiny: { cost: 8, match: ['bronze', 'silver', 'gold', 'rainbow', 'shiny'] }
// };

var rarityCombos = {
    bronze: { cost: 1, match: ['shiny', 'silver', 'gold', 'rainbow'] },
    silver: { cost: 3, match: ['gold', 'rainbow', 'shiny'] },
    gold: { cost: 5, match: ['rainbow', 'shiny'] },
    rainbow: { cost: 7, match: ['shiny'] },
    shiny: { cost: 9, match: ['bronze', 'silver', 'gold', 'rainbow', 'shiny'] }
};

var recyclePreference = {
    bronze: [ 'rainbow', 'gold', 'silver' ],
    silver: [ 'gold', 'rainbow', 'silver' ],
    gold: [ 'silver', 'bronze', 'gold' ],
    rainbow: [ 'bronze', 'silver', 'gold' ]
};

async function onPageLoad() {
    guiState = {
        mode: 'waiting',
        highlightSet: null,
        highlightIndex: null,
        handCard: null,
        handIndex: null,
        slotIndex: null,
        dragOffsetX: 0,
        dragOffsetY: 0
    }

    gameState = {
        points: 5,
        stamina: 5,
        turns: 0,
        score: 50, // - 6,
        turnCost: 0,
        unlockCost: 1,
        hasWon: false,

        deck: [],
        hand: [],
        slot: [],
        slotLocked: [],
        slotCost: []
    }
    for (let i = 0; i < slots.length; i++) {
        gameState.slot.push(null);
        gameState.slotLocked.push(true);
        gameState.slotCost.push(1);
    }

    await fetch('cards.json')
        .then(response => response.json())
        .then(json => {
            cardDB = json;
        });
    discardSlot = document.getElementById('slot-discard');
    deckSlot = document.getElementById('slot-deck');
    dragSlot = document.getElementById('slot-drag');

    const boardWidth = 156;
    const boardHeight = 100;
    const slotWidth = 20;
    const slotHeight = 28;
    const boardPadding = 3;
    const slotSpacing = (boardWidth - boardPadding * 2 - slotWidth * 7) / 6;
    for (let i = 0; i < 7; i++) {
        fieldSlots[i].style.left = `${boardPadding + (slotWidth + slotSpacing) * i}vh`;
        fieldSlots[i].style.top = `${boardPadding}vh`;
        fieldCost[i].style.left = fieldSlots[i].style.left;
        fieldCost[i].style.top = fieldSlots[i].style.top;
        if (i < slots.length - 7) {
            fieldSlots[i + 7].style.left = fieldSlots[i].style.left;
            fieldSlots[i + 7].style.top = `${boardPadding + slotHeight + slotSpacing}vh`;
            fieldCost[i + 7].style.left = fieldSlots[i + 7].style.left;
            fieldCost[i + 7].style.top = fieldSlots[i + 7].style.top;
        }
        if (i == 5) {
            discardSlot.style.left = fieldSlots[i].style.left;
            discardSlot.style.top = `${boardPadding + slotHeight + slotSpacing}vh`;
        }
        if (i == 6) {
            deckSlot.style.left = fieldSlots[i].style.left;
            deckSlot.style.top = `${boardPadding + slotHeight + slotSpacing}vh`;
        }
        if (i < handSize) {
            handSlots[i].style.left = fieldSlots[i].style.left;
            // handSlots[i].style.left = `${boardPadding + (slotWidth) * i}vh`;
            handSlots[i].style.top = `${boardHeight - slotHeight - boardPadding}vh`;
            handCost[i].style.left = handSlots[i].style.left;
            handCost[i].style.top = handSlots[i].style.top;
        }
    }

    const dbSize = cardDB.length;
    const deckIndices = [];
    // const negativeTest = [ 'EV26', 'VN3', 'EV30', 'FM63' ];

    /*
    for (let i = 0; i < deckSize; i++) {
        let newCard = null;
        while (newCard == null || deckIndices.includes(newCard) || cardDB[newCard].rarity === 'Metal') newCard = arrayRandomIndex(cardDB);
        // if (Math.random() < 0.5) {
        //     newCardId = arrayRandom(negativeTest);
        //     newCard = cardDB.findIndex(c => c.id === newCardId);
        // }
        deckIndices.push(newCard);
        const newCardObject = cardDB[newCard];

        // Try to correct invalid stats for a smoother testing experience haha.
        if (isNaN(parseInt(newCardObject.atk))) newCardObject.atk = 3;
        if (isNaN(parseInt(newCardObject.ctr))) newCardObject.ctr = 3;
        if (isNaN(parseInt(newCardObject.def))) newCardObject.def = 3;
        if (!slots.includes(newCardObject.type.toLowerCase()) && !newCardObject.type.includes(',')) newCardObject.type = 'Diamond, Amethyst';
        if (!slots.includes(newCardObject.atype.toLowerCase())) newCardObject.atype = 'Star';

        gameState.deck.push(newCardObject);
    }
    */
    cardDB.forEach(card => {
        if (isNaN(parseInt(card.atk))) card.atk = 3;
        if (isNaN(parseInt(card.ctr))) card.ctr = 3;
        if (isNaN(parseInt(card.def))) card.def = 3;
        if (!slots.includes(card.type.toLowerCase()) && !card.type.includes(',')) card.type = 'Diamond, Amethyst';
        if (!slots.includes(card.atype.toLowerCase())) card.atype = 'Star';
    });
    gameState.deck = arraySortRandom(makeBalancedDeck(cardDB.filter(c => c.rarity !== 'Metal')));
    console.log('Deck balance check:');
    console.log(countValues(gameState.deck));
    const bonusSpacing = 5;
    const bonusCount = Math.floor(gameState.deck.length / (bonusSpacing - 1));
    for (let i = 0; i < bonusCount; i++) {
        gameState.deck.splice((i + 1) * bonusSpacing - 1, 0, bonusCard);
    }

    for (let i = 0; i < 4; i++) {
        cardDrawMethod();
        // handSlots[i].style.backgroundImage = getImageUrl(gameState.hand[i].id);
    }

    for (let i = 0; i < slots.length; i++) {
        fieldSlots[i].addEventListener('mouseover', event => hoverDeck(event.target, 'field', i));
        fieldSlots[i].addEventListener('mouseout', event => unHover());
        fieldSlots[i].addEventListener('mousedown', event => clickDeck(event, 'field', i));
        fieldSlots[i].addEventListener('mouseup', event => releaseClick(event, 'field', i));
    }

    discardSlot.addEventListener('mouseover', event => hoverDeck(event.target, 'discard', 0));
    discardSlot.addEventListener('mouseout', event => unHover());
    discardSlot.addEventListener('mousedown', event => clickDeck(event, 'discard', 0));
    discardSlot.addEventListener('mouseup', event => releaseClick(event, 'discard', 0));

    deckSlot.addEventListener('click', event => drawCard(event));
    deckSlot.addEventListener('mouseover', event => hoverDeck(event.target, 'draw', 0));
    deckSlot.addEventListener('mouseout', event => unHover());
    // deckSlot.addEventListener('mousedown', event => clickDeck(event, 'draw', 0));
    deckSlot.addEventListener('mouseup', event => releaseClick(event, 'draw', 0));

    for (let i = 0; i < handSize; i++) {
        handSlots[i].addEventListener('mouseover', event => hoverDeck(event.target, 'hand', i));
        handSlots[i].addEventListener('mouseout', event => unHover());
        handSlots[i].addEventListener('mousedown', event => clickDeck(event, 'hand', i));
        handSlots[i].addEventListener('mouseup', event => releaseClick(event, 'hand', i));
    }

    // Boost
    document.getElementById('end-turn').addEventListener('click', event => endTurn(event));
    document.getElementById('end-turn').addEventListener('mouseover', event => hoverDeck(event.target, 'boost', 0));
    document.getElementById('end-turn').addEventListener('mouseout', event => unHover());

    // Rules
    document.getElementById('show-rules').addEventListener('click', event => showRules(event));

    // Body actions
    document.body.addEventListener('mouseup', event => releaseClick(event));
    document.body.addEventListener('mousemove', event => moveDrag(event));

    updateBoard();
}

function updateBoard() {
    let scoreUpdated = false;

    // Update field
    for (let i = 0; i < slots.length; i++) {
        let disable = false;
        let highlight = false;
        let emphasize = false;
        let wrongType = false;
        if (guiState.mode === 'waiting') {
            if (guiState.highlightSet === 'field' && guiState.highlightIndex === i) {
                // if (gameState.slotLocked[i]) {
                //     highlight = true;
                //     const moveResult = tryMove(i, -1);
                //     updateScoreboard(moveResult);
                //     scoreUpdated = true;
                // } else {
                //     disable = true;
                // }
                disable = true;
            }
            if (guiState.highlightSet === 'hand' && guiState.highlightIndex < gameState.hand.length) {
                const moveResult = tryMove(i, guiState.highlightIndex);
                if (!moveResult.success) disable = true;
                if (moveResult.wrongType) wrongType = true;
            }
        } else if (guiState.mode === 'hand-move') {
            const moveResult = tryMove(i, guiState.handIndex);
            if (!moveResult.success) disable = true;
            if (!disable && guiState.highlightSet === 'field' && guiState.highlightIndex === i) {
                highlight = true;
                updateScoreboard(moveResult);
                scoreUpdated = true;
            }
            if (tryMove(i, guiState.handIndex).wrongType) wrongType = true;
        } else if (guiState.mode === 'slot-unlock') {
            if (guiState.slotIndex === i && guiState.highlightSet === 'field' && guiState.highlightIndex === i) {
                highlight = true;
                emphasize = true;
                const moveResult = tryMove(i, -1);
                updateScoreboard(moveResult);
                scoreUpdated = true;
            }
        }

        const slotObject = fieldSlots[i];
        setClass(slotObject, 'disabled', disable);
        setClass(slotObject, 'highlight', highlight);
        if (gameState.slotLocked[i]) {
            addClass(slotObject, 'locked');
            setClass(slotObject, 'unlocking', highlight);
            setClass(slotObject, 'unlocking2', emphasize);

            // const spanClass = gameState.points >= gameState.unlockCost ? '' : 'decrement';
            // slotObject.innerHTML = `${toTitleCase(slots[i])}<br/><br/><span class="${spanClass}">-${gameState.unlockCost}</span>✨`; //🔒🔓☆
            slotObject.style.backgroundImage = '';
        } else {
            removeClass(slotObject, 'locked');
            removeClass(slotObject, 'unlocking');
            removeClass(slotObject, 'unlocking2');

            // const spanClass = gameState.stamina >= getSlotCost(i) ? '' : 'decrement';
            // slotObject.innerHTML = `${toTitleCase(slots[i])}<br/><br/><span class="${spanClass}">-${getSlotCost(i)}</span>🟦`; //▢
            if (gameState.slot[i] == null) slotObject.style.backgroundImage = '';
            else slotObject.style.backgroundImage = getImageUrl(gameState.slot[i].id);
        }

        let cost = [];
        let costSeeker = null;
        if (guiState.mode === 'waiting' && guiState.highlightSet === 'hand') costSeeker = gameState.hand[guiState.highlightIndex];
        if (guiState.mode === 'hand-move') costSeeker = gameState.hand[guiState.handIndex];
        if (gameState.slotLocked[i]) {
            if (gameState.points >= gameState.unlockCost) cost.push(`−${gameState.unlockCost}✨`);
            else cost.push(`❌−${gameState.unlockCost}✨`);
        }
        // if (!gameState.slotLocked[i] || costSeeker != null) {
        if (getSlotCost(i) !== 0) {
            if (gameState.stamina >= getSlotCost(i)) cost.push(`−${getSlotCost(i)}🟦`);
            else cost.push(`❌−${getSlotCost(i)}🟦`);
        }
        if (costSeeker != null && gameState.slot[i] != null
            && !rarityCombos[gameState.slot[i].rarity.toLowerCase()].match.includes(costSeeker.rarity.toLowerCase())) {
            cost.push(`❌Rarity`);
        }
        let showCost = false;
        if (guiState.mode === 'waiting' && guiState.highlightSet === 'field' && guiState.highlightIndex === i) showCost = true;
        if (guiState.mode === 'waiting' && guiState.highlightSet === 'hand' && !wrongType) showCost = true;
        if (guiState.mode === 'hand-move' && !wrongType) showCost = true;
        if (guiState.mode === 'slot-unlock' && guiState.slotIndex === i) showCost = true;
        if (showCost) fieldCost[i].innerHTML = cost.join('<br/>');
        else fieldCost[i].innerHTML = '';
    }

    // Update hand
    for (let i = 0; i < handSize; i++) {
        if (i < gameState.hand.length) {
            handSlots[i].style.backgroundImage = getImageUrl(gameState.hand[i].id);
            removeClass(handSlots[i], 'disabled');
            if (guiState.mode === 'waiting') {
                setClass(handSlots[i], 'highlight', guiState.highlightSet === 'hand' && guiState.highlightIndex === i);
            }
        } else {
            handSlots[i].style.backgroundImage = null;
            addClass(handSlots[i], 'disabled');
            removeClass(handSlots[i], 'highlight');
        }

        let cost = [];
        let costSeeker = null;
        if (guiState.mode === 'waiting' && guiState.highlightSet === 'hand' && guiState.highlightIndex === i) costSeeker = gameState.hand[guiState.highlightIndex];
        if (costSeeker != null) {
            const points = getPoints(costSeeker);
            const stamina = getStamina(costSeeker);
            const draw = getDraw(costSeeker);
            if (points !== 0) cost.push(`${styleSign(points)}✨`);
            if (stamina !== 0) cost.push(`${styleSign(stamina)}🟦`);
            if (draw !== 0) cost.push(`${styleSign(draw)} Card`);
            handCost[i].innerHTML = cost.join('<br/>');
        }
        else handCost[i].innerHTML = '';
    }


    // Update boost
    if (guiState.mode === 'waiting' && guiState.highlightSet === 'boost') {
        const moveResult = tryBoost();
        updateScoreboard(moveResult);
        scoreUpdated = true;
    }

    // Update discard
    if (guiState.mode === 'hand-move' && guiState.highlightSet === 'discard') {
        addClass(discardSlot, 'highlight');
        const moveResult = tryDiscard(guiState.handIndex);
        updateScoreboard(moveResult);
        scoreUpdated = true;
    } else {
        removeClass(discardSlot, 'highlight');
    }

    // Update deck/draw
    deckSlot.innerHTML = `<br/>Deck<br/><br/><br/><br/><br/>${gameState.deck.length}`;
    if (gameState.deck.length <= 0) {
        addClass(deckSlot, 'disabled');
    } else {
        removeClass(deckSlot, 'disabled');
    }
    if (guiState.mode === 'waiting' && guiState.highlightSet === 'draw') {
        const moveResult = tryDraw();
        updateScoreboard(moveResult);
        scoreUpdated = true;
        setClass(deckSlot, 'highlight', moveResult.success);
    } else if (guiState.mode === 'hand-move' && guiState.highlightSet === 'draw') {
        const moveResult = tryRecycle(guiState.handIndex);
        setClass(deckSlot, 'highlight', moveResult.success);
        updateScoreboard(moveResult);
        scoreUpdated = true;
    } else {
        removeClass(deckSlot, 'highlight');
    }

    // Update scoreboard
    if (!scoreUpdated) updateScoreboard();

    if (!gameState.hasWon && gameState.slot.findIndex(s => s == null) < 0) {
        gameState.hasWon = true;
        gameState.score += 50;
    }
    // if (guiState.mode !== 'finished' && gameState.slot.findIndex(s => s == null) < 0)
    // {
    //     window.alert(`Congrats! You won, with a score of ${gameState.score} + ${gameState.points} = ${gameState.score + gameState.points}.\nFinal card played: [${finalCard.name} - ${finalCard.id}]`);
    //     guiState.mode = 'finished'
    // }
    // else if (gameState.score <= 0) window.alert('Game Over - Your score reached zero.');
}

function updateScoreboard(moveResult = null) {
    let pointsText = `✨Power: ${gameState.points}`; //☆⭐
    let staminaText = `🟦Stamina: ${gameState.stamina}`; //▢
    let drawText = `${gameState.hand.length}`;
    let scoreText = `🍡Score: ${gameState.score}`;
    if (moveResult != null) {
        if (moveResult.final.points < 0) pointsText += `→❌`; //⛔🚫
        else {
            if (moveResult.final.points > gameState.points) pointsText += `→<span class="increment">${moveResult.final.points.toString()}</span>`;
            if (moveResult.final.points < gameState.points) pointsText += `→<span class="decrementOff">${moveResult.final.points.toString()}</span>`;
        }
        if (moveResult.final.stamina < 0) staminaText += `→❌`;
        else {
            if (moveResult.final.stamina > gameState.stamina) staminaText += `→<span class="increment">${moveResult.final.stamina.toString()}</span>`;
            if (moveResult.final.stamina < gameState.stamina) staminaText += `→<span class="decrementOff">${moveResult.final.stamina.toString()}</span>`;
        }
        // if (moveResult.final.draw < 0) drawText += `→❌`;
        {
            if (moveResult.final.draw > gameState.hand.length) drawText += `→<span class="increment">${moveResult.final.draw.toString()}</span>`;
            if (moveResult.final.draw < gameState.hand.length) drawText += `→<span class="decrementOff">${moveResult.final.draw.toString()}</span>`;
        }
        if (moveResult.final.score < 0) scoreText += `→❌`;
        else {
            if (moveResult.final.score > gameState.score) scoreText += `→<span class="increment">${moveResult.final.score.toString()}</span>`;
            if (moveResult.final.score < gameState.score) scoreText += `→<span class="decrementOff">${moveResult.final.score.toString()}</span>`;
        }
    } else {
        scoreText = `🍡Score: ${gameState.score} + ${gameState.points} = ${gameState.score + gameState.points}`;
    }
    drawText += ' Card'; //🂠
    document.getElementById('score-points').innerHTML = pointsText;
    document.getElementById('score-stamina').innerHTML = staminaText;
    document.getElementById('hand-surplus').innerHTML = drawText;
    document.getElementById('score-turn').innerHTML = scoreText;
}

function hoverDeck(element, set, n) {
    if (set === 'hand' && n >= gameState.hand.length) return;
    guiState.highlightSet = set;
    guiState.highlightIndex = n;
    updateBoard();
}

function clickDeck(event, set, n) {
    if (guiState.mode === 'waiting' && guiState.highlightSet === 'hand') {
        const card = gameState.hand[guiState.highlightIndex];
        if (card.id === 'bonus') {
            if (gameState.points >= -getPoints(card) && gameState.stamina >= -getStamina(card)) {
                gameState.hand.splice(guiState.highlightIndex, 1);
                gameState.points += getPoints(card);
                gameState.stamina += getStamina(card);
                updateBoard();
            }
            return;
        }
        guiState.handIndex = guiState.highlightIndex;
        guiState.handCard = gameState.hand[guiState.handIndex];

        guiState.dragOffsetX = event.offsetX;
        guiState.dragOffsetY = event.offsetY;

        dragSlot.style.backgroundImage = getImageUrl(guiState.handCard.id);
        removeClass(dragSlot, 'hidden');
        addClass(handSlots[guiState.handIndex], 'hidden');

        guiState.mode = 'hand-move';
        moveDrag(event);
    }
    // if (guiState.mode === 'waiting' && guiState.highlightSet === 'field' && gameState.slotLocked[n]) {
    //     guiState.slotIndex = n;
    //     guiState.mode = 'slot-unlock';
    // }
    updateBoard();
}

function unHover(clearScoreboard = true) {
    guiState.highlightSet = null;
    updateBoard();
}

function releaseClick(event, set, n) {
    if (guiState.mode === 'waiting') return;
    if (guiState.mode === 'hand-move') {
        if (set === 'field') {
            const moveResult = doMove(n, guiState.handIndex);
        }

        addClass(dragSlot, 'hidden');
        removeClass(handSlots[guiState.handIndex], 'hidden');

        if (set === 'discard') {
            doDiscard(guiState.handIndex);
        }

        if (set === 'draw') {
            doRecycle(guiState.handIndex);
        }

        guiState.mode = 'waiting';
    }
    if (guiState.mode === 'slot-unlock') {
        if (set === 'field') {
            if (guiState.slotIndex === n) doMove(n, -1);
        }
        guiState.mode = 'waiting';
    }
    if (set != null) hoverDeck(event.target, set, n);
    else updateBoard();
}

function moveDrag(event) {
    if (guiState.mode !== 'hand-move') return;
    dragSlot.style.left = `${event.clientX - guiState.dragOffsetX}px`;
    dragSlot.style.top = `${event.clientY - guiState.dragOffsetY}px`;
}

function endTurn(event) {
    if (guiState.mode !== 'waiting') return;
    doBoost();
    updateBoard();
}

function drawCard(event) {
    if (guiState.mode !== 'waiting') return;
    doDraw();
    updateBoard();
}

function showRules(event) {
    removeClass(document.getElementById('rules'), 'hidden');
}

const tryBoost = () => doBoost(true);
function doBoost(preview = false) {
    const result = {};
    result.final = {
        points: gameState.points + 2,
        stamina: gameState.stamina + 2,
        draw: gameState.hand.length,
        score: gameState.score - 10
    }
    result.success = result.final.score >= 0;
    if (preview || !result.success) return result;

    gameState.points = result.final.points;
    gameState.stamina = result.final.stamina;
    gameState.score = result.final.score;
    gameState.turns += 1;
    return result;
}

const tryDraw = () => doDraw(true);
function doDraw(preview = false) {
    const result = {};
    result.final = {
        points: gameState.points,
        stamina: gameState.stamina,
        draw: gameState.hand.length + 1,
        score: gameState.score - 2
    }
    result.success = gameState.deck.length > 0 && result.final.score >= 0;
    if (preview || !result.success) return result;

    cardDrawMethod();
    gameState.score = result.final.score;
    return result;
}

const tryDiscard = handIndex => doDiscard(handIndex, true);
function doDiscard(handIndex, preview = false) {
    const result = {};
    result.final = {
        points: gameState.points,
        stamina: gameState.stamina + 1,
        draw: gameState.hand.length - 1,
        score: gameState.score // - 1
    }
    result.success = result.final.score >= 0;
    if (preview || !result.success) return result;
    gameState.hand.splice(handIndex, 1);
    gameState.points = result.final.points;
    gameState.stamina = result.final.stamina;
    gameState.score = result.final.score;
    return result;
}

const tryRecycle = handIndex => doRecycle(handIndex, true);
function doRecycle(handIndex, preview = false) {
    const result = {};
    result.final = {
        points: gameState.points - 1,
        stamina: gameState.stamina - 0,
        draw: gameState.hand.length, // - 1,
        score: gameState.score
    }
    result.success = result.final.score >= 0 && gameState.deck.length > 0 && gameState.hand[handIndex].rarity !== 'Shiny';
    result.success = result.success && result.final.points >= 0 && result.final.stamina >= 0;
    if (preview || !result.success) return result;

    const preferences = recyclePreference[getRarity(gameState.hand[handIndex])];
    let matches;
    //for (let q = 0; q < preference.length; q++) {
    for (const rarityTarget of preferences) {
        matchesTest = gameState.deck.filter(c => getRarity(c) === rarityTarget);
        if (matchesTest.length > 0) {
            matches = matchesTest;
            break;
        }
    }
    if (matches == null) matches = gameState.deck;
    const newCard = arrayRandom(matches);
    const newCardIndex = gameState.deck.findIndex(c => c.id === newCard.id);
    gameState.deck.splice(newCardIndex, 1);
    gameState.deck.push(gameState.hand[handIndex]);
    // gameState.hand.splice(handIndex, 1);
    gameState.hand[handIndex] = newCard;
    gameState.points = result.final.points;
    gameState.stamina = result.final.stamina;
    gameState.score = result.final.score;
    return result;
}

const tryMove = (slotIndex, handIndex) => doMove(slotIndex, handIndex, true);
function doMove(slotIndex, handIndex, preview = false) {
    const result = { success: true, wrongType: false };
    let card;
    let cardValid = false;
    let scoreShift = 0;
    if (handIndex >= 0) card = gameState.hand[handIndex];

    result.cost = { points: 0, stamina: 0, draw: 0 };
    result.reward = { points: 0, stamina: 0, draw: 0 };

    if (gameState.slotLocked[slotIndex]) {
        result.cost.points += gameState.unlockCost;
    }
    if (handIndex >= 0) {
        cardValid = true;
        result.cost.stamina += getSlotCost(slotIndex);
        result.cost.draw += 1;
        result.reward.points += getPoints(card);
        result.reward.stamina += getStamina(card);
        result.reward.draw += getDraw(card);
        if (card.rarity === 'Shiny') scoreShift += 0;
        else scoreShift += 8;
    }
    if (!gameState.slotLocked[slotIndex] && !cardValid) {
        result.success = false;
        // return result;
    }
    if (gameState.slotLocked[slotIndex] && !cardValid) {
        result.success = false;
        // return result;
    }
    result.final = {
        points: gameState.points + result.reward.points - result.cost.points,
        stamina: gameState.stamina + result.reward.stamina - result.cost.stamina,
        draw: gameState.hand.length + result.reward.draw - result.cost.draw,
        score: gameState.score + scoreShift
    }

    if (result.cost.points > gameState.points) result.success = false;
    if (result.cost.stamina > gameState.stamina) result.success = false;
    // if (result.final.draw < 0) result.success = false;
    if (card != null) {
        const elList = getElements(card);
        const type = getType(card);
        const slotCard = gameState.slot[slotIndex];

        // Block from playing onto mismatched slot.
        if (!elList.includes(slots[slotIndex]) && type !== slots[slotIndex] && slots[slotIndex] !== 'free') {
            result.success = false;
            result.wrongType = true;
        }

        // Block from playing wrong rarity order.
        if (slotCard != null && !rarityCombos[getRarity(slotCard)].match.includes(getRarity(card))) result.success = false;

        // Block from playing shiny or multiple element onto free slot.
        if (slots[slotIndex] === 'free' && (elList.length > 1 || card.rarity === 'Shiny')) {
            result.success = false;
            result.wrongType = true;
        }
    }

    // if (gameState.slot[slotIndex] != null) result.success = false; // This blocked simultaneous unlock and play.

    if (result.final.score < 0) result.success = false;

    if (preview || !result.success) return result;

    // --------------------------
    // Now update the game state.
    if (gameState.slotLocked[slotIndex]) {
        gameState.slotLocked[slotIndex] = false;
        gameState.unlockCost += 2;
        // gameState.score += result.cost.points;
    }
    if (cardValid) {
        if (gameState.slot[slotIndex] == null) gameState.turnCost += 1;
        else gameState.slotCost[slotIndex] += 2;

        gameState.slot[slotIndex] = card;
        finalCard = card;
        // for (let i = 0; i < slots.length; i++) {
        //     if (gameState.slot[i] != null) gameState.slotCost[i] = -gameState.turnCost + 5;
        // }

        // gameState.turnCost += 1;
        // for (let i = 0; i < slots.length; i++) {
        //     if (i !== slotIndex && gameState.slot[i] != null) gameState.slotCost[i] -= 1;
        // }

        gameState.hand.splice(handIndex, 1);
        // gameState.turns += 1;
        // gameState.score -= 1;
    }
    gameState.score = result.final.score;
    gameState.points = result.final.points;
    gameState.stamina = result.final.stamina;

    if (result.final.draw < gameState.hand.length) {
        while (result.final.draw < gameState.hand.length) {
            if (gameState.hand.length > 0) {
                gameState.deck.push(gameState.hand.pop());
                continue;
            }
            if (gameState.deck.length > 0) {
                gameState.deck.pop();
                result.final.draw += 1;
                continue;
            }
            break;
        }
    } else {
        for (let i = 0; i < result.reward.draw; i++) {
            if (gameState.deck.length === 0) break;
            cardDrawMethod();
        }
    }

    return result;
}
const getPoints = card => parseInt(card.atk);
const getDraw = card => parseInt(card.ctr);
const getStamina = card => parseInt(card.def);
const getStats = card => ({ points: getPoints(card), draw: getDraw(card), stamina: getStamina(card) });
const getElements = card => card.type.split(',').map(s => s.trim().toLowerCase());
const getType = card => card.atype.toLowerCase();
const getRarity = card => card.rarity.toLowerCase();

function getSlotCost(index) {
    const card = gameState.slot[index];
    if (card == null) return gameState.turnCost;
    // const rarity = card.rarity.toLowerCase();
    // return rarityCombos[rarity].cost;
    return gameState.slotCost[index];
}

// function getScore(scoreset) {
//     if (scoreset == null) return gameState.score + gameState.stamina + gameState.points + gameState.hand.length;
//     return scoreset.score + scoreset.stamina + scoreset.points + scoreset.draw;
// }

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(function (word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

const arrayRandom = array => array[Math.floor(Math.random() * array.length)];
const arrayRandomIndex = array => Math.floor(Math.random() * array.length);
const arrayRandomPop = array => {
    const index = Math.floor(Math.random() * array.length);
    const result = array[index];
    array.splice(index, 1);
    return result;
};
const arrayIndexPop = (array, index) => {
    const result = array[index];
    array.splice(index, 1);
    return result;
};
function arraySortRandom(array) {
    const randomizer = [];
    for (let i = 0; i < array.length; i++) {
        randomizer.push({ index: i, sortKey: Math.random() });
    }
    randomizer.sort((a, b) => a.sortKey - b.sortKey);
    return randomizer.map(r => array[r.index]);
}

const styleSign = num => num >= 0 ? `+${num}` : `−${-num}`;

const setClass = (obj, className, enabled) => { enabled ? obj.classList.add(className) : obj.classList.remove(className); };
const addClass = (obj, className) => { obj.classList.add(className); };
const removeClass = (obj, className) => { obj.classList.remove(className); };

function zeroTable(names) {
    const table = {};
    names.forEach(n => table[n] = 0);
    return table;
}

function countValues(deck) {
    const elementCount = zeroTable(elements);
    const typeCount = zeroTable(types);
    const rarityCount = zeroTable(rarities);
    const statCount = zeroTable(stats);

    // Count how much of everything is in the deck so far.
    deck.forEach(card => {
        getElements(card).forEach(element => { elementCount[element] += 1; });
        typeCount[getType(card)] += 1;
        rarityCount[getRarity(card)] += 1;
        statCount.points += getPoints(card);
        statCount.draw += getDraw(card);
        statCount.stamina += getStamina(card);
    });

    return { elements: elementCount, types: typeCount, rarities: rarityCount, stats: statCount };
}

function makeBalancedDeck(cardPool) {
    const getLowestValues = (names, valueTable) => {
        const valueArray = names.map(n => valueTable[n]);
        const lowestValue = Math.min(...valueArray);
        const highestValue = Math.max(...valueArray);
        const lowestNames = [];
        names.forEach(n => {
            if (valueTable[n] === lowestValue) lowestNames.push(n);
        });
        return { names: lowestNames, gap: highestValue - lowestValue };
    };

    const getLowest = () => {
        const totals = countValues(deck);
        totals.stats.points -= statBalance.points * deck.length;
        totals.stats.draw -= statBalance.draw * deck.length;
        totals.stats.stamina -= statBalance.stamina * deck.length;

        // let lowestStat = '';
        // let statTotal = totals.stats.points + totals.stats.draw + totals.stats.stamina;
        // if (totals.stats.points / statTotal < 0.25) lowestStat = 'points';
        // if (totals.stats.draw / statTotal < 0.25) lowestStat = 'draw';
        // if (totals.stats.stamina / statTotal < 0.25) lowestStat = 'stamina';

        return {
            elements: getLowestValues(elements, totals.elements),
            types: getLowestValues(types, totals.types),
            rarities: getLowestValues(regularRarities, totals.rarities),
            stats: getLowestValues(stats, totals.stats)
            // stat: lowestStat
        };
    };

    const elementMatch = (wantedList, haveList) => {
        for (const wantedElement of wantedList) {
            if (haveList.includes(wantedElement)) return true;
        }
        return false;
    };

    const deck = [];

    // Add shinies to deck.
    const shinyPool = arraySortRandom(cardPool.filter(card => card.rarity === 'Shiny'));
    for (let i = 0; i < shinyCount; i++) {
        deck.push(shinyPool.pop());
    }

    // Add other cards to deck, keeping the types and stats balanced.
    const randomPool = cardPool.filter(card => card.rarity !== 'Shiny').map(card => ({ card, sortKey: Math.random() }));
    for (let i = shinyCount; i < deckSize; i++) {
        // Figure out what is needed.
        const lowest = getLowest();

        // Score the card pool by need.
        randomPool.forEach(item => {
            item.score = 0;
            if (elementMatch(lowest.elements.names, getElements(item.card))) item.score += lowest.elements.gap;
            if (lowest.types.names.includes(getType(item.card))) item.score += lowest.types.gap;
            if (lowest.rarities.names.includes(getRarity(item.card))) item.score += lowest.rarities.gap;
            const cardStats = getStats(item.card);
            const statTotal = cardStats.points + cardStats.draw + cardStats.stamina;
            // if (lowest.stat === 'points' && cardStats.points / statTotal >= 0.5) item.score += 1;
            // if (lowest.stat === 'draw' && cardStats.draw / statTotal >= 0.5) item.score += 1;
            // if (lowest.stat === 'stamina' && cardStats.stamina / statTotal >= 0.5) item.score += 1;
            // if (lowest.stats.names.includes('points') && cardStats.points / statTotal > 0.5) item.score += lowest.stats.gap;
            // else if (lowest.stats.names.includes('draw') && cardStats.draw / statTotal > 0.5) item.score += lowest.stats.gap;
            // else if (lowest.stats.names.includes('stamina') && cardStats.stamina / statTotal > 0.5) item.score += lowest.stats.gap;
            if (lowest.stats.names.includes('points') && cardStats.points > statBalance.points) item.score += lowest.stats.gap;
            else if (lowest.stats.names.includes('draw') && cardStats.draw > statBalance.draw) item.score += lowest.stats.gap;
            else if (lowest.stats.names.includes('stamina') && cardStats.stamina > statBalance.stamina) item.score += lowest.stats.gap;
        });

        // Put the highest scoring card into the deck.
        randomPool.sort((a, b) => a.score === b.score ? a.sortKey - b.sortKey : a.score - b.score);
        deck.push(randomPool.pop().card);
    }

    return deck;
}

function cardDrawMethod() {
    gameState.hand.push(arrayIndexPop(gameState.deck, 0));
}
