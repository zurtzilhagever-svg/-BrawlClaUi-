# 🎮 BrawlClaUi - Multiplayer Party Game

משחק מרובה משתתפים בסגנון **Brawl Stars** עם ארכיטקטורה מודרנית מבוססת רשת. המשחק מורכב משלוש שכבות: מסך טלוויזיה (Host Display), בקר נייד (Mobile Controller), ושרת Node.js בזמן אמת.

---

## 🏗️ ארכיטקטורה

```
┌─────────────────────────────────────────────────┐
│          COUCHBRAWL ARCHITECTURE                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌──────────────────┐ │
│  │   TV/PC      │         │   Mobile Phone   │ │
│  │   (Host)     │◄────────│   (Player)       │ │
│  │              │  WebRTC │                  │ │
│  └──────────────┘         └──────────────────┘ │
│         ▲                           ▲           │
│         │                           │           │
│         │    Socket.io Bridge       │           │
│         │   (Real-time Sync)        │           │
│         │                           │           │
│  ┌──────────────────────────────────────────┐  │
│  │     Node.js + Express + Socket.io        │  │
│  │     (Game Server & Room Manager)         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 התקנה והפעלה

### 1️⃣ דרישות מוקדמות
- **Node.js** (גרסה 14 ומעלה)
- **npm** או **yarn**
- דפדפן מודרני עם תמיכה ב-WebSockets

### 2️⃣ התקנת תלויות
```bash
npm install
```

### 3️⃣ הפעלת השרת
```bash
npm start
```

השרת יהיה זמין ב: **http://localhost:3000**

---

## 🚀 שימוש

### 📺 מסך הטלוויזיה (Host)
1. פתח **http://localhost:3000/tv** במחשב/טלוויזיה
2. קוד חדר יינוצר אוטומטית (למשל: `ABCD`)
3. שחקנים יכולים להצטרף באמצעות הקוד או סריקת QR
4. הזירה תיציג את כל השחקנים בזמן אמת

### 📱 שלט המוביל (Player)
1. פתח **http://localhost:3000/mobile** בטלפון
2. הזן את קוד החדר (למשל: `ABCD`)
3. הזן את שמך
4. לחץ על "הצטרף למשחק"
5. שלוט בדמותך באמצעות:
   - **ג'ויסטיק שמאלי** - תנועה (Left Stick)
   - **כפתור התקפה** - התקפה (Red Button)
   - **כפתור יכולת** - יכולת מיוחדת (Cyan Button)

---

## 🛠️ מבנה הקבצים

```
brawlclaui/
├── package.json                      # תלויות ואינפורמציה פרויקט
├── server.js                         # שרת Node.js + Socket.io
├── public/
│   ├── index.html                    # דף ראשי - בחירת מצב
│   │
│   ├── tv/
│   │   ├── index.html               # ממשק מסך הטלוויזיה
│   │   ├── style.css                # עיצוב מסך הטלוויזיה
│   │   └── host.js                  # לוגיקה משחק (TV Side)
│   │
│   ├── mobile/
│   │   ├── index.html               # ממשק שלט המוביל
│   │   ├── style.css                # עיצוב שלט המוביל
│   │   └── controller.js            # לוגיקה שלט (Mobile Side)
│   │
│   └── shared/
│       ├── gamepad.js               # תמיכה בשלטים חומרה (Gamepad API)
│       └── qr-generator.js          # יצירת QR Codes דינמיים
```

---

## 📡 תקשורת Socket.io

### Events ממסך הטלוויזיה (Host)

#### `hostJoin()`
**תיאור**: בקשת חדר חדש  
**Response**:
```javascript
{
  success: true,
  roomCode: "ABCD",
  players: []
}
```

### Events משלט המוביל (Player)

#### `playerJoin(data, callback)`
**תיאור**: הצטרפות לחדר  
**Data**:
```javascript
{
  roomCode: "ABCD",
  playerName: "שחקן 1"
}
```
**Response**:
```javascript
{
  success: true,
  playerId: "socket-id-xxx",
  color: "#FF6B6B",
  position: { x: 100, y: 150 }
}
```

#### `playerInput(data)`
**תיאור**: שליחת קלט שחקן (60Hz)  
**Data**:
```javascript
{
  x: 0.5,              // [-1, 1] ג'ויסטיק X
  y: 0.3,              // [-1, 1] ג'ויסטיק Y
  isAttacking: false,  // bool התקפה
  skill: false         // bool יכולת
}
```

### Events משותפים

#### `playerListUpdated(data)`
**תיאור**: עדכון רשימת שחקנים  
**Data**:
```javascript
{
  players: [
    {
      id: "socket-id-xxx",
      name: "שחקן 1",
      color: "#FF6B6B",
      position: { x: 100, y: 150 }
    },
    // ...
  ],
  totalPlayers: 2
}
```

#### `gameStateUpdate(data)`
**תיאור**: עדכון מצב משחק  
**Data**:
```javascript
{
  players: [
    {
      id: "socket-id-xxx",
      name: "שחקן 1",
      color: "#FF6B6B",
      position: { x: 100, y: 150 },
      input: { x: 0.5, y: 0.3, isAttacking: false, skill: false }
    },
    // ...
  ]
}
```

---

## 🎮 תמיכה בשלטים חומרה

BrawlClaUi תומך ב-**Gamepad API** עבור שלטים פיזיים:

### שלטים תומכים:
- ✅ Xbox Controllers (Series X/S, Xbox One)
- ✅ PlayStation DualShock 4 / DualSense
- ✅ Nintendo Pro Controller
- ✅ Nintendo Joy-Cons (עם התאמה auto-swap)
- ✅ כל Gamepad תקני (Bluetooth)

### הגדרות Gamepad

ב-`controller.js`:
```javascript
// אתחול Gamepad עם הגדרות מותאמות
GamepadController.init({
    swapAB: false,           // החלף A/B כפתורים
    invertLeftStickY: false, // הפוך Y ג'ויסטיק שמאלי
    deadzone: 0.1            // Deadzone למניעת Drift
});
```

---

## 🔄 ניהול חיבורים וניתוקים

### ניתוק זמני (30 שניות)
כאשר שחקן מתנתק זמנית, השרת שומר את מקומו למשך 30 שניות. אם הוא מתחבר בחזרה בזמן זה, הוא יחזור לחדר.

### מחיקת חדר
חדר נמחק כאשר:
- ה-Host מתנתק
- אין שחקנים במשך מעל 30 שניות

---

## 🎨 עיצוב וממשק

### צבעי Brand
- 🟣 Primary: `#667eea` (סגול)
- 🟣 Secondary: `#764ba2` (סגול כהה)
- 🔴 Accent: `#FF6B6B` (אדום)
- 🔵 Success: `#4ECDC4` (תכלת)

### Responsive Design
- 📺 **TV Mode**: פוטנציאל מלא ל-4K
- 📱 **Mobile Mode**: Landscape & Portrait
- ⌨️ **Keyboard Support**: ניתן לשחק דרך מקלדת

---

## 🔧 פיתוח והרחבה

### הוספת תכונות חדשות

#### 1. תוספת דמות חדשה (Character)
```javascript
// ב-host.js - צייר דמות מותאמת
function drawCustomCharacter(x, y, color, type) {
    // קוד רינדור מותאם
}
```

#### 2. הוספת יכולות (Abilities)
```javascript
// ב-server.js - הוסף לוגיקה יכולות
if (player.input.skill) {
    // לוגיקת יכולת
    createAbilityEffect(player);
}
```

#### 3. הוספת מפות שונות
```javascript
// ב-host.js - הוסף backgrounds שונים
function drawArenaBackground(theme) {
    switch(theme) {
        case 'forest':
            // קוד רינדור יער
            break;
        // ...
    }
}
```

---

## 🐛 Debugging

### Enable Debug Mode
ברור Console של הדפדפן (F12) כדי לראות:
- `console.log()` מהשרת
- `console.log()` מה-Client
- Network Requests

### שימושי בדיקה

**בשרת**:
```javascript
console.log(`🎬 Host התחבר לחדר ${room.code}`);
console.log(`👤 שחקן הצטרף: ${playerName}`);
console.log(`👥 כעת בחדר: ${room.players.size} שחקנים`);
```

**בקלינט**:
```javascript
console.log('🔌 מחובר לשרת:', socket.id);
console.log('👥 רשימת שחקנים עודכנה:', data.players.length);
console.log('⚔️ התקפה פעילה');
```

---

## 📊 Performance

- 🎯 **Network Latency**: <100ms (LAN)
- ⚡ **Input Send Rate**: 60Hz
- 🖼️ **Frame Rate**: 60FPS
- 📦 **Payload Size**: ~50 bytes per update

---

## 🚨 שגיאות נפוצות

### ❌ "חדר לא קיים"
**פתרון**: ודא שה-Host מחובר וקוד החדר נכון

### ❌ "שרת לא מגיב"
**פתרון**: בדוק שהשרת פועל (`npm start`)

### ❌ "QR Code לא מופיע"
**פתרון**: ודא שה-CDN library נטען בהצלחה

### ❌ "ג'ויסטיק לא עובד"
**פתרון**: נסה touch במסך ישירות או Gamepad חומרה

---

## 📝 הערות חשובות

1. **HTTPS למובייל**: אם תרצה להשתמש בהפיקוד בנייד על מכשיר אחר, עשה שימוש ב-HTTPS (Haptic וGPS דורשות זאת)
2. **CORS**: השרת מאפשר כל מקור - שנה זאת בייצור
3. **Authentication**: לא יש אימות מובנה - הוסף אם צריך בייצור

---

## 🎓 שיפורים אפשריים

- [ ] מערכת ניקוד/דירוג (Ranking System)
- [ ] אנימציות משחק מתקדמות
- [ ] אפקטים קול (Sound Effects)
- [ ] מפות רנדומליות
- [ ] יכולות יחודיות לדמויות
- [ ] סנכרון משחק מרובה חדר
- [ ] מערכת פוטנציאל (Power-ups)
- [ ] לוחות מובילים (Leaderboards)

---

## 📄 רישיון

MIT License - חופשי להשתמש בפרויקטים משלך!

---

## 👨‍💻 צור קשר / תמיכה

אם יש לך שאלות או בעיות, בדוק את קבצי Console בדפדפן לפרטים טכניים.

---

**Happy Gaming! 🎮**
