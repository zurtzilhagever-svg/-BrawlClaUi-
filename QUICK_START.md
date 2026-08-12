# 🚀 CouchBrawl - Quick Start Guide

## ⚡ התחלה מהירה (5 דקות)

### שלב 1: התקנת Node.js
אם עדיין לא הותקן Node.js, הורד מ: https://nodejs.org/

### שלב 2: התקנת תלויות
```bash
# נווט לתיקיית הפרויקט
cd couchbrawl

# התקן תלויות
npm install
```

### שלב 3: הפעלת השרת
```bash
npm start
```

יראה:
```
╔════════════════════════════════════════╗
║        🎮 CouchBrawl Server 🎮         ║
║                                        ║
║  Server is running on port 3000        ║
║  Open: http://localhost:3000           ║
║                                        ║
║  📺 Host Display:                      ║
║     http://localhost:3000/tv           ║
║                                        ║
║  📱 Mobile Controller:                 ║
║     http://localhost:3000/mobile       ║
║                                        ║
╚════════════════════════════════════════╝
```

### שלב 4: פתיחת משחק

#### 📺 קח את המסך הראשי
1. **בטלוויזיה/מחשב**: פתח `http://localhost:3000/tv`
2. תראה קוד חדר (למשל: `ABCD`)
3. תראה QR Code שניתן לסרוק

#### 📱 הוספת שחקנים
1. **בכל טלפון**: פתח `http://localhost:3000/mobile`
2. הזן את קוד החדר
3. בחר שם שחקן
4. לחץ "הצטרף למשחק"

---

## 🎮 בקרות משחק

### ג'ויסטיק (שמאל)
- **חרוט** עם האצבע כדי להזיז את הדמות
- **שחרור** כדי לעצור

### כפתורים (ימין)
- **⚔️ התקפה** - לחץ להתקפה
- **✨ יכולת** - לחץ ליכולת מיוחדת

### Haptic Feedback
- כאשר לוחצים כפתור, המכשיר יתנדנד (אם תומך)

---

## 📡 בדיקת חיבור

### Console Logs (F12)

#### בטלוויזיה:
```
✅ Host Display אותחל בהצלחה
🔌 מחובר לשרת: [socket-id]
✅ חדר חדש נוצר: ABCD עם Host: [host-id]
👤 שחקן הצטרף: שחקן 1 בחדר ABCD
👥 כעת בחדר ABCD: 1 שחקנים
📱 QR Code נוצר עבור: http://localhost:3000/mobile?room=ABCD
```

#### בנייד:
```
✅ Mobile Controller אותחל בהצלחה
🔌 מחובר לשרת: [socket-id]
🎮 ניסיון הצטרפות לחדר: ABCD כשחקן: שחקן 1
✅ הצטרפות בהצלחה! ID: [player-id]
📱 משנים מסך ל: game
```

---

## 🛠️ פתרון בעיות

### ❌ "npm: command not found"
**פתרון**: Node.js לא הותקן. הורד מ: https://nodejs.org/

### ❌ "Port 3000 is already in use"
**פתרון**: יישום אחר משתמש בפורט. תוכל:
- לסגור את היישום האחר
- או לשנות את הפורט בקוד השרת

### ❌ "Cannot GET /tv"
**פתרון**: ודא שהשרת רץ (`npm start`)

### ❌ "QR Code לא מופיע"
**פתרון**: 
- בדוק את הקונסול (F12) לשגיאות
- נסה להרענן את הדף (F5)

### ❌ "מחוברים אך ללא תנועה"
**פתרון**:
- בדוק את מחברת הרשת
- נסה להתחבר מחדש
- ודא שהטלפון והטלוויזיה באותה רשת

---

## 🔧 פרוץ שכבה (Development Mode)

עם Nodemon (עדכון אוטומטי):
```bash
npm run dev
```

---

## 📚 קישורים שימושיים

- **Socket.io Docs**: https://socket.io/docs/
- **Gamepad API**: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- **Canvas**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Web Touch**: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

---

## ⚙️ הגדרות ניתן לשנות

### ב-`server.js`:
```javascript
const PORT = process.env.PORT || 3000;  // שנה פורט
const ROOM_TIMEOUT = 30000;             // זמן ניתוק זמני (מילישניות)
```

### ב-`controller.js`:
```javascript
const INPUT_SEND_INTERVAL = 1000 / 60;  // קצב שליחת קלט (Hz)
```

### ב-`host.js`:
```javascript
const ARENA_WIDTH = 800;      // רוחב הזירה
const ARENA_HEIGHT = 600;     // גובה הזירה
const PLAYER_RADIUS = 15;     // גודל שחקן
```

---

## 🚀 ההמשך

זה רק ההתחלה! אתה יכול:
- להוסיף עוד שחקנים
- להוסיף מפות שונות
- ליצור קוד בחזרה
- להוסיף צלילים
- ליצור דירוג גלובלי
- ולעוד הרבה!

---

**אתה מוכן! בואו נשחק! 🎮**

Need help? Check README.md for more details.
