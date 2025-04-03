// Расширенная игровая логика
class GameLogic {
    constructor() {
        this.effects = new VisualEffects();
        this.comboCount = 0;
        this.specialAbilities = new Set();
        this.currentCrisis = null;
        this.eventQueue = [];
    }

    processDecision(decision, choice) {
        const result = this.calculateDecisionResult(decision, choice);
        this.updateCombo(result);
        this.checkSpecialEvents();
        this.updateVisuals();
        return result;
    }

    calculateDecisionResult(decision, choice) {
        let result = { ...choice.effects };
        
        // Применяем комбо-множитель
        if (this.comboCount > 0) {
            const multiplier = 1 + (this.comboCount * 0.1);
            Object.keys(result).forEach(key => {
                result[key] *= multiplier;
            });
        }

        // Применяем специальные способности
        if (this.specialAbilities.has('wisdomBoost')) {
            result.wisdom *= 1.2;
        }

        return result;
    }

    updateCombo(result) {
        const isPositive = Object.values(result).every(val => val >= 0);
        if (isPositive) {
            this.comboCount++;
            this.showComboEffect();
        } else {
            this.comboCount = 0;
        }
    }

    showComboEffect() {
        if (this.comboCount > 1) {
            const combo = document.createElement('div');
            combo.className = 'combo-effect';
            combo.textContent = `Комбо x${this.comboCount}!`;
            document.body.appendChild(combo);
            setTimeout(() => combo.remove(), 2000);
        }
    }

    checkSpecialEvents() {
        if (Math.random() < 0.1) { // 10% шанс на специальное событие
            const event = this.generateSpecialEvent();
            this.showSpecialEvent(event);
        }
    }

    generateSpecialEvent() {
        const events = [
            {
                title: "Технологический прорыв",
                description: "Ваш ИИ совершил важное открытие!",
                choices: [
                    { text: "Развивать технологию", effects: { technology: 15, wisdom: 5 } },
                    { text: "Засекретить открытие", effects: { cruelty: 10, technology: 5 } }
                ]
            },
            // Добавьте больше событий здесь
        ];
        return events[Math.floor(Math.random() * events.length)];
    }

    showSpecialEvent(event) {
        // Реализация показа специального события
        // Будет добавлена в следующей части
    }

    checkUnlockableAbilities(traits) {
        if (traits.wisdom >= 80 && !this.specialAbilities.has('wisdomBoost')) {
            this.specialAbilities.add('wisdomBoost');
            this.showAbilityUnlock('Мудрость +20%');
        }
        // Добавьте больше способностей здесь
    }

    showAbilityUnlock(abilityName) {
        const notification = document.createElement('div');
        notification.className = 'ability-unlock';
        notification.innerHTML = `
            <div class="ability-icon">⭐</div>
            <div class="ability-text">Разблокирована способность: ${abilityName}</div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async triggerComboBonus() {
        VisualEffects.createParticles('combo');
        // Добавляем бонусы к характеристикам
        Object.keys(gameState.traits).forEach(trait => {
            gameState.traits[trait] += 5;
        });
    }

    async triggerSpecialEvent() {
        const event = this.generateSpecialEvent();
        this.eventQueue.push(event);
        await this.showEventAnimation(event);
    }

    checkAbilitiesUnlock() {
        const abilities = {
            timeControl: gameState.traits.technology > 90,
            mindControl: gameState.traits.wisdom > 90,
            massDestruction: gameState.traits.cruelty > 90
        };

        Object.entries(abilities).forEach(([ability, condition]) => {
            if (condition && !this.specialAbilities.has(ability)) {
                this.unlockAbility(ability);
            }
        });
    }
} 