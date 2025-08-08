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
            const price = prices[drop.itemId] ? prices[drop.itemId].high : 0;
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

(async () => {
    const prices = await fetchGePrices();
    if (!prices) {
        document.getElementById('app').textContent = 'Failed to load GE prices.';
        return;
  }

    const res = await fetch('data/abyssal_demon.json');
    if (!res.ok) {
        document.getElementById('app').textContent = 'Failed to load monster data.';
        return;
  }

  const monsterData = await res.json();

  renderDropTable(monsterData, prices);
})();