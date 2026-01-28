const MP_ICON = " ✦";

// Holds the game model
const gameState = {
  molecules: {
    ATP: {
      amount: 0,  // amount
      cost: 1     // MP
    },
    myosin: {
      amount: 0,  // amount
      cost: 2     // MP
    },
    PFK1: {
      amount: 0,  // amount
      cost: 10     // MP
    },
    glucose: {
      amount: 0,  // amount
      cost: 5     // MP
    },
    amylase: {
      amount: 0,  // amount
      cost: 20    // MP
    },
    apple: {
      amount: 0,  // amount
      cost: 50    // MP
    }
  },
  environment: {
    temperature: 20 // °C
  },
  player: {
    energy: 0,   // Joules
    ENERGY_FOR_1_SEC_WALK: 300, // Joules
    walkLevel: 1,  // speed of the walk compared to the initial
    costPerWalkLevel: 10 // MP per walk level
  },
  points: 10,   // MP
  MP_PER_WALK_SECOND: 1.5, // MP / s-1 (walk level included)
  speed: 1      // factor
}

const updateView = () => {
  for(let key in gameState.molecules) {
    document.getElementById(`molecule-upgrade-${key}-cost`).textContent = gameState.molecules[key].cost + MP_ICON;
    if ( gameState.points < gameState.molecules[key].cost ) {
      document.getElementById(`molecule-upgrade-${key}-amount-add`).disabled = true;
    } else {
      document.getElementById(`molecule-upgrade-${key}-amount-add`).disabled = false;
    }
    if ( gameState.molecules[key].amount <= 0 ) {
      document.getElementById(`molecule-upgrade-${key}-amount-sub`).disabled = true;
    } else {
      document.getElementById(`molecule-upgrade-${key}-amount-sub`).disabled = false;
    }
  }
  if ( gameState.points < gameState.player.costPerWalkLevel ) {
    document.getElementById("player-upgrade-walk-amount-add").disabled = true;
  } else {
    document.getElementById("player-upgrade-walk-amount-add").disabled = false;
  }
  if ( gameState.player.walkLevel <= 0 ) {
    document.getElementById("player-upgrade-walk-amount-sub").disabled = true;
  } else {
    document.getElementById("player-upgrade-walk-amount-sub").disabled = false;
  }
  document.getElementById('player-upgrade-walk-amount').textContent = gameState.player.walkLevel.toFixed(2);
  document.getElementById("tab-upgrades-points-amount").textContent = gameState.points.toFixed(2) + MP_ICON;
  eventBus.emit('gameStateChanged');
}

document.getElementById("gc-controls-playpause").addEventListener("click", function() {
    if (macroGame.isPaused) {
        macroGame.isPaused = false;
        microGame.isPaused = false;
        this.textContent = "Pause";
    } else {
        macroGame.isPaused = true;
        microGame.isPaused = true;
        this.textContent = "Play";
    }
});

const sidePanel = document.getElementById('side-panel');
const toggleButton = document.getElementById('toggle-button');
const tabButtons = document.querySelectorAll('.tab-button');
const tabControls = document.getElementById('tab-controls');
const tabUpgrades = document.getElementById('tab-upgrades');
const tabDebug = document.getElementById("tab-debug");
const tabPanelLabel = document.getElementById('toggle-panel-label');
const sidePanelContent = document.getElementById("side-panel-content");

toggleButton.addEventListener('click', () => {
  const isCollapsedBefore = sidePanel.classList.contains('collapsed');
  sidePanel.classList.toggle('collapsed');
  if (isCollapsedBefore) {
    sidePanelContent.style.display = 'block';
    tabPanelLabel.style.display = 'block';
  } else {
    sidePanelContent.style.display = 'none';
    tabPanelLabel.style.display = 'none';
  }
});

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    if (button.dataset.tab === 'controls') {
      tabControls.style.display = 'block';
      tabUpgrades.style.display = 'none';
      tabDebug.style.display = 'none';
    } else if ( button.dataset.tab == 'upgrades') {
      tabControls.style.display = 'none';
      tabUpgrades.style.display = 'block';
      tabDebug.style.display = 'none';
    } else if ( button.dataset.tab == 'debug' ) {
      tabControls.style.display = 'none';
      tabUpgrades.style.display = 'none';
      tabDebug.style.display = 'block';
    } else {
      console.error(`unlinked tab: "${button.dataset.tab}"`);
    }
  });
});

const updateSpeedFactor = () => {
  const time = parseFloat(document.getElementById("tab-debug-speed").value) || 1;
  gameState.speed = (gameState.environment.temperature / 20) * time;
  updateView();
};
document.getElementById("tab-debug-speed").addEventListener("input", () => updateSpeedFactor());
document.getElementById("environment-upgrade-temperature-validate").addEventListener("click", () => {
  const temperature = parseFloat(document.getElementById("environment-upgrade-temperature-amount").value) || 20;
  const delta = gameState.environment.temperature - temperature;
  gameState.environment.temperature = temperature;
  gameState.points -= Math.abs(delta);
  updateSpeedFactor();
});
document.getElementById("tab-debug-control-walk-level").addEventListener("input", (event) => {
  gameState.player.walkLevel = parseFloat(event.target.value) || 1;
});

for(let key in gameState.molecules) {
  document.getElementById(`molecule-upgrade-${key}-amount-add`).addEventListener("click", () => {
    const cost = gameState.molecules[key].cost;
    if (gameState.points >= cost) {
      gameState.points -= cost;
      gameState.molecules[key].amount += 1;
      updateView();
    }
  });
  document.getElementById(`molecule-upgrade-${key}-amount-sub`).addEventListener("click", () => {
    const cost = gameState.molecules[key].cost;
    if (gameState.molecules[key].amount > 0) {
      gameState.points += cost;
      gameState.molecules[key].amount -= 1;
      updateView();
    }
  });
}
document.getElementById("player-upgrade-walk-amount-add").addEventListener("click", () => {
  if ( 0 <= (gameState.points - gameState.player.costPerWalkLevel) ) {
    gameState.points -= gameState.player.costPerWalkLevel;
    gameState.player.walkLevel += 1;
    updateView();
  }
});
document.getElementById("player-upgrade-walk-amount-sub").addEventListener("click", () => {
  if ( 0 < gameState.player.walkLevel ) {
    gameState.points += gameState.player.costPerWalkLevel;
    gameState.player.walkLevel -= 1;
    updateView();
  }
});
document.getElementById("tab-debug-control-points-validate").addEventListener("click", () => {
  gameState.points = parseInt(document.getElementById("tab-debug-control-points-amount").value);
  updateView();
});
document.getElementById("tab-debug-control-scenario-1").addEventListener("click", () => {
  gameState.molecules.ATP.amount = 20;
  gameState.molecules.myosin.amount = 10;
  gameState.molecules.PFK1.amount = 10;
  gameState.molecules.glucose.amount = 10;
  gameState.molecules.amylase.amount = 10;
  updateView();
});

setInterval(() => {
  document.getElementById("tab-upgrades-energy-amount").textContent = gameState.player.energy.toFixed(2);
}, 1000);

updateView();

eventBus.on('gameStateChangedBackPropagation', (newGameState) => {
  updateView();
});