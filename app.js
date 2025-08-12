// ゲーム設定とコンフィグシステム
let gameSettings = {
    controls: {
        keyMapping: {
            up: 'w',
            down: 's', 
            left: 'a',
            right: 'd',
            forward: 'q',
            backward: 'e',
            shoot: ' ',
            reset: 'r',
            config: 'c'
        },
        sensitivity: 1.0
    },
    gameplay: {
        difficulty: 'normal',
        playerSpeed: 2.0,
        dragonAI: 'normal',
        difficulties: {
            easy: { playerHp: 150, dragonHp: 150 },
            normal: { playerHp: 100, dragonHp: 200 },
            hard: { playerHp: 75, dragonHp: 250 }
        }
    },
    display: {
        playerColor: 'green',
        dragonColor: 'red', 
        backgroundColor: 'black',
        showHP: true,
        showAltitude: true,
        showScore: true,
        showControls: true,
        colors: {
            player: { green: '#00ffff', blue: '#0088ff', white: '#ffffff', yellow: '#ffff00' },
            dragon: { red: '#ff4444', orange: '#ff8800', purple: '#8844ff', pink: '#ff44aa' },
            background: { black: '#000022', darkblue: '#001122', darkgreen: '#002211' }
        }
    },
    audio: {
        volume: 50,
        attackSound: true,
        damageSound: true,
        moveSound: false
    }
};

// ゲーム設定
const gameConfig = {
    canvas: { width: 800, height: 600 },
    player: { 
        maxHp: 100, hp: 100, speed: 2,
        position: { x: 0, y: 0, z: -50 },
        rotation: { x: 0, y: 0, z: 0 }
    },
    dragon: { 
        maxHp: 200, hp: 200, speed: 1.5,
        position: { x: 30, y: 20, z: 50 },
        rotation: { x: 0, y: 0, z: 0 }
    },
    camera: { distance: 300, position: { x: 0, y: 0, z: -100 } },
    boundaries: {
        x: { min: -100, max: 100 },
        y: { min: -80, max: 80 },
        z: { min: -100, max: 100 }
    }
};

// モデルデータ
const models = {
    player: {
        vertices: [
            { x: 0, y: 0, z: 20 },
            { x: -10, y: -5, z: -10 },
            { x: 10, y: -5, z: -10 },
            { x: 0, y: 5, z: -10 }
        ],
        edges: [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]]
    },
    dragon: {
        vertices: [
            { x: 0, y: 0, z: 30 }, { x: -5, y: 5, z: 20 }, { x: 5, y: 5, z: 20 },
            { x: 0, y: 10, z: 15 }, { x: 0, y: 0, z: 0 }, { x: -8, y: 0, z: -10 },
            { x: 8, y: 0, z: -10 }, { x: -25, y: 0, z: -5 }, { x: 25, y: 0, z: -5 },
            { x: -15, y: -10, z: 0 }, { x: 15, y: -10, z: 0 }
        ],
        edges: [
            [0, 1], [0, 2], [1, 3], [2, 3], [1, 2], [1, 4], [2, 4], [3, 4],
            [4, 5], [4, 6], [5, 6], [5, 7], [6, 8], [5, 9], [6, 10],
            [7, 9], [8, 10], [9, 10]
        ]
    }
};

// グローバル変数
let canvas, ctx;
let gameState = 'playing';
let keys = {};
let projectiles = [];
let dragonProjectiles = [];
let score = 0;
let lastShot = 0;
let dragonLastShot = 0;
let dragonMovePattern = 0;
let dragonBehaviorState = 'patrol';
let dragonBehaviorTimer = 0;
let keyCapturing = null;

// コンフィグシステム
class ConfigManager {
    constructor() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // タブ切り替え - イベント委譲を使用して確実に動作させる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('config-tab')) {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab(e.target.dataset.tab);
            }
        });

        // キーコンフィグ
        document.querySelectorAll('.key-input').forEach(button => {
            button.addEventListener('click', () => this.startKeyCapture(button.dataset.action));
        });

        // プリセット選択
        document.getElementById('keyPreset').addEventListener('change', (e) => {
            this.applyKeyPreset(e.target.value);
        });

        // ゲーム設定
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            gameSettings.gameplay.difficulty = e.target.value;
            this.applyGameSettings();
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            gameSettings.gameplay.playerSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = e.target.value;
        });

        document.getElementById('dragonAISelect').addEventListener('change', (e) => {
            gameSettings.gameplay.dragonAI = e.target.value;
        });

        // 表示設定
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setColor(btn.dataset.target, btn.dataset.color));
        });

        document.querySelectorAll('#displayPanel input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const setting = e.target.id.replace('Checkbox', '').replace('show', '').toLowerCase();
                if (setting === 'hp') gameSettings.display.showHP = e.target.checked;
                if (setting === 'altitude') gameSettings.display.showAltitude = e.target.checked;
                if (setting === 'score') gameSettings.display.showScore = e.target.checked;
                if (setting === 'controls') gameSettings.display.showControls = e.target.checked;
                this.applyDisplaySettings();
            });
        });

        // 音響設定
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            gameSettings.audio.volume = parseInt(e.target.value);
            document.getElementById('volumeValue').textContent = e.target.value;
        });

        document.querySelectorAll('#audioPanel input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const setting = e.target.id.replace('Checkbox', '').replace('Sound', '');
                if (setting === 'attack') gameSettings.audio.attackSound = e.target.checked;
                if (setting === 'damage') gameSettings.audio.damageSound = e.target.checked;
                if (setting === 'move') gameSettings.audio.moveSound = e.target.checked;
            });
        });

        // キーキャプチャ
        document.addEventListener('keydown', (e) => {
            if (keyCapturing) {
                this.captureKey(e.key);
                e.preventDefault();
            }
        });
    }

    switchTab(tabName) {
        // タブボタンの更新
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // パネルの表示切り替え - 明示的に全パネルを非表示にしてから対象を表示
        document.querySelectorAll('.config-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(tabName + 'Panel');
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    startKeyCapture(action) {
        if (keyCapturing) {
            document.querySelector(`[data-action="${keyCapturing}"]`).classList.remove('capturing');
        }
        
        keyCapturing = action;
        const button = document.querySelector(`[data-action="${action}"]`);
        button.classList.add('capturing');
        button.textContent = 'キーを押してください...';
    }

    captureKey(key) {
        if (!keyCapturing) return;

        // 特殊キーの処理
        const displayKey = key === ' ' ? 'SPACE' : key.toUpperCase();
        
        // 重複チェック
        const existingAction = Object.keys(gameSettings.controls.keyMapping).find(
            action => action !== keyCapturing && gameSettings.controls.keyMapping[action] === key
        );

        if (existingAction) {
            alert(`キー "${displayKey}" は既に "${this.getActionName(existingAction)}" に割り当てられています。`);
            this.endKeyCapture();
            return;
        }

        // キー割り当て
        gameSettings.controls.keyMapping[keyCapturing] = key;
        
        // UIの更新
        const button = document.querySelector(`[data-action="${keyCapturing}"]`);
        button.textContent = displayKey;
        button.classList.remove('capturing');

        this.updateKeyDisplays();
        this.endKeyCapture();
    }

    endKeyCapture() {
        if (keyCapturing) {
            const button = document.querySelector(`[data-action="${keyCapturing}"]`);
            if (button.classList.contains('capturing')) {
                button.textContent = this.getKeyDisplay(gameSettings.controls.keyMapping[keyCapturing]);
                button.classList.remove('capturing');
            }
        }
        keyCapturing = null;
    }

    getActionName(action) {
        const names = {
            up: '上昇', down: '下降', left: '左移動', right: '右移動',
            forward: '前進', backward: '後退', shoot: '攻撃', reset: 'リセット'
        };
        return names[action] || action;
    }

    getKeyDisplay(key) {
        return key === ' ' ? 'SPACE' : key.toUpperCase();
    }

    applyKeyPreset(preset) {
        const presets = {
            wasd: {
                up: 'w', down: 's', left: 'a', right: 'd',
                forward: 'q', backward: 'e', shoot: ' ', reset: 'r', config: 'c'
            },
            esdf: {
                up: 'e', down: 'd', left: 's', right: 'f',
                forward: 'w', backward: 'r', shoot: ' ', reset: 't', config: 'c'
            },
            arrows: {
                up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
                forward: 'PageUp', backward: 'PageDown', shoot: ' ', reset: 'r', config: 'c'
            }
        };

        if (presets[preset]) {
            gameSettings.controls.keyMapping = { ...presets[preset] };
            this.updateKeyInputs();
            this.updateKeyDisplays();
        }
    }

    updateKeyInputs() {
        Object.keys(gameSettings.controls.keyMapping).forEach(action => {
            const button = document.querySelector(`[data-action="${action}"]`);
            if (button) {
                button.textContent = this.getKeyDisplay(gameSettings.controls.keyMapping[action]);
            }
        });
    }

    updateKeyDisplays() {
        // ゲーム画面のキー表示を更新
        const keyElements = {
            keyUp: gameSettings.controls.keyMapping.up,
            keyDown: gameSettings.controls.keyMapping.down,
            keyLeft: gameSettings.controls.keyMapping.left,
            keyRight: gameSettings.controls.keyMapping.right,
            keyForward: gameSettings.controls.keyMapping.forward,
            keyBackward: gameSettings.controls.keyMapping.backward,
            keyShoot: gameSettings.controls.keyMapping.shoot,
            keyReset: gameSettings.controls.keyMapping.reset,
            keyConfig: gameSettings.controls.keyMapping.config
        };

        Object.keys(keyElements).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = this.getKeyDisplay(keyElements[elementId]);
            }
        });
    }

    setColor(target, color) {
        gameSettings.display[target + 'Color'] = color;
        
        // アクティブ状態の更新
        document.querySelectorAll(`[data-target="${target}"]`).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        
        this.applyDisplaySettings();
    }

    applyGameSettings() {
        const diff = gameSettings.gameplay.difficulties[gameSettings.gameplay.difficulty];
        gameConfig.player.maxHp = diff.playerHp;
        gameConfig.dragon.maxHp = diff.dragonHp;
        
        // 現在のゲームにも適用（リセット時）
        if (gameState === 'playing') {
            gameConfig.player.hp = Math.min(gameConfig.player.hp, gameConfig.player.maxHp);
            gameConfig.dragon.hp = Math.min(gameConfig.dragon.hp, gameConfig.dragon.maxHp);
        }
        
        gameConfig.player.speed = gameSettings.gameplay.playerSpeed;
    }

    applyDisplaySettings() {
        // UI要素の表示/非表示
        const hpBars = document.querySelector('.hp-bars');
        const scoreElement = document.querySelector('.score');
        const altitudeContainer = document.getElementById('altitudeContainer');
        const gameControls = document.getElementById('gameControls');

        if (hpBars) hpBars.style.display = gameSettings.display.showHP ? 'grid' : 'none';
        if (scoreElement) scoreElement.style.display = gameSettings.display.showScore ? 'flex' : 'none';
        if (altitudeContainer) altitudeContainer.style.display = gameSettings.display.showAltitude ? 'block' : 'none';
        if (gameControls) gameControls.style.display = gameSettings.display.showControls ? 'block' : 'none';
    }

    updateUI() {
        // 設定値を UI に反映
        document.getElementById('difficultySelect').value = gameSettings.gameplay.difficulty;
        document.getElementById('speedSlider').value = gameSettings.gameplay.playerSpeed;
        document.getElementById('speedValue').textContent = gameSettings.gameplay.playerSpeed;
        document.getElementById('dragonAISelect').value = gameSettings.gameplay.dragonAI;
        document.getElementById('volumeSlider').value = gameSettings.audio.volume;
        document.getElementById('volumeValue').textContent = gameSettings.audio.volume;

        // チェックボックス
        document.getElementById('showHPCheckbox').checked = gameSettings.display.showHP;
        document.getElementById('showAltitudeCheckbox').checked = gameSettings.display.showAltitude;
        document.getElementById('showScoreCheckbox').checked = gameSettings.display.showScore;
        document.getElementById('showControlsCheckbox').checked = gameSettings.display.showControls;
        document.getElementById('attackSoundCheckbox').checked = gameSettings.audio.attackSound;
        document.getElementById('damageSoundCheckbox').checked = gameSettings.audio.damageSound;
        document.getElementById('moveSoundCheckbox').checked = gameSettings.audio.moveSound;

        // キー入力ボタン
        this.updateKeyInputs();
        this.updateKeyDisplays();

        // カラーボタン
        document.querySelectorAll('.color-btn').forEach(btn => {
            const target = btn.dataset.target;
            const color = btn.dataset.color;
            btn.classList.toggle('active', gameSettings.display[target + 'Color'] === color);
        });

        this.applyDisplaySettings();
    }
}

// 3D数学関数
function project3D(x, y, z) {
    const distance = gameConfig.camera.distance;
    const scale = distance / (distance + z);
    return {
        x: x * scale + canvas.width / 2,
        y: -y * scale + canvas.height / 2
    };
}

function rotateX(vertices, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return vertices.map(v => ({
        x: v.x,
        y: v.y * cos - v.z * sin,
        z: v.y * sin + v.z * cos
    }));
}

function rotateY(vertices, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return vertices.map(v => ({
        x: v.x * cos + v.z * sin,
        y: v.y,
        z: -v.x * sin + v.z * cos
    }));
}

function rotateZ(vertices, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return vertices.map(v => ({
        x: v.x * cos - v.y * sin,
        y: v.x * sin + v.y * cos,
        z: v.z
    }));
}

function translateVertices(vertices, translation) {
    return vertices.map(v => ({
        x: v.x + translation.x,
        y: v.y + translation.y,
        z: v.z + translation.z
    }));
}

function distance3D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clampPosition(position) {
    position.x = Math.max(gameConfig.boundaries.x.min, Math.min(gameConfig.boundaries.x.max, position.x));
    position.y = Math.max(gameConfig.boundaries.y.min, Math.min(gameConfig.boundaries.y.max, position.y));
    position.z = Math.max(gameConfig.boundaries.z.min, Math.min(gameConfig.boundaries.z.max, position.z));
}

// 描画関数
function drawWireframe(vertices, edges, color = '#00ff00') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    const edgesWithZ = edges.map(edge => ({
        edge: edge,
        avgZ: (vertices[edge[0]].z + vertices[edge[1]].z) / 2
    }));
    
    edgesWithZ.sort((a, b) => a.avgZ - b.avgZ);
    
    edgesWithZ.forEach(({ edge, avgZ }) => {
        const start = project3D(vertices[edge[0]].x, vertices[edge[0]].y, vertices[edge[0]].z);
        const end = project3D(vertices[edge[1]].x, vertices[edge[1]].y, vertices[edge[1]].z);
        
        const alpha = Math.max(0.3, Math.min(1, (200 + avgZ) / 300));
        const lineWidth = Math.max(1, Math.min(3, (200 + avgZ) / 150));
        
        ctx.lineWidth = lineWidth;
        const hexColor = color.slice(1);
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });
}

function drawPlayer() {
    let vertices = [...models.player.vertices];
    
    // 動的回転
    if (keys[gameSettings.controls.keyMapping.left]) gameConfig.player.rotation.z = Math.min(0.3, gameConfig.player.rotation.z + 0.05);
    else if (keys[gameSettings.controls.keyMapping.right]) gameConfig.player.rotation.z = Math.max(-0.3, gameConfig.player.rotation.z - 0.05);
    else gameConfig.player.rotation.z *= 0.9;
    
    if (keys[gameSettings.controls.keyMapping.up]) gameConfig.player.rotation.x = Math.min(0.2, gameConfig.player.rotation.x + 0.03);
    else if (keys[gameSettings.controls.keyMapping.down]) gameConfig.player.rotation.x = Math.max(-0.2, gameConfig.player.rotation.x - 0.03);
    else gameConfig.player.rotation.x *= 0.9;
    
    vertices = rotateX(vertices, gameConfig.player.rotation.x);
    vertices = rotateY(vertices, gameConfig.player.rotation.y);
    vertices = rotateZ(vertices, gameConfig.player.rotation.z);
    vertices = translateVertices(vertices, gameConfig.player.position);
    
    const playerColor = gameSettings.display.colors.player[gameSettings.display.playerColor];
    drawWireframe(vertices, models.player.edges, playerColor);
}

function drawDragon() {
    let vertices = [...models.dragon.vertices];
    
    gameConfig.dragon.rotation.y += 0.008;
    gameConfig.dragon.rotation.x = Math.sin(dragonMovePattern * 0.5) * 0.15;
    gameConfig.dragon.rotation.z = Math.sin(dragonMovePattern * 0.3) * 0.1;
    
    vertices = rotateX(vertices, gameConfig.dragon.rotation.x);
    vertices = rotateY(vertices, gameConfig.dragon.rotation.y);
    vertices = rotateZ(vertices, gameConfig.dragon.rotation.z);
    vertices = translateVertices(vertices, gameConfig.dragon.position);
    
    let dragonColor = gameSettings.display.colors.dragon[gameSettings.display.dragonColor];
    if (dragonBehaviorState === 'attack') dragonColor = '#ff8800';
    else if (dragonBehaviorState === 'retreat') dragonColor = '#ff6666';
    
    drawWireframe(vertices, models.dragon.edges, dragonColor);
}

function drawProjectiles() {
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#ffff88';
    ctx.lineWidth = 2;
    
    projectiles.forEach(proj => {
        const pos = project3D(proj.x, proj.y, proj.z);
        const alpha = Math.max(0.3, Math.min(1, (200 + proj.z) / 300));
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const trailEnd = project3D(proj.x, proj.y, proj.z - 15);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(trailEnd.x, trailEnd.y);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    });
    
    dragonProjectiles.forEach(proj => {
        const pos = project3D(proj.x, proj.y, proj.z);
        const alpha = Math.max(0.3, Math.min(1, (200 + proj.z) / 300));
        
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    });
}

// ゲームロジック
function handleInput() {
    if (gameState !== 'playing') return;
    
    const speed = gameSettings.gameplay.playerSpeed;
    const verticalSpeed = speed * 0.8;
    
    // 新しいキーマッピングシステム
    if (keys[gameSettings.controls.keyMapping.up]) {
        gameConfig.player.position.y += verticalSpeed;
    }
    if (keys[gameSettings.controls.keyMapping.down]) {
        gameConfig.player.position.y -= verticalSpeed;
    }
    if (keys[gameSettings.controls.keyMapping.left]) {
        gameConfig.player.position.x -= speed;
    }
    if (keys[gameSettings.controls.keyMapping.right]) {
        gameConfig.player.position.x += speed;
    }
    if (keys[gameSettings.controls.keyMapping.forward]) {
        gameConfig.player.position.z += speed;
    }
    if (keys[gameSettings.controls.keyMapping.backward]) {
        gameConfig.player.position.z -= speed;
    }
    
    clampPosition(gameConfig.player.position);
    
    if (keys[gameSettings.controls.keyMapping.shoot] && Date.now() - lastShot > 150) {
        shoot();
        lastShot = Date.now();
    }
}

function shoot() {
    const direction = { x: 0, y: 0, z: 1 };
    
    projectiles.push({
        x: gameConfig.player.position.x,
        y: gameConfig.player.position.y,
        z: gameConfig.player.position.z + 20,
        vx: direction.x * 8,
        vy: direction.y * 8,
        vz: direction.z * 8,
        speed: 8
    });
}

function dragonShoot() {
    if (Date.now() - dragonLastShot < 2500) return;
    
    const dx = gameConfig.player.position.x - gameConfig.dragon.position.x;
    const dy = gameConfig.player.position.y - gameConfig.dragon.position.y;
    const dz = gameConfig.player.position.z - gameConfig.dragon.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const leadTime = distance / 3;
    const predictedPlayerPos = {
        x: gameConfig.player.position.x + (keys[gameSettings.controls.keyMapping.right] ? 2 : keys[gameSettings.controls.keyMapping.left] ? -2 : 0) * leadTime,
        y: gameConfig.player.position.y + (keys[gameSettings.controls.keyMapping.up] ? 1.6 : keys[gameSettings.controls.keyMapping.down] ? -1.6 : 0) * leadTime,
        z: gameConfig.player.position.z + (keys[gameSettings.controls.keyMapping.forward] ? 2 : keys[gameSettings.controls.keyMapping.backward] ? -2 : 0) * leadTime
    };
    
    const pdx = predictedPlayerPos.x - gameConfig.dragon.position.x;
    const pdy = predictedPlayerPos.y - gameConfig.dragon.position.y;
    const pdz = predictedPlayerPos.z - gameConfig.dragon.position.z;
    const predictedDistance = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
    
    dragonProjectiles.push({
        x: gameConfig.dragon.position.x,
        y: gameConfig.dragon.position.y,
        z: gameConfig.dragon.position.z,
        vx: (pdx / predictedDistance) * 3,
        vy: (pdy / predictedDistance) * 3,
        vz: (pdz / predictedDistance) * 3
    });
    
    dragonLastShot = Date.now();
}

function updateDragon() {
    if (gameState !== 'playing') return;
    
    const playerPos = gameConfig.player.position;
    const dragonPos = gameConfig.dragon.position;
    const distanceToPlayer = distance3D(playerPos, dragonPos);
    
    dragonMovePattern += 0.02;
    dragonBehaviorTimer += 1;
    
    // AI強度による調整
    let aiMultiplier = 1;
    if (gameSettings.gameplay.dragonAI === 'weak') aiMultiplier = 0.7;
    else if (gameSettings.gameplay.dragonAI === 'strong') aiMultiplier = 1.4;
    
    switch (dragonBehaviorState) {
        case 'patrol':
            dragonPos.x += Math.sin(dragonMovePattern) * 1.2 * aiMultiplier;
            dragonPos.y += Math.cos(dragonMovePattern * 0.7) * 0.8 * aiMultiplier;
            dragonPos.z += Math.sin(dragonMovePattern * 0.5) * 0.6 * aiMultiplier;
            
            if (distanceToPlayer < 80) {
                dragonBehaviorState = 'chase';
                dragonBehaviorTimer = 0;
            }
            break;
            
        case 'chase':
            const chaseSpeed = gameConfig.dragon.speed * 0.5 * aiMultiplier;
            const dx = playerPos.x - dragonPos.x;
            const dy = playerPos.y - dragonPos.y;
            const dz = playerPos.z - dragonPos.z;
            
            if (distanceToPlayer > 20) {
                dragonPos.x += (dx / distanceToPlayer) * chaseSpeed;
                dragonPos.y += (dy / distanceToPlayer) * chaseSpeed;
                dragonPos.z += (dz / distanceToPlayer) * chaseSpeed;
            }
            
            if (Math.abs(dy) > 30) {
                dragonPos.y += (dy > 0 ? 1 : -1) * chaseSpeed * 0.8;
            }
            
            if (distanceToPlayer < 50) {
                dragonBehaviorState = 'attack';
                dragonBehaviorTimer = 0;
            } else if (dragonBehaviorTimer > 300) {
                dragonBehaviorState = 'patrol';
                dragonBehaviorTimer = 0;
            }
            break;
            
        case 'attack':
            if (dragonBehaviorTimer < 60) {
                dragonPos.y += 1.5 * aiMultiplier;
                dragonPos.z -= 0.5 * aiMultiplier;
            } else if (dragonBehaviorTimer < 120) {
                const attackSpeed = gameConfig.dragon.speed * 1.5 * aiMultiplier;
                const dx = playerPos.x - dragonPos.x;
                const dy = playerPos.y - dragonPos.y;
                const dz = playerPos.z - dragonPos.z;
                
                dragonPos.x += (dx / distanceToPlayer) * attackSpeed;
                dragonPos.y += (dy / distanceToPlayer) * attackSpeed;
                dragonPos.z += (dz / distanceToPlayer) * attackSpeed;
                
                if (Math.random() < 0.1 * aiMultiplier) {
                    dragonShoot();
                }
            } else {
                dragonBehaviorState = 'retreat';
                dragonBehaviorTimer = 0;
            }
            break;
            
        case 'retreat':
            dragonPos.x += Math.sin(dragonMovePattern * 2) * 2 * aiMultiplier;
            dragonPos.y += Math.cos(dragonMovePattern * 1.5) * 1.5 * aiMultiplier;
            dragonPos.z -= 1 * aiMultiplier;
            
            if (dragonBehaviorTimer > 90) {
                dragonBehaviorState = 'patrol';
                dragonBehaviorTimer = 0;
            }
            break;
    }
    
    clampPosition(dragonPos);
    
    if (distanceToPlayer < 120 && Math.random() < 0.005 * aiMultiplier) {
        dragonShoot();
    }
}

function updateProjectiles() {
    projectiles = projectiles.filter(proj => {
        proj.x += proj.vx || 0;
        proj.y += proj.vy || 0;
        proj.z += proj.vz || proj.speed;
        return Math.abs(proj.x) < 200 && Math.abs(proj.y) < 200 && proj.z < 300;
    });
    
    dragonProjectiles = dragonProjectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.z += proj.vz;
        
        const dist = distance3D(proj, gameConfig.camera.position);
        return dist < 500;
    });
}

function checkCollisions() {
    if (gameState !== 'playing') return;
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        const dist = distance3D(proj, gameConfig.dragon.position);
        if (dist < 25) {
            gameConfig.dragon.hp = Math.max(0, gameConfig.dragon.hp - 12);
            score += 15;
            projectiles.splice(i, 1);
            
            if (gameConfig.dragon.hp <= 0) {
                gameState = 'victory';
                score += 200;
                showGameOver(true);
                return;
            }
        }
    }
    
    for (let i = dragonProjectiles.length - 1; i >= 0; i--) {
        const proj = dragonProjectiles[i];
        const dist = distance3D(proj, gameConfig.player.position);
        if (dist < 18) {
            gameConfig.player.hp = Math.max(0, gameConfig.player.hp - 15);
            dragonProjectiles.splice(i, 1);
            
            if (gameConfig.player.hp <= 0) {
                gameState = 'gameOver';
                showGameOver(false);
                return;
            }
        }
    }
    
    const playerDragonDist = distance3D(gameConfig.player.position, gameConfig.dragon.position);
    if (playerDragonDist < 35) {
        if (!gameConfig.collisionCooldown || Date.now() - gameConfig.collisionCooldown > 1000) {
            gameConfig.player.hp = Math.max(0, gameConfig.player.hp - 8);
            gameConfig.collisionCooldown = Date.now();
            
            if (gameConfig.player.hp <= 0) {
                gameState = 'gameOver';
                showGameOver(false);
            }
        }
    }
}

function updateUI() {
    const playerHpPercent = Math.max(0, (gameConfig.player.hp / gameConfig.player.maxHp) * 100);
    const dragonHpPercent = Math.max(0, (gameConfig.dragon.hp / gameConfig.dragon.maxHp) * 100);
    
    document.getElementById('playerHp').style.width = playerHpPercent + '%';
    document.getElementById('dragonHp').style.width = dragonHpPercent + '%';
    
    document.getElementById('playerHpText').textContent = 
        `${Math.max(0, gameConfig.player.hp)}/${gameConfig.player.maxHp}`;
    document.getElementById('dragonHpText').textContent = 
        `${Math.max(0, gameConfig.dragon.hp)}/${gameConfig.dragon.maxHp}`;
    
    document.getElementById('score').textContent = score;
    
    const altitude = Math.round(gameConfig.player.position.y);
    const altitudeElement = document.getElementById('altitude');
    if (altitudeElement) {
        altitudeElement.textContent = altitude;
    }
}

function showGameOver(victory) {
    const overlay = document.getElementById('gameOverlay');
    const title = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    
    if (victory) {
        title.textContent = '勝利！';
        message.textContent = `3D空間を制覇しました！最終スコア: ${score}点`;
        title.style.color = '#00ff88';
    } else {
        title.textContent = 'ゲームオーバー';
        message.textContent = `ドラゴンに敗北しました...最終スコア: ${score}点`;
        title.style.color = '#ff4444';
    }
    
    overlay.classList.remove('hidden');
}

function resetGame() {
    gameState = 'playing';
    
    // 設定に基づいてゲームを初期化
    configManager.applyGameSettings();
    
    gameConfig.player.hp = gameConfig.player.maxHp;
    gameConfig.dragon.hp = gameConfig.dragon.maxHp;
    gameConfig.player.position = { x: 0, y: 0, z: -50 };
    gameConfig.dragon.position = { x: 30, y: 20, z: 50 };
    gameConfig.player.rotation = { x: 0, y: 0, z: 0 };
    gameConfig.dragon.rotation = { x: 0, y: 0, z: 0 };
    projectiles = [];
    dragonProjectiles = [];
    score = 0;
    dragonMovePattern = 0;
    lastShot = 0;
    dragonLastShot = 0;
    gameConfig.collisionCooldown = 0;
    dragonBehaviorState = 'patrol';
    dragonBehaviorTimer = 0;
    
    document.getElementById('gameOverlay').classList.add('hidden');
}

function gameLoop() {
    // 背景色の設定
    const bgColor = gameSettings.display.colors.background[gameSettings.display.backgroundColor];
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    handleInput();
    updateDragon();
    updateProjectiles();
    checkCollisions();
    drawPlayer();
    drawDragon();
    drawProjectiles();
    drawStarField();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function drawGrid() {
    ctx.strokeStyle = '#113344';
    ctx.lineWidth = 1;
    
    for (let i = -200; i <= 200; i += 40) {
        const start = project3D(-200, -60, i);
        const end = project3D(200, -60, i);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        const start2 = project3D(i, -60, -200);
        const end2 = project3D(i, -60, 200);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
        
        if (i % 80 === 0) {
            ctx.strokeStyle = '#224466';
            const vStart = project3D(i, -60, 0);
            const vEnd = project3D(i, 60, 0);
            ctx.beginPath();
            ctx.moveTo(vStart.x, vStart.y);
            ctx.lineTo(vEnd.x, vEnd.y);
            ctx.stroke();
            ctx.strokeStyle = '#113344';
        }
    }
}

function drawStarField() {
    ctx.fillStyle = '#ffffff';
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 0.1 + time * 0.1) * 400 + canvas.width / 2) % canvas.width;
        const y = (Math.cos(i * 0.07 + time * 0.08) * 300 + canvas.height / 2) % canvas.height;
        const size = Math.sin(i * 0.05 + time) * 0.8 + 1;
        const alpha = Math.sin(i * 0.03 + time * 0.5) * 0.3 + 0.7;
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// コンフィグ関連の関数
function openConfig() {
    document.getElementById('configModal').classList.remove('hidden');
}

function closeConfig() {
    document.getElementById('configModal').classList.add('hidden');
    if (configManager && configManager.keyCapturing) {
        configManager.endKeyCapture();
    }
}

function saveConfig() {
    configManager.applyGameSettings();
    configManager.applyDisplaySettings();
    closeConfig();
}

function resetToDefaults() {
    // デフォルト設定に戻す
    gameSettings = {
        controls: {
            keyMapping: {
                up: 'w', down: 's', left: 'a', right: 'd',
                forward: 'q', backward: 'e', shoot: ' ', reset: 'r', config: 'c'
            },
            sensitivity: 1.0
        },
        gameplay: {
            difficulty: 'normal',
            playerSpeed: 2.0,
            dragonAI: 'normal',
            difficulties: {
                easy: { playerHp: 150, dragonHp: 150 },
                normal: { playerHp: 100, dragonHp: 200 },
                hard: { playerHp: 75, dragonHp: 250 }
            }
        },
        display: {
            playerColor: 'green',
            dragonColor: 'red', 
            backgroundColor: 'black',
            showHP: true,
            showAltitude: true,
            showScore: true,
            showControls: true,
            colors: {
                player: { green: '#00ffff', blue: '#0088ff', white: '#ffffff', yellow: '#ffff00' },
                dragon: { red: '#ff4444', orange: '#ff8800', purple: '#8844ff', pink: '#ff44aa' },
                background: { black: '#000022', darkblue: '#001122', darkgreen: '#002211' }
            }
        },
        audio: {
            volume: 50,
            attackSound: true,
            damageSound: true,
            moveSound: false
        }
    };
    
    configManager.updateUI();
    configManager.applyGameSettings();
    configManager.applyDisplaySettings();
}

// イベントリスナー
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === gameSettings.controls.keyMapping.reset) {
        resetGame();
        e.preventDefault();
    }
    
    if (e.key === gameSettings.controls.keyMapping.config || e.key === 'Escape') {
        if (document.getElementById('configModal').classList.contains('hidden')) {
            openConfig();
        } else {
            closeConfig();
        }
        e.preventDefault();
    }
    
    // ゲーム中のキー操作のデフォルト動作を防ぐ
    const gameKeys = Object.values(gameSettings.controls.keyMapping);
    if (gameKeys.includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('click', () => {
    if (canvas) {
        canvas.focus();
    }
});

// ConfigManager インスタンス
let configManager;

// 初期化
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
    
    // ConfigManager の初期化
    configManager = new ConfigManager();
    
    updateUI();
    gameLoop();
}

document.addEventListener('DOMContentLoaded', init);