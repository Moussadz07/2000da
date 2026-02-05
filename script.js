const storageKey = 'raffle_v2_users';

// ================= الجزء الخاص بالمستخدم (index.html) =================
if (typeof isAdminPage === 'undefined') {
    // توليد كود المستخدم
    const userCode = 'ID-' + Math.floor(Math.random() * 9000 + 1000);
    const codeEl = document.getElementById('user-code');
    if(codeEl) codeEl.innerText = userCode;

    // الانضمام
    window.joinRaffle = function() {
        const input = document.getElementById('username');
        const msg = document.getElementById('msg');
        let username = input.value.trim();

        if (!username) {
            msg.innerText = "⚠️ يرجى كتابة اسم المستخدم";
            msg.style.color = "#e74c3c";
            return;
        }

        if (!username.startsWith('@')) username = '@' + username;

        let users = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        if(users.some(u => u.toLowerCase() === username.toLowerCase())) {
            msg.innerText = "⛔ أنت مسجل بالفعل!";
            msg.style.color = "#f1c40f";
            return;
        }

        users.push(username);
        localStorage.setItem(storageKey, JSON.stringify(users));
        
        msg.innerText = "✅ تم تسجيلك بنجاح!";
        msg.style.color = "#2ecc71";
        input.value = '';
    }

    // ============================================
    // 🔥 كود الدخول السري (6 نقرات في أي مكان) 🔥
    // ============================================
    let clicks = 0;
    const modal = document.getElementById('admin-modal');

    // نستمع للنقرات في كامل الصفحة
    document.addEventListener('click', function(e) {
        // نستثني النقر داخل حقل الكتابة أو على الأزرار حتى لا تزعج المستخدم
        const isInteractive = e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON';
        
        if (!isInteractive && modal.style.display !== 'flex') {
            clicks++;
            console.log(`نقرة رقم: ${clicks}`); // افتح الكونسول F12 للتأكد
            
            if (clicks === 6) {
                modal.style.display = 'flex';
                clicks = 0; // تصفير العداد
            }
        }
    });

    window.closeModal = function() { modal.style.display = 'none'; }
    
    window.checkPass = function() {
        const p = document.getElementById('admin-pass').value;
        if (p === 'Mmoussadzx07@') {
            window.location.href = 'admin.html';
        } else {
            alert('كلمة مرور خاطئة ⛔');
        }
    }
}

// ================= الجزء الخاص بالأدمن (admin.html) =================
if (typeof isAdminPage !== 'undefined' && isAdminPage === true) {
    
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    let users = JSON.parse(localStorage.getItem(storageKey)) || ['لا يوجد مشاركين'];
    
    const colors = ['#8e44ad', '#2980b9', '#e67e22', '#16a085', '#c0392b', '#2c3e50'];
    
    let startAngle = 0;
    let arc = Math.PI * 2 / users.length;
    let spinTimeout = null;
    let spinAngleStart = 0;
    let spinTime = 0;
    let spinTimeTotal = 0;
    let isSpinning = false;
    
    // الصوت
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let lastPlayedSector = -1;

    function playTickSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    function drawRouletteWheel() {
        if (users.length === 0) users = ['لا يوجد مشاركين'];
        arc = Math.PI * 2 / users.length;
        ctx.clearRect(0, 0, 600, 600);
        const outsideRadius = 280;
        const insideRadius = 50;

        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 2;
        ctx.font = 'bold 18px Tajawal';

        for(let i = 0; i < users.length; i++) {
            const angle = startAngle + i * arc;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(300, 300, outsideRadius, angle, angle + arc, false);
            ctx.arc(300, 300, insideRadius, angle + arc, angle, true);
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = "white";
            ctx.translate(300, 300);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillText(users[i], outsideRadius - 20, 10);
            ctx.restore();
        }
    }

    window.spinWheel = function() {
        if(isSpinning) return;
        if(users[0] === 'لا يوجد مشاركين') { alert('لا يوجد مشاركين!'); return; }
        
        isSpinning = true;
        spinAngleStart = Math.random() * 20 + 20; 
        spinTime = 0;
        spinTimeTotal = Math.random() * 5000 + 4000; 
        rotateWheel();
    }

    function rotateWheel() {
        spinTime += 20;
        if(spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        checkSound(startAngle);
        drawRouletteWheel();
        requestAnimationFrame(rotateWheel);
    }

    function checkSound(angle) {
        const degrees = angle * 180 / Math.PI + 90;
        const arcd = 360 / users.length;
        const currentIndex = Math.floor((360 - degrees % 360) / arcd);
        if (lastPlayedSector !== currentIndex) {
            playTickSound();
            lastPlayedSector = currentIndex;
        }
    }

    function stopRotateWheel() {
        isSpinning = false;
        const degrees = startAngle * 180 / Math.PI + 90;
        const arcd = 360 / users.length;
        const index = Math.floor((360 - degrees % 360) / arcd);
        const winnerName = users[index];
        
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        setTimeout(() => {
            const cleanUser = winnerName.replace('@', '');
            window.open(`https://www.tiktok.com/@${cleanUser}`, '_blank');
            alert(`🎉 مبروك! الفائز هو: ${winnerName}`);
        }, 1500);
    }

    function easeOut(t, b, c, d) {
        const ts = (t/=d)*t;
        const tc = ts*t;
        return b+c*(tc + -3*ts + 3*t);
    }

    window.clearData = function() {
        if(confirm("حذف جميع المشاركين؟")) {
            localStorage.removeItem(storageKey);
            location.reload();
        }
    }

    drawRouletteWheel();
}
