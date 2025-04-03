// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение готово
document.addEventListener('DOMContentLoaded', function() {
    tg.ready();
    
    // Настраиваем внешний вид WebApp
    tg.expand(); // Раскрываем на весь экран
    
    // Устанавливаем тему в соответствии с темой Telegram
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Настраиваем главную кнопку
    tg.MainButton.setParams({
        text: 'НАЧАТЬ ИГРУ',
        color: '#007AFF'
    });

    // Показываем главное меню
    showGames();
});

// Обработка главной кнопки
tg.MainButton.onClick(() => {
    if (tg.MainButton.text === 'НАЧАТЬ ИГРУ') {
        startGame();
    }
});

// Состояние игры
let gameState = {
    traits: {
        wisdom: 50,
        cruelty: 50,
        technology: 50
    },
    resources: {
        gold: 1000,
        food: 500
    },
    territories: {
        capital: {
            population: 1000,
            buildings: []
        }
    },
    advisors: [],
    activeEvents: [],
    abilities: {
        inspiration: {
            cooldown: 0
        }
    },
    diplomacy: {
        northKingdom: {
            relation: 50
        }
    },
    survived_days: 0,
    era: 'medieval',
    currentDecision: null
};

// Функция сброса состояния игры
function resetGameState() {
    gameState = {
        traits: {
            wisdom: 50,
            cruelty: 50,
            technology: 50
        },
        resources: {
            gold: 1000,
            food: 500
        },
        territories: {
            capital: {
                population: 1000,
                buildings: []
            }
        },
        advisors: [],
        activeEvents: [],
        abilities: {
            inspiration: {
                cooldown: 0
            }
        },
        diplomacy: {
            northKingdom: {
                relation: 50
            }
        },
        survived_days: 0,
        era: 'medieval',
        currentDecision: null
    };
}

// Система подсчета очков
function calculateScore(state) {
    let score = state.survived_days * 10; // Базовые очки за выживание
    
    // Бонус за эпоху
    const eraBonus = {
        medieval: 1,
        industrial: 1.5,
        space: 2
    };
    score *= eraBonus[state.era];
    
    // Бонус за сбалансированные характеристики
    const avgTrait = Object.values(state.traits).reduce((a, b) => a + b, 0) / 3;
    if (avgTrait > 50) score *= 1.2;
    
    return Math.round(score);
}

// Достижения
const achievements = {
    survivor: {
        id: 'survivor',
        title: '🌟 Выживший',
        description: 'Прожить 50 дней',
        condition: (state) => state.survived_days >= 50,
        reward: 100
    },
    wisdom_master: {
        id: 'wisdom_master',
        title: '🧠 Мудрец',
        description: 'Достичь мудрости 80+',
        condition: (state) => state.traits.wisdom >= 80,
        reward: 150
    },
    balanced: {
        id: 'balanced',
        title: '⚖️ Гармония',
        description: 'Все характеристики выше 60',
        condition: (state) => Object.values(state.traits).every(v => v >= 60),
        reward: 200
    },
    space_age: {
        id: 'space_age',
        title: '🚀 Космическая эра',
        description: 'Достичь космической эры',
        condition: (state) => state.era === 'space',
        reward: 300
    }
};

// Решения для разных эр
const decisions = {
    medieval: [
        {
            question: "Ученый просит финансирование для исследования звезд",
            approve: {
                effect: "Новые знания получены",
                traits: { wisdom: 15, technology: 10, cruelty: -5 }
            },
            deny: {
                effect: "Ресурсы сохранены",
                traits: { wisdom: -5, technology: -5, cruelty: 0 }
            }
        },
        {
            question: "Советник предлагает повысить налоги для строительства библиотеки",
            approve: {
                effect: "Народ недоволен, но уровень знаний растет",
                traits: { wisdom: 10, cruelty: 5, technology: 5 }
            },
            deny: {
                effect: "Народ доволен, но развитие замедляется",
                traits: { wisdom: -5, cruelty: -5, technology: -5 }
            }
        }
    ],
    industrial: [
        {
            question: "Инженеры предлагают построить первую фабрику",
            approve: {
                effect: "Производство растет, но экология страдает",
                traits: { technology: 15, wisdom: 5, cruelty: 10 }
            },
            deny: {
                effect: "Сохраняем традиционное производство",
                traits: { technology: -10, wisdom: 5, cruelty: -5 }
            }
        }
    ],
    space: [
        {
            question: "Разрешить колонизацию Марса частным компаниям?",
            approve: {
                effect: "Прогресс ускоряется, но растет неравенство",
                traits: { technology: 7, wisdom: -2 }
            },
            deny: {
                effect: "Равные возможности, но медленный прогресс",
                traits: { wisdom: 4, technology: -4 }
            }
        },
        {
            question: "Загрузить сознание людей в цифровое бессмертие?",
            approve: {
                effect: "Бессмертие достигнуто, но что такое человечность?",
                traits: { technology: 9, wisdom: -5, cruelty: 3 }
            },
            deny: {
                effect: "Сохранена человеческая природа, но смертность остается",
                traits: { wisdom: 8, technology: -6 }
            }
        }
    ]
};

// Объявляем переменные глобально
let levelSystem, diarySystem, collectionsSystem, dailyTasksSystem;

// Функция для показа экранов
function showScreen(screenId) {
    // Скрываем все экраны
    const screens = [
        'mainMenu',
        'gameScreen',
        'leaderboardScreen',
        'achievementsScreen',
        'diaryScreen',
        'collectionsScreen',
        'dailyTasksScreen'
    ];
    
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) {
            screen.style.display = 'none';
        }
    });

    // Показываем нужный экран
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.style.display = 'flex';
        
        // Обновляем содержимое экрана
        switch(screenId) {
            case 'leaderboardScreen':
                updateLeaderboard();
                break;
            case 'achievementsScreen':
                updateAchievements();
                break;
            case 'diaryScreen':
                if (diarySystem) diarySystem.updateDiaryUI();
                break;
            case 'collectionsScreen':
                if (collectionsSystem) collectionsSystem.updateCollectionsUI();
                break;
            case 'dailyTasksScreen':
                if (dailyTasksSystem) dailyTasksSystem.updateTasksUI();
                break;
        }
    }
}

// Функция начала игры
function startGame() {
    // Скрываем главную кнопку
    tg.MainButton.hide();
    
    // Загружаем сохраненный прогресс
    const savedProgress = loadPlayerProgress();
    if (savedProgress) {
        gameState = savedProgress;
    } else {
        resetGameState();
    }
    
    // Запускаем игру
    initGame();
}

// Функция возврата в меню
function showMainMenu() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="main-menu">
            <h1 class="game-title">Правитель</h1>
            
            <!-- Статистика игрока -->
            <div class="player-stats-container">
                <div class="best-score">
                    🏆 Лучший результат: ${getBestScore()}
                </div>
                <div class="total-games">
                    🎮 Всего игр: ${getTotalGames()}
                </div>
            </div>

            <!-- Кнопки меню -->
            <div class="menu-buttons">
                <button class="menu-button primary" onclick="startGame()">
                    <span class="button-icon">▶️</span>
                    Начать игру
                </button>
                
                <button class="menu-button" onclick="showLeaderboard()">
                    <span class="button-icon">🏆</span>
                    Рейтинг
                </button>
                
                <button class="menu-button" onclick="showTutorial()">
                    <span class="button-icon">📖</span>
                    Как играть
                </button>
            </div>

            <!-- Последние достижения -->
            <div class="recent-achievements">
                <h3>Последние достижения</h3>
                <div class="achievements-list">
                    ${getRecentAchievements()}
                </div>
            </div>
        </div>
    `;
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.menu-screen, #gameScreen, #leaderboardScreen, #achievementsScreen, .game-over-screen');
    screens.forEach(screen => {
        if (screen) {
            screen.style.display = 'none';
        }
    });
}

// Функция инициализации игры
function initGame() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
    }

    // Добавляем профиль игрока
    const playerProfile = showPlayerProfile();
    mainContent.prepend(playerProfile);

    // Сбрасываем состояние игры
    resetGameState();
    
    // Инициализируем игру
    initializeAdvisors();
    
    // Инициализация территорий
    initializeTerritories();
    
    // Обновляем интерфейс
    updateInterface();
    generateNewDecision();
    
    // Запускаем ежедневный цикл
    startDailyCycle();
}

// Добавляем обработку свайпов
function initSwipeHandlers(card, decision) {
    let startX = 0;
    let currentX = 0;
    
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 20) {
            const isRight = deltaX > 0;
            showStatChanges(isRight, decision); // Правый свайп - принять, левый - отказать
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
            card.style.background = isRight ? '#4CAF50' : '#ff4444';
        }
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
        const deltaX = currentX - startX;
        if (Math.abs(deltaX) > 100) {
            makeDecision(deltaX > 0); // Правый свайп - принять, левый - отказать
        } else {
            card.style.transform = '';
            card.style.background = '';
            hideStatChanges();
        }
    });
}

// Функция генерации нового решения
function generateNewDecision() {
    const gameElements = document.querySelector('.game-elements');
    if (!gameElements) return;

    // Удаляем старую карточку
    const oldCard = document.querySelector('.decision-card');
    if (oldCard) {
        oldCard.remove();
    }

    // Создаем новую карточку
    const newCard = document.createElement('div');
    newCard.className = 'decision-card';
    gameElements.appendChild(newCard);

    // Получаем новое решение
    const newDecision = getContextualDecision();
    gameState.currentDecision = newDecision;

    // Генерируем случайные отрицательные значения для отказа
    const denyEffects = {
        wisdom: -Math.floor(Math.random() * 8) - 3,
        cruelty: -Math.floor(Math.random() * 8) - 3,
        technology: -Math.floor(Math.random() * 8) - 3
    };

    // Сохраняем эффекты отказа в решении
    newDecision.deny = {
        traits: denyEffects
    };

    // Обновляем карточку
    updateDecisionCard(newDecision);
}

// Функция проверки требований для решений
function checkDecisionRequirements(decision) {
    // Если у решения нет требований, оно всегда доступно
    if (!decision.requirements) return true;

    // Проверяем каждое требование
    const requirements = decision.requirements;

    // Проверка эры
    if (requirements.era && requirements.era !== gameState.era) {
        return false;
    }

    // Проверка минимальных значений характеристик
    if (requirements.minTraits) {
        for (const [trait, minValue] of Object.entries(requirements.minTraits)) {
            if (gameState.traits[trait] < minValue) {
                return false;
            }
        }
    }

    // Проверка максимальных значений характеристик
    if (requirements.maxTraits) {
        for (const [trait, maxValue] of Object.entries(requirements.maxTraits)) {
            if (gameState.traits[trait] > maxValue) {
                return false;
            }
        }
    }

    // Проверка количества дней правления
    if (requirements.minDays && gameState.survived_days < requirements.minDays) {
        return false;
    }

    // Если все проверки пройдены, решение доступно
    return true;
}

// Обновляем функцию getContextualDecision для использования фильтрации
function getContextualDecision() {
    const eraDecisions = decisions[gameState.era];
    if (!eraDecisions || eraDecisions.length === 0) {
        // Если нет решений для текущей эры, возвращаем базовое решение
        return {
            question: "Обычный день в королевстве",
            approve: {
                effect: "День прошел спокойно",
                traits: { wisdom: 5, cruelty: 0, technology: 3 }
            },
            deny: {
                effect: "День прошел в заботах",
                traits: { wisdom: -3, cruelty: 0, technology: -3 }
            }
        };
    }

    const availableDecisions = eraDecisions.filter(decision => checkDecisionRequirements(decision));
    
    if (availableDecisions.length === 0) {
        // Если нет доступных решений после фильтрации, возвращаем случайное решение из эры
        return eraDecisions[Math.floor(Math.random() * eraDecisions.length)];
    }

    return availableDecisions[Math.floor(Math.random() * availableDecisions.length)];
}

// Функция обновления карточки решения
function updateDecisionCard(decision) {
    const decisionCard = document.querySelector('.decision-card');
    if (!decisionCard) return;

    const randomImage = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${Math.random()}`;

    decisionCard.innerHTML = `
        <div class="character-image">
            <img src="${randomImage}" alt="Character">
        </div>
        <div class="decision-text">${decision.question}</div>
        <div class="decision-effects">
            <div class="effects-column">
                <div class="effects-header">→ Принять</div>
                <div class="effects-list">
                    ${renderEffectsList(decision.approve.traits)}
                </div>
            </div>
            <div class="effects-column">
                <div class="effects-header">Отказать ←</div>
                <div class="effects-list">
                    ${renderEffectsList(decision.deny.traits)}
                </div>
            </div>
        </div>
    `;

    initSwipeHandlers(decisionCard, decision);
}

function renderEffectsList(effects) {
    const icons = {
        wisdom: '🧠',
        cruelty: '⚔️',
        technology: '⚙️'
    };

    return Object.entries(effects)
        .map(([trait, value]) => {
            const isPositive = value > 0;
            const valueClass = isPositive ? 'positive' : 'negative';
            const sign = isPositive ? '+' : '';
            
            return `
                <div class="effect-item">
                    <span class="effect-icon">${icons[trait]}</span>
                    <span class="effect-value ${valueClass}">${sign}${value}</span>
                </div>
            `;
        })
        .join('');
}

// Функция обработки решения
function makeDecision(choice) {
    if (!gameState.currentDecision) return;

    // Получаем эффекты в зависимости от выбора (approve или deny)
    const effects = choice ? gameState.currentDecision.approve : gameState.currentDecision.deny;
    
    // Применяем эффекты
    if (effects && effects.traits) {
        Object.entries(effects.traits).forEach(([trait, change]) => {
            if (gameState.traits[trait] !== undefined) {
                // Применяем точное изменение из эффектов
                const newValue = Math.max(0, Math.min(100, gameState.traits[trait] + change));
                gameState.traits[trait] = newValue;
                
                // Обновляем визуальное отображение
                const barFill = document.querySelector(`#${trait}-bar .stat-bar-fill`);
                const valueEl = document.querySelector(`#${trait}-bar + .stat-value`);
                
                if (barFill) {
                    barFill.style.width = `${newValue}%`;
                }
                if (valueEl) {
                    valueEl.textContent = Math.round(newValue);
                }
            }
        });
    }

    // Увеличиваем счетчик дней
    gameState.survived_days++;
    
    // Проверяем условия окончания игры
    if (checkGameOver()) {
        return;
    }

    // Создаем новую карточку
    generateNewDecision();
}

// Функция обновления интерфейса
function updateInterface() {
    // Обновляем статистику
    updateStatBars();
    
    // Обновляем год и время правления
    updateTimeAndEra();
    
    // Показываем текущие значения характеристик
    const traits = ['wisdom', 'cruelty', 'technology'];
    traits.forEach(trait => {
        const statValue = document.querySelector(`.${trait}-value`);
        if (statValue) {
            statValue.textContent = gameState.traits[trait];
        }
    });
}

// Функция проверки смерти
function checkDeath() {
    const isDead = Object.values(gameState.traits).some(value => value <= 0 || value >= 100);
    if (isDead) {
        endGame();
    }
    return isDead;
}

// Функция обновления полосок характеристик
function updateStatBars() {
    Object.entries(gameState.traits).forEach(([trait, value]) => {
        const barFill = document.querySelector(`#${trait}-bar .stat-bar-fill`);
        const valueEl = document.querySelector(`#${trait}-bar + .stat-value`);
        
        if (barFill) {
            barFill.style.width = `${value}%`;
        }
        if (valueEl) {
            valueEl.textContent = Math.round(value);
        }
    });
}

// Функция обновления счетчика дней
function updateDayCounter() {
    const counter = document.getElementById('day-counter');
    if (counter) {
        counter.textContent = gameState.survived_days;
    }
}

// Функция обновления отображения эры
function updateEraDisplay() {
    const eraText = document.getElementById('era-text');
    if (eraText) {
        const eraNames = {
            medieval: 'Средневековье',
            industrial: 'Индустриальная эра',
            space: 'Космическая эра'
        };
        eraText.textContent = eraNames[gameState.era];
    }
}

// Функция окончания игры
function endGame() {
    // Сначала удалим существующие экраны окончания игры, если они есть
    const existingScreens = document.querySelectorAll('.game-over-screen');
    existingScreens.forEach(screen => screen.remove());

    const gameOverScreen = document.createElement('div');
    gameOverScreen.className = 'game-over-screen';
    
    gameOverScreen.innerHTML = `
        <div class="game-over-content">
            <h2 class="game-over-title">Игра окончена</h2>
            
            <div class="game-stats">
                <p>Прожито дней: ${gameState.survived_days}</p>
                <p>Эпоха: ${getEraName(gameState.era)}</p>
                <p>Причина проигрыша: ${getDeathReason()}</p>
            </div>

            <div class="final-traits">
                <p>Мудрость: ${gameState.traits.wisdom}%</p>
                <p>Жестокость: ${gameState.traits.cruelty}%</p>
                <p>Технологии: ${gameState.traits.technology}%</p>
            </div>

            <div class="game-over-buttons">
                <button class="restart-button" id="restartGameBtn">
                    <span class="button-icon">🔄</span>
                    НАЧАТЬ ЗАНОВО
                </button>
                <button class="menu-button" id="returnToMenuBtn">
                    <span class="button-icon">🏠</span>
                    В ГЛАВНОЕ МЕНЮ
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(gameOverScreen);

    // Добавляем стили для экрана окончания игры
    const styles = `
        .game-over-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .game-over-content {
            background: white;
            padding: 20px;
            border-radius: 16px;
            max-width: 90%;
            width: 400px;
            text-align: center;
        }

        .game-over-title {
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
        }

        .game-stats, .final-traits {
            margin-bottom: 20px;
            text-align: left;
        }

        .game-over-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .restart-button, .menu-button {
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .restart-button {
            background: #4CAF50;
            color: white;
        }

        .menu-button {
            background: #666;
            color: white;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Обработчики кнопок
    const restartButton = gameOverScreen.querySelector('#restartGameBtn');
    const menuButton = gameOverScreen.querySelector('#returnToMenuBtn');

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            gameOverScreen.remove();
            startGame();
        });
    }

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            gameOverScreen.remove();
            showGames();
        });
    }
}

// Функция определения причины проигрыша
function getDeathReason() {
    const { wisdom, cruelty, technology } = gameState.traits;
    
    if (wisdom >= 100) return "Слишком много мудрости привело к отрешению от мира";
    if (wisdom <= 0) return "Недостаток мудрости привел к краху";
    if (cruelty >= 100) return "Чрезмерная жестокость привела к восстанию";
    if (cruelty <= 0) return "Отсутствие контроля привело к анархии";
    if (technology >= 100) return "Технологии вышли из-под контроля";
    if (technology <= 0) return "Технологический регресс привел к упадку";
    
    return "Неизвестная причина";
}

// Функция перезапуска игры
function resetGame() {
    // Удаляем экран окончания игры
    const gameOverScreen = document.querySelector('.game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.remove();
    }

    // Показываем игровой экран
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) {
        gameScreen.style.display = 'flex';
    }

    // Сбрасываем состояние игры
    gameState = {
        traits: {
            wisdom: 50,
            cruelty: 50,
            technology: 50
        },
        resources: {
            gold: 1000,
            food: 500
        },
        territories: {
            capital: {
                population: 1000,
                buildings: []
            }
        },
        advisors: [],
        activeEvents: [],
        abilities: {
            inspiration: {
                cooldown: 0
            }
        },
        diplomacy: {
            northKingdom: {
                relation: 50
            }
        },
        survived_days: 0,
        era: 'medieval',
        currentDecision: null
    };

    // Обновляем интерфейс
    updateTraitBars();
    updateDayCounter();
    updateEraDisplay();
    generateNewDecision();
}

// В начале файла, после инициализации Telegram WebApp
function initializePlayerInfo() {
    const playerName = document.getElementById('player-name');
    if (playerName && tg.initDataUnsafe?.user?.first_name) {
        playerName.textContent = tg.initDataUnsafe.user.first_name;
    }
}

// Функция обновления времени и эры
function updateTimeAndEra() {
    // Обновляем год (начинаем с 1183)
    const currentYear = 1183 + gameState.survived_days;
    
    // Обновляем отображение года
    const yearCounter = document.querySelector('.year-counter');
    if (yearCounter) {
        yearCounter.textContent = currentYear;
    }
    
    // Обновляем количество прожитых дней
    const yearsCount = document.querySelector('.years-count');
    if (yearsCount) {
        yearsCount.textContent = `${gameState.survived_days} дней`;
    }
}

// Обновляем функцию showGames
function showGames() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="game-screen">
            <div class="game-header">
                <h1 class="game-title">AI Dynasty</h1>
                <p class="game-subtitle">Управляй королевством, принимай решения</p>
            </div>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-icon">👑</div>
                    <div class="stat-value">${getBestScore() || 300}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-value">${getTotalGames() || 10}</div>
                </div>
            </div>

            <div class="menu-card">
                <div class="menu-items">
                    <div class="menu-item">
                        <div class="menu-item-icon">👑</div>
                        <div class="menu-item-text">Правь мудро</div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-icon">⚔️</div>
                        <div class="menu-item-text">Побеждай врагов</div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-icon">🏰</div>
                        <div class="menu-item-text">Развивай королевство</div>
                    </div>
                </div>
                <button class="start-button" id="startGameBtn">
                    <span class="button-icon">▶️</span>
                    <span>Начать игру</span>
                </button>
            </div>
        </div>
    `;

    // Добавляем обработчик для кнопки
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
}

// Обновляем HTML структуру
document.addEventListener('DOMContentLoaded', function() {
    // Создаем базовую структуру
    document.body.innerHTML = `
        <div class="main-content"></div>
        <div class="bottom-nav">
            <button class="nav-item active" data-screen="games">
                <span class="nav-icon">🎮</span>
                <span class="nav-text">Игры</span>
            </button>
            <button class="nav-item" data-screen="leaderboard">
                <span class="nav-icon">🏆</span>
                <span class="nav-text">Рейтинг</span>
            </button>
            <button class="nav-item" data-screen="achievements">
                <span class="nav-icon">🌟</span>
                <span class="nav-text">Достижения</span>
            </button>
        </div>
    `;

    // Добавляем обработчики для навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const screen = this.getAttribute('data-screen');
            switch(screen) {
                case 'games':
                    showGames();
                    break;
                case 'leaderboard':
                    showLeaderboard();
                    break;
                case 'achievements':
                    showAchievements();
                    break;
            }
            
            // Обновляем активную кнопку
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Показываем главный экран при загрузке
    showGames();
});

// Функция инициализации всех систем
function initializeSystems() {
    try {
        levelSystem = new LevelSystem();
        diarySystem = new DiarySystem();
        collectionsSystem = new CollectionSystem();
        dailyTasksSystem = new DailyTasksSystem();
        
        // Обновляем UI всех систем
        levelSystem.updateUI();
        if (diarySystem) diarySystem.updateDiaryUI();
        if (collectionsSystem) collectionsSystem.updateCollectionsUI();
        if (dailyTasksSystem) dailyTasksSystem.updateTasksUI();
        
        console.log('Все системы успешно инициализированы');
    } catch (error) {
        console.error('Ошибка при инициализации систем:', error);
    }
}

// Функции для работы с локальным хранилищем
function saveScore(score) {
    try {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        const newScore = {
            score: score,
            date: new Date().toISOString(),
            name: tg.initDataUnsafe?.user?.first_name || 'Игрок',
            survived_days: gameState.survived_days,
            era: gameState.era
        };
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score); // Сортируем по убыванию
        localStorage.setItem('scores', JSON.stringify(scores.slice(0, 10))); // Храним только топ-10
        
        // Проверяем достижения
        const newAchievements = checkNewAchievements();
        if (newAchievements.length > 0) {
            showAchievementNotification(newAchievements);
        }
    } catch (error) {
        console.error('Ошибка при сохранении счета:', error);
    }
}

function showAchievementNotification(achievements) {
    achievements.forEach(achievement => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <h3>🏆 Новое достижение!</h3>
            <p>${achievement.title}</p>
            <span>+${achievement.reward} очков</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    });
}

function updateLeaderboard() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Получаем сохраненные результаты
    const scores = JSON.parse(localStorage.getItem('scores') || '[]');
    
    mainContent.innerHTML = `
        <div class="leaderboard-screen">
            <h2 class="leaderboard-title">Рейтинг</h2>
            <div class="leaderboard-list">
                ${scores.map((score, index) => `
                    <div class="leaderboard-item">
                        <div class="rank">${index + 1}</div>
                        <div class="player-info">
                            <div class="score-info">🏆 ${score.score || 0}</div>
                            <div class="player-details">
                                <span>📅 ${score.survived_days || 0} дней</span>
                                <span>🌍 ${getEraName(score.era) || 'Средневековье'}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showAchievements() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <h2 class="leaderboard-title">Достижения</h2>
        <div class="achievements-list">
            ${renderAchievements()}
        </div>
    `;

    // Обновляем активную кнопку в навигации
    updateNavigation('achievements');
}

function checkNewAchievements() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const newAchievements = [];
    
    Object.values(achievements).forEach(achievement => {
        if (!unlockedAchievements.includes(achievement.id) && achievement.condition(gameState)) {
            unlockedAchievements.push(achievement.id);
            newAchievements.push(achievement);
        }
    });
    
    localStorage.setItem('achievements', JSON.stringify(unlockedAchievements));
    return newAchievements;
}

// Обработчик для табов в коллекциях
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            collectionsSystem.updateCollectionsUI();
        });
    });
});

// Вспомогательные функции
function getEraName(era) {
    const eraNames = {
        medieval: 'Средневековье',
        industrial: 'Индустриальная эра',
        space: 'Космическая эра'
    };
    return eraNames[era] || era;
}

function updateAIAppearance() {
    const face = document.querySelector('.ai-face');
    if (gameState.traits.cruelty > 70) {
        face.style.backgroundColor = '#FFB6C1';
    } else if (gameState.traits.wisdom > 70) {
        face.style.backgroundColor = '#98FB98';
    } else {
        face.style.backgroundColor = '#FFE4C4';
    }
}

function getRandomDecision() {
    return decisions[gameState.era][Math.floor(Math.random() * decisions[gameState.era].length)];
}

// Функция показа игр (главный экран)
function showGames() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="game-screen">
            <div class="game-header">
                <h1 class="game-title">AI Dynasty</h1>
                <p class="game-subtitle">Управляй королевством, принимай решения</p>
            </div>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-icon">👑</div>
                    <div class="stat-value">${getBestScore() || 300}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-value">${getTotalGames() || 10}</div>
                </div>
            </div>

            <div class="menu-card">
                <div class="menu-items">
                    <div class="menu-item">
                        <div class="menu-item-icon">👑</div>
                        <div class="menu-item-text">Правь мудро</div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-icon">⚔️</div>
                        <div class="menu-item-text">Побеждай врагов</div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-icon">🏰</div>
                        <div class="menu-item-text">Развивай королевство</div>
                    </div>
                </div>
                <button class="start-button" id="startGameBtn">
                    <span class="button-icon">▶️</span>
                    <span>Начать игру</span>
                </button>
            </div>
        </div>
    `;

    // Добавляем обработчик для кнопки
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
}

// Обновляем функцию showLeaderboard
function showLeaderboard() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Получаем сохраненные результаты
    const scores = JSON.parse(localStorage.getItem('scores') || '[]');
    
    mainContent.innerHTML = `
        <div class="leaderboard-screen">
            <h2 class="leaderboard-title">Рейтинг</h2>
            <div class="leaderboard-list">
                ${scores.map((score, index) => `
                    <div class="leaderboard-item">
                        <div class="rank">${index + 1}</div>
                        <div class="player-info">
                            <div class="score-info">🏆 ${score.score || 0}</div>
                            <div class="player-details">
                                <span>📅 ${score.survived_days || 0} дней</span>
                                <span>🌍 ${getEraName(score.era) || 'Средневековье'}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Добавляем стили для рейтинга
const styles = `
body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    height: 100vh;
}

.main-content {
    padding: 20px;
    padding-bottom: 70px;
    min-height: calc(100vh - 70px);
}

.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: white;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: none;
    background: none;
    cursor: pointer;
    color: #666;
}

.nav-item.active {
    color: #007AFF;
}

.nav-icon {
    font-size: 24px;
    margin-bottom: 4px;
}

.nav-text {
    font-size: 12px;
}

.game-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.game-title {
    font-size: 28px;
    margin-bottom: 10px;
    color: #333;
}

.game-subtitle {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
}

.game-card {
    background: #007AFF;
    border-radius: 16px;
    padding: 20px;
    width: 100%;
    max-width: 400px;
    color: white;
}

.game-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.feature {
    display: flex;
    align-items: center;
    gap: 10px;
}

.play-button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 8px;
    background: white;
    color: #007AFF;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
}

/* Стили для рейтинга */
.leaderboard-title {
    text-align: center;
    font-size: 24px;
    margin: 20px 0;
}

.leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 16px;
}

.leaderboard-item {
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.rank {
    width: 24px;
    height: 24px;
    background: #007AFF;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 12px;
}

.stat-row {
    display: flex;
    gap: 24px;
}

.stat-column {
    display: flex;
    align-items: center;
    gap: 4px;
}

.stat-label {
    font-size: 14px;
}

.stat-value {
    font-size: 14px;
    font-weight: bold;
}
`;

// Добавляем стили для достижений
const achievementStyles = `
    .achievements-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
    }

    .achievement-item {
        background: white;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .achievement-item.locked {
        opacity: 0.5;
    }

    .achievement-info h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
    }

    .achievement-info p {
        margin: 0;
        font-size: 14px;
        color: #666;
    }
`;

// Добавляем стили для карточек решений
const cardStyles = `
    .decision-card {
        background: #007AFF;
        border-radius: 16px;
        padding: 20px;
        margin: 20px;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .decision-text {
        font-size: 18px;
        margin-bottom: 20px;
        text-align: center;
    }

    .decision-effects {
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }

    .effects-column {
        flex: 1;
        background: rgba(255,255,255,0.1);
        padding: 12px;
        border-radius: 8px;
    }

    .effects-header {
        text-align: center;
        margin-bottom: 8px;
        font-size: 14px;
    }

    .effects-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .effect-item {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
    }

    .effect-value {
        font-weight: bold;
    }

    .effect-item.positive .effect-value {
        color: #4CAF50;
    }

    .effect-item.negative .effect-value {
        color: #f44336;
    }
`;

// Добавляем все стили на страницу
document.addEventListener('DOMContentLoaded', function() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles + achievementStyles + cardStyles;
    document.head.appendChild(styleSheet);
});

// Функция инициализации советников
function initializeAdvisors() {
    gameState.advisors = [
        {
            id: 'priest',
            name: 'Священник',
            trait: 'wisdom',
            advice: (decision) => {
                // Священник больше ценит мудрость и меньше - жестокость
                const wisdomChange = decision.approve.traits.wisdom || 0;
                const crueltyChange = decision.approve.traits.cruelty || 0;
                
                if (wisdomChange > 0 && crueltyChange <= 0) {
                    return {
                        recommendation: 'approve',
                        explanation: 'Это мудрое решение'
                    };
                } else {
                    return {
                        recommendation: 'deny',
                        explanation: 'Это не мудрый путь'
                    };
                }
            }
        },
        {
            id: 'general',
            name: 'Генерал',
            trait: 'cruelty',
            advice: (decision) => {
                // Генерал больше ценит жестокость и технологии
                const crueltyChange = decision.approve.traits.cruelty || 0;
                const techChange = decision.approve.traits.technology || 0;
                
                if (crueltyChange > 0 || techChange > 0) {
                    return {
                        recommendation: 'approve',
                        explanation: 'Это сделает нас сильнее'
                    };
                } else {
                    return {
                        recommendation: 'deny',
                        explanation: 'Это признак слабости'
                    };
                }
            }
        },
        {
            id: 'scientist',
            name: 'Учёный',
            trait: 'technology',
            advice: (decision) => {
                // Учёный больше ценит технологии и мудрость
                const techChange = decision.approve.traits.technology || 0;
                const wisdomChange = decision.approve.traits.wisdom || 0;
                
                if (techChange > 0 || wisdomChange > 0) {
                    return {
                        recommendation: 'approve',
                        explanation: 'Это продвинет наши знания'
                    };
                } else {
                    return {
                        recommendation: 'deny',
                        explanation: 'Это затормозит прогресс'
                    };
                }
            }
        }
    ];
}

// Функция получения советов от советников
function getAdvisorAdvices(decision) {
    return gameState.advisors.map(advisor => {
        return {
            advisor: advisor.name,
            ...advisor.advice(decision)
        };
    });
}

function updateTraitBars() {
    Object.entries(gameState.traits).forEach(([trait, value]) => {
        const bar = document.getElementById(`${trait}-bar`);
        if (bar) {
            bar.style.width = `${value}%`;
        }
    });
}

// Функция показа предпросмотра эффектов
function showPreview(choice) {
    const decision = gameState.currentDecision[choice];
    if (!decision) return;

    // Обновляем отображение изменений для каждой характеристики
    Object.entries(decision.traits).forEach(([trait, change]) => {
        const statChange = document.querySelector(`#${trait}-change`);
        if (statChange) {
            const changeText = change >= 0 ? `+${change}` : change;
            statChange.textContent = changeText;
            statChange.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    });
}

// Функция сброса предпросмотра
function resetPreview() {
    const statChanges = document.querySelectorAll('.stat-change');
    statChanges.forEach(change => {
        change.textContent = '';
        change.className = 'stat-change';
    });
}

// Добавляем поддержку тач-событий для мобильных устройств
function addTouchSupport() {
    const approveBtn = document.querySelector('.decision-btn.approve');
    const denyBtn = document.querySelector('.decision-btn.deny');

    if (approveBtn) {
        approveBtn.addEventListener('touchstart', () => showPreview('approve'));
        approveBtn.addEventListener('touchend', resetPreview);
    }

    if (denyBtn) {
        denyBtn.addEventListener('touchstart', () => showPreview('deny'));
        denyBtn.addEventListener('touchend', resetPreview);
    }
}

// Обновляем HTML структуру главного меню
const menuHTML = `
    <div class="menu-screen">
        <h1 class="menu-title">Название Игры</h1>
        <div class="menu-buttons">
            <button class="menu-btn" onclick="startGame()">Играть</button>
            <button class="menu-btn" onclick="showAchievements()">Достижения</button>
            <button class="menu-btn" onclick="showLeaderboard()">Рейтинг</button>
        </div>
    </div>
`;

// Обновляем HTML структуру достижений
const achievementsHTML = `
    <div class="achievements-screen screen">
        <div class="screen-header">
            <button class="back-btn" onclick="showGames()">
                <span class="nav-icon">←</span>
                <span class="nav-text">Назад</span>
            </button>
            <h2 class="screen-title">Достижения</h2>
        </div>
        <div class="achievements-grid">
            <!-- Достижения будут добавляться динамически -->
        </div>
    </div>
`;

// Обновляем HTML структуру рейтинга
const leaderboardHTML = `
    <div class="leaderboard-screen screen">
        <div class="screen-header">
            <button class="back-btn" onclick="showMainMenu()">←</button>
            <h2 class="screen-title">Рейтинг</h2>
        </div>
        <div class="leaderboard-list">
            <!-- Рейтинг будет добавляться динамически -->
        </div>
    </div>
`;

// Функция для отображения достижения
function renderAchievement(achievement) {
    return `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
            </div>
            <div class="achievement-reward">+${achievement.reward}</div>
        </div>
    `;
}

function renderAchievements() {
    const achievements = [
        {
            id: 'survivor',
            title: 'Выживший',
            description: 'Достигните 50 дней правления',
            unlocked: gameState.survived_days >= 50
        },
        {
            id: 'wisdom_master',
            title: 'Мудрец',
            description: 'Достигните 80 мудрости',
            unlocked: gameState.traits.wisdom >= 80
        },
        {
            id: 'balanced',
            title: 'Гармония',
            description: 'Все характеристики выше 60',
            unlocked: Object.values(gameState.traits).every(v => v >= 60)
        },
        {
            id: 'space_age',
            title: 'Космическая эра',
            description: 'Достигните космической эры',
            unlocked: gameState.era === 'space'
        }
    ];

    return achievements.map(achievement => `
        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-info">
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
            </div>
        </div>
    `).join('');
}

function updateNavigation(activeScreen) {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => item.classList.remove('active'));
    
    switch(activeScreen) {
        case 'games':
            items[0].classList.add('active');
            break;
        case 'leaderboard':
            items[1].classList.add('active');
            break;
        case 'achievements':
            items[2].classList.add('active');
            break;
    }
}

function updateDiplomacy() {
    // Обновляем отношения с северным королевством на основе характеристик
    const northKingdom = gameState.diplomacy.northKingdom;
    
    // Если мудрость высокая - улучшаем отношения
    if (gameState.traits.wisdom > 70) {
        northKingdom.relation = Math.min(100, northKingdom.relation + 2);
    }
    
    // Если жестокость высокая - ухудшаем отношения
    if (gameState.traits.cruelty > 70) {
        northKingdom.relation = Math.max(0, northKingdom.relation - 2);
    }
}

function checkGameOver() {
    // Проверяем условия окончания игры
    const isDead = Object.entries(gameState.traits).some(([trait, value]) => {
        // Игра заканчивается, если какая-либо характеристика достигает 0 или 100
        return value <= 0 || value >= 100;
    });

    if (isDead) {
        // Сохраняем счет
        const finalScore = calculateScore(gameState);
        saveScore(finalScore);
        
        // Показываем экран окончания игры
        endGame();
        return true;
    }

    return false;
}

// Вспомогательные функции для отображения/скрытия изменений статистики
function showStatChanges(isApprove, decision) {
    // Оставляем функцию пустой, чтобы не показывать изменения
    return;
}

function hideStatChanges() {
    document.querySelectorAll('.stat-change').forEach(el => {
        el.style.opacity = '0';
    });
}

// Функция инициализации территорий
function initializeTerritories() {
    gameState.territories = {
        capital: {
            name: 'Столица',
            population: 1000,
            buildings: [],
            resources: {
                gold: 1000,
                food: 500
            }
        },
        villages: [],
        totalPopulation: 1000
    };
}

// Функция запуска ежедневного цикла
function startDailyCycle() {
    // Проверяем условия окончания игры
    if (checkGameOver()) {
        return;
    }

    // Обновляем дипломатию
    updateDiplomacy();

    // Обновляем интерфейс
    updateInterface();

    // Генерируем новое решение, если текущего нет
    if (!gameState.currentDecision) {
        generateNewDecision();
    }
}

function getBestScore() {
    const scores = JSON.parse(localStorage.getItem('scores') || '[]');
    if (scores.length === 0) return 0;
    return Math.max(...scores.map(s => s.score || 0));
}

function getTotalGames() {
    const scores = JSON.parse(localStorage.getItem('scores') || '[]');
    return scores.length;
}

function getRecentAchievements() {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    return achievements
        .slice(-3)
        .map(a => `
            <div class="achievement">
                <span class="achievement-icon">${a.icon}</span>
                <span class="achievement-name">${a.name}</span>
            </div>
        `)
        .join('') || 'Нет достижений';
}

function showTutorial() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="tutorial">
            <h2>Как играть</h2>
            <div class="tutorial-content">
                <p>👉 Свайпните вправо, чтобы принять решение</p>
                <p>👈 Свайпните влево, чтобы отклонить</p>
                <p>📊 Следите за показателями своего государства</p>
                <p>🎯 Старайтесь продержаться как можно дольше</p>
            </div>
            <button class="menu-button" onclick="showMainMenu()">Назад</button>
        </div>
    `;
}

// Инициализация AOS
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800,
        once: true
    });
});

// Функция для создания карточки решения
function createDecisionCard(decision) {
    // ... existing code ...
    
    // Добавляем анимацию появления
    gsap.from(card, {
        duration: 0.6,
        y: 100,
        opacity: 0,
        ease: "back.out(1.7)",
        clearProps: "all"
    });

    // Добавляем эффект параллакса при движении мыши
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        gsap.to(card, {
            duration: 0.5,
            rotateX: rotateX,
            rotateY: rotateY,
            ease: "power2.out"
        });
    });

    // Возвращаем карточку в исходное положение
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            duration: 0.5,
            rotateX: 0,
            rotateY: 0,
            ease: "power2.out"
        });
    });

    // Анимация при свайпе
    let startX;
    let isDragging = false;

    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    card.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        gsap.to(card, {
            duration: 0.1,
            x: deltaX,
            rotation: deltaX * 0.1,
            ease: "power2.out"
        });
    });

    card.addEventListener('touchend', () => {
        isDragging = false;
        gsap.to(card, {
            duration: 0.5,
            x: 0,
            rotation: 0,
            ease: "elastic.out(1, 0.5)"
        });
    });

    // Анимация эффектов решения
    const effects = card.querySelectorAll('.effect-item');
    effects.forEach((effect, index) => {
        effect.setAttribute('data-aos', 'fade-up');
        effect.setAttribute('data-aos-delay', (index * 100).toString());
    });
}

// Анимация при принятии решения
function animateDecision(approved) {
    const card = document.querySelector('.decision-card');
    if (!card) return;

    const direction = approved ? 1 : -1;
    const color = approved ? '#4CAF50' : '#ff4444';

    gsap.to(card, {
        duration: 0.5,
        x: direction * window.innerWidth,
        rotation: direction * 30,
        ease: "power2.in",
        backgroundColor: color,
        onComplete: () => {
            card.remove();
            generateNewDecision();
        }
    });
}

// Обновляем обработчики кнопок
function setupDecisionButtons() {
    document.getElementById('approveBtn')?.addEventListener('click', () => animateDecision(true));
    document.getElementById('denyBtn')?.addEventListener('click', () => animateDecision(false));
}

// Функция для получения данных пользователя Telegram
function getTelegramUserData() {
    if (window.Telegram && window.Telegram.WebApp) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
            name: user.first_name,
            avatar: user.photo_url,
            username: user.username,
            id: user.id
        };
    }
    return null;
}

// Функция для отображения профиля игрока
function showPlayerProfile() {
    const userData = getTelegramUserData();
    const profileContainer = document.createElement('div');
    profileContainer.className = 'player-profile';
    
    profileContainer.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <img src="${userData?.avatar || 'default-avatar.png'}" alt="Avatar">
            </div>
            <div class="profile-info">
                <h3 class="profile-name">${userData?.name || 'Игрок'}</h3>
                <span class="profile-username">@${userData?.username || ''}</span>
            </div>
        </div>
    `;

    return profileContainer;
}

// Функция для сохранения прогресса игрока
function savePlayerProgress(progress) {
    const userData = getTelegramUserData();
    if (userData) {
        const saveData = {
            userId: userData.id,
            progress: progress,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`gameProgress_${userData.id}`, JSON.stringify(saveData));
    }
}

// Функция для загрузки прогресса игрока
function loadPlayerProgress() {
    const userData = getTelegramUserData();
    if (userData) {
        const savedData = localStorage.getItem(`gameProgress_${userData.id}`);
        return savedData ? JSON.parse(savedData).progress : null;
    }
    return null;
}

// Обработка закрытия WebApp
tg.onEvent('viewportChanged', () => {
    // Сохраняем прогресс при сворачивании приложения
    if (gameState) {
        savePlayerProgress(gameState);
    }
});

// Обработка основных команд от Telegram
tg.onEvent('mainButtonClicked', () => {
    // Действие при нажатии основной кнопки
    if (tg.MainButton.text === 'НАЧАТЬ ИГРУ') {
        startGame();
    }
});

// Добавляем навигацию через кнопки в интерфейсе
function addNavigationButton() {
    const backBtn = document.createElement('button');
    backBtn.className = 'navigation-button';
    backBtn.innerHTML = '← Назад';
    backBtn.onclick = () => {
        showGames();
    };
    
    document.querySelector('.main-content').prepend(backBtn);
} 