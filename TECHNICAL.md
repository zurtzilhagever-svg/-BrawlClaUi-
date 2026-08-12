# 📖 תיעוד טכני - CouchBrawl

## 🏗️ ארכיטקטורה המערכת

```
┌─────────────────────────────────────────────────────────────┐
│                    CouchBrawl Game System                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Client-Side (Frontend)                            │
│  ┌──────────────────┐          ┌──────────────────────┐   │
│  │   TV/PC Display  │          │   Mobile Controller  │   │
│  │   (host.js)      │◄────────→│   (controller.js)    │   │
│  │   - Canvas Render│    WS    │   - Touch Input      │   │
│  │   - Game Physics │  Socket  │   - Haptic Feedback  │   │
│  │   - Animations   │   .io    │   - Gamepad API      │   │
│  └──────────────────┘          └──────────────────────┘   │
│                                                             │
│  Layer 2: Real-time Bridge (Node.js)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          server.js (Express + Socket.io)            │   │
│  │  - Room Management      - Player Sync               │   │
│  │  - Input Distribution   - State Orchestration       │   │
│  │  - Connection Handling  - Reconnect Logic           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 3: Shared Utilities                                 │
│  ┌──────────────────┐          ┌──────────────────────┐   │
│  │   gamepad.js     │          │ qr-generator.js      │   │
│  │   - Gamepad API  │          │ - QR Code Creation   │   │
│  │   - Button Map   │          │ - URL Encoding       │   │
│  │   - Deadzone     │          │ - Export Functions   │   │
│  └──────────────────┘          └──────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 תקשורת Socket.io

### Connection Flow

```
┌─────────────┐                          ┌─────────────┐
│   Client    │                          │   Server    │
│   (TV/PC)   │                          │   (Node.js) │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │────────── io.connect() ─────────────→  │
       │                                        │
       │ ←────── connection event ────────────  │
       │                                        │
       │────────── hostJoin() ────────────────→ │
       │                                        │
       │ ←─── callback(roomCode, players) ─────│
       │                                        │
       │                                        │
┌──────┴──────┐                          ┌──────┴──────┐
│   Client    │                          │   Server    │
│  (Mobile)   │                          │  (Node.js)  │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │────────── io.connect() ─────────────→  │
       │                                        │
       │ ←────── connection event ────────────  │
       │                                        │
       │────────── playerJoin(code) ─────────→  │
       │                                        │
       │ ←─── callback(playerId, color) ──────│
       │                                        │
       │────────── playerInput(data) ────────→  │ (60Hz)
       │                                        │
       │ ←────── gameStateUpdate(data) ────────│
       │                                        │
       │ ← playerListUpdated(players) ─────────│
       │                                        │
```

### Event Types

| Event | Direction | Frequency | Payload |
|-------|-----------|-----------|---------|
| `hostJoin` | TV → Server | Once | `{roomCode, players}` |
| `playerJoin` | Mobile → Server | Once | `{roomCode, name}` |
| `playerInput` | Mobile → Server | 60Hz | `{x, y, isAttacking, skill}` |
| `playerListUpdated` | Server → All | On Change | `{players[], totalPlayers}` |
| `gameStateUpdate` | Server → All | 60Hz | `{players[]}` |
| `playerReconnect` | Mobile → Server | On Reconnect | `{roomCode, playerId}` |

---

## 🎮 Input Handling Pipeline

### Mobile Input Flow

```
Touch/Gamepad Events
        ↓
    [Joystick Handler]
        ↓
[Deadzone Filter]
        ↓
[Normalize to [-1, 1]]
        ↓
[Update Input State]
        ↓
[Send to Server @ 60Hz]
        ↓
[Server Updates Player Position]
        ↓
[Broadcast to All Clients]
        ↓
[Render on TV Screen]
```

### Code Example:
```javascript
// Mobile: Joystick Input
function handleJoystickMove(touch) {
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    // Normalize to radius
    const distance = Math.sqrt(dx*dx + dy*dy);
    if (distance > radius) {
        dx = (dx/distance) * radius;
        dy = (dy/distance) * radius;
    }
    
    // Update state
    inputState.x = dx / radius;  // [-1, 1]
    inputState.y = dy / radius;  // [-1, 1]
}

// Send to Server (60Hz loop)
setInterval(() => {
    socket.emit('playerInput', inputState);
}, 1000/60);
```

---

## 🖥️ Server-Side Logic

### Room Management

```javascript
rooms: Map<string, Room>
{
    "ABCD": {
        code: "ABCD",
        hostId: "socket-id-123",
        players: Map<string, Player> {
            "socket-id-456": {
                id: "socket-id-456",
                name: "שחקן 1",
                color: "#FF6B6B",
                position: { x: 100, y: 150 },
                input: { x: 0.5, y: 0.3, isAttacking: false }
            }
        },
        gameState: {
            isRunning: true,
            startTime: 1234567890
        }
    }
}
```

### Player Position Update

```javascript
// Server: Process Input
socket.on('playerInput', (inputData) => {
    const player = room.players.get(socket.id);
    
    // Update input
    player.input = normalizeInput(inputData);
    
    // Physics simulation
    player.position.x += player.input.x * SPEED;
    player.position.y += player.input.y * SPEED;
    
    // Boundary check
    player.position.x = clamp(player.position.x, 0, ARENA_WIDTH);
    player.position.y = clamp(player.position.y, 0, ARENA_HEIGHT);
    
    // Broadcast to all clients
    io.to(roomCode).emit('gameStateUpdate', {
        players: Array.from(room.players.values())
    });
});
```

---

## 📱 Client-Side Rendering

### TV/PC Screen - Canvas Rendering

```javascript
// Animation Loop (60FPS)
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(42, 74, 106, 0.1)';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    
    // Draw background grid
    drawBackgroundGrid();
    
    // Draw all players
    Object.values(players).forEach(player => {
        // Draw character
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes (direction indicator)
        if (player.input.x !== 0 || player.input.y !== 0) {
            const angle = Math.atan2(player.input.y, player.input.x);
            // ... draw eyes
        }
        
        // Draw attack indicator
        if (player.input.isAttacking) {
            ctx.strokeStyle = 'rgba(255, 107, 107, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.position.x, player.position.y, PLAYER_RADIUS + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    // Draw particles
    drawParticles();
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}
```

---

## 🎯 Gamepad API Integration

### Gamepad Polling

```javascript
// Detect Connected Gamepads
window.addEventListener('gamepadconnected', (e) => {
    console.log(`Gamepad connected: ${e.gamepad.id}`);
});

// Poll Input (60Hz)
function pollGamepads() {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;
        
        // Left Stick
        inputState.x = gamepad.axes[0];  // X
        inputState.y = gamepad.axes[1];  // Y
        
        // Buttons
        inputState.isAttacking = gamepad.buttons[0].pressed;  // A
        inputState.skill = gamepad.buttons[2].pressed;        // X
    }
}

setInterval(pollGamepads, 16);  // ~60Hz
```

### Button Mapping

```
Standard Gamepad Layout:

    Y (3)        LB (4)    RB (5)
    
X (2)    A (0)   LT      RT
         B (1)
         
    Select      Start     Guide
    (8)         (9)       (16)
    
LS-Press (10)   RS-Press (11)
```

---

## 🔄 Reconnection Logic

### Timeout & Recovery

```
┌─────────────────────────────────────┐
│  Player Disconnects                 │
│  (Network Issue / Refresh)          │
└────────────┬────────────────────────┘
             │
             ↓
    ┌─────────────────────┐
    │ Start 30s Timeout   │
    │ (Keep Player Slot)  │
    └────────┬────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌─────────┐    ┌──────────────┐
│Reconnect│    │Timeout Fired │
│ in Time │    │ (Remove Slot)│
└────┬────┘    └──────────────┘
     │
     ↓
┌──────────────────┐
│ playerReconnect  │
│ Event Sent       │
└────┬─────────────┘
     │
     ↓
┌──────────────────┐
│ Socket ID Update │
│ Resume Game      │
└──────────────────┘
```

---

## 🎨 Animation Systems

### Particle System (Attack Effect)

```javascript
// Create particles when attacking
function createAttackParticles(position, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;  // 8 directions
        
        PARTICLE_SYSTEM.push({
            x: position.x,
            y: position.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            color: color,
            life: 1.0,
            maxLife: 30
        });
    }
}

// Update particles each frame
function updateParticles() {
    PARTICLE_SYSTEM.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;  // Gravity
        p.life -= 1/30;
        
        if (p.life <= 0) {
            PARTICLE_SYSTEM.splice(i, 1);
        }
    });
}
```

---

## 🔊 Haptic Feedback

### Vibration API

```javascript
// Vibrate on button press
if (navigator.vibrate) {
    // Single vibration: 15ms
    navigator.vibrate(15);
    
    // Pattern: [vibrate, pause, vibrate]
    navigator.vibrate([100, 50, 100]);
}

// Check support
const hasVibration = 'vibrate' in navigator;
```

---

## 📊 Performance Metrics

### Network Optimization

| Metric | Target | Actual |
|--------|--------|--------|
| Latency | <100ms | ~50-80ms (LAN) |
| Input Rate | 60Hz | 60Hz |
| Update Rate | 60Hz | 60Hz |
| Payload Size | <100 bytes | ~50 bytes |
| Frame Rate | 60FPS | 60FPS |

### Bandwidth Usage

```
Mobile to Server:
- playerInput: 50 bytes × 60/sec = 3000 bytes/sec = 24 kbps

Server to TV:
- gameStateUpdate: 200 bytes × 60/sec = 12000 bytes/sec = 96 kbps

Total: ~120 kbps (Very Low!)
```

---

## 🐛 Debugging & Profiling

### Browser DevTools

```javascript
// Enable detailed logging
// In console:
localStorage.debug = '*';

// Monitor network traffic
// DevTools > Network tab > WS (WebSocket)

// Check performance
// DevTools > Performance tab > Record
```

### Server-Side Logging

```javascript
console.log('🎬 Event:', eventName);
console.log('📊 Players:', Object.keys(room.players).length);
console.log('📤 Broadcast:', roomCode, data);
```

---

## 🚀 Optimization Tips

### Client-Side
1. Use RequestAnimationFrame instead of setInterval for rendering
2. Batch Canvas operations (beginPath, stroke, fill)
3. Apply deadzone filtering early in input pipeline
4. Minimize JSON serialization

### Server-Side
1. Use Map instead of Object for O(1) lookups
2. Batch updates before emitting
3. Implement input throttling
4. Cache frequently accessed data

### Network
1. Compress payloads
2. Use binary encoding for real-time data
3. Delta compression (only send what changed)
4. Adaptive bitrate

---

## 📚 References

- [Socket.io Documentation](https://socket.io/)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**End of Technical Documentation**
