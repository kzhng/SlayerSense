console.log('SlayerSense main.js loaded');

async function fetchGePrices() {
    try {
        const res = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest');
        if (!res.ok) throw new Error('Failed to fetch GE prices');
        const json = await res.json();
        return json.data; // object keyed by item ID
    } catch (error) {
        console.error('Error fetching GE prices:', error);
        return null;
    } 
}

function expectedGpPerKill(drops, prices) {
    let total = 0;
    drops.forEach(drop => {
        const priceObj = prices[drop.itemId];
        const price = priceObj ? priceObj.high : 0;
        const probability = drop.oneIn ? 1 / drop.oneIn : 1;
        const qty = ((drop.qtyMin ?? 1) + (drop.qtyMax ?? drop.qtyMin ?? 1)) / 2;
        total += price * probability * qty;
  });
  return total;
}

function renderDropTable(monsterData, prices) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2>${monsterData.monster}</h2>
        <table border="1" cellpadding="5" cellspacing="0">
        <thead>
            <tr>
            <th>Item</th>
            <th>Rarity (1 in)</th>
            <th>Price (GP)</th>
            </tr>
        </thead>
        <tbody>
            ${monsterData.drops.map(drop => {
            const price = prices[drop.itemId] ? prices[drop.itemId]?.high : 0;
            return `<tr>
                <td>${drop.itemName}</td>
                <td>${drop.oneIn ?? 'N/A'}</td>
                <td>${price.toLocaleString()}</td>
            </tr>`;
            }).join('')}
        </tbody>
        </table>
    `;

  const gpPerKill = expectedGpPerKill(monsterData.drops, prices);
  const summary = document.createElement('p');
  summary.textContent = `Expected GP per kill: ${gpPerKill.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
  app.appendChild(summary);
}

function renderMonsterSelector() {
    const monsters = ['abyssal_demon','blue_dragon', 'gargoyle'];
    const monsterSelector = document.getElementById('monsterSelector');
    monsterSelector.innerHTML = ''; // Clear previous options
    monsters.forEach(monster => {
        const newMonster = document.createElement('option');
        newMonster.value = monster;
        newMonster.textContent = formatMonsterName(monster);
        monsterSelector.appendChild(newMonster);
    })
}

function formatMonsterName(monsterName) {
    const sentence = monsterName.replaceAll('_', ' '); // Replace all '_' with ' '
    return sentence
        .split(' ') // Split the sentence into an array of words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
        .join(' '); // Join the words back into a sentence
    }

function monsterSelectorListener(prices) {
    const monsterSelector = document.getElementById('monsterSelector');
    
    monsterSelector.addEventListener('change', async function() {
        const selectedMonster = monsterSelector.value;
        await fetchMonsterData(selectedMonster, prices);
    })
}

async function fetchMonsterData(monsterName, prices) {
    try {
    const res = await fetch('data/' + monsterName + '.json');
    if (!res.ok) throw new Error('Failed to fetch monster data');

    const monsterData = await res.json();
    renderDropTable(monsterData, prices);
    return monsterData;

    } catch (error) {
        console.error('Error loading monster data:', error);
        return null;
    }
}

(async () => {
    const prices = await fetchGePrices();
    if (!prices) {
        document.getElementById('app').textContent = 'Failed to load GE prices.';
        return;
    }

    renderMonsterSelector();
    monsterSelectorListener(prices);

    const monsterSelector = document.getElementById('monsterSelector');
    await fetchMonsterData(monsterSelector.value, prices);

})();