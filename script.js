const storageKey = 'raffle_v2_users';

// ================= الجزء الخاص بالمستخدم (index.html) =================
if (typeof isAdminPage === 'undefined') {
    // 1. توليد كود المستخدم
    const userCode = 'ID-' + Math.floor(Math.random() * 9000 + 1000);
    const codeEl = document.getElementById('user-code');
    if(codeEl) codeEl.innerText = userCode;

    // 2. الانضمام
    function joinRaffle() {
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
        
        // منع التكرار
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

    // 3. المنطقة السرية (12 نقرة)
    let clicks = 0;
    const clickArea = document.getElementById('secret-click-area');
    const modal = document.getElementById('admin-modal');

    if(clickArea) {
        clickArea.addEventListener('click', () => {
            clicks++;
            console.log("Click:", clicks);
            if (clicks === 12) {
                modal.style.display = 'flex';
                clicks = 0;
            }
        });
    }

    function closeModal() { modal.style.display = 'none'; }
    
    function checkPass() {
        const p = document.getElementById('admin-pass').value;
        if (p === 'Mmoussadzx07@') window.location.href = 'admin.html';
        else alert('كلمة مرور خاطئة');
    }
}

// ================= الجزء الخاص بالأدمن (admin.html) =================
if (typeof isAdminPage !== 'undefined' && isAdminPage === true) {
    
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    let users = JSON.parse(localStorage.getItem(storageKey)) || ['تيك توك', 'مسابقة', 'تجربة', 'فائز 1', 'فائز 2', 'مثال'];
    
    // ألوان احترافية متناوبة
    const colors = ['#8e44ad', '#2980b9', '#e67e22', '#16a085', '#c0392b', '#2c3e50'];
    
    let startAngle = 0;
    let arc = Math.PI * 2 / users.length;
    let spinTimeout = null;
    let spinAngleStart = 0;
    let spinTime = 0;
    let spinTimeTotal = 0;
    let isSpinning = false;
    
    // إعدادات الصوت (Web Audio API)
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let lastPlayedSector = -1;

    function playTickSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'triangle'; // نوع الموجة الصوتية
        osc.frequency.setValueAtTime(800, audioCtx.currentTime); // تردد حاد
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // دالة الرسم الأساسية
    function drawRouletteWheel() {
        // تحديث القيمة في حال زاد عدد المستخدمين
        if (users.length === 0) users = ['لا يوجد مشاركين'];
        arc = Math.PI * 2 / users.length;

        // تنظيف الكانفاس
        ctx.clearRect(0, 0, 600, 600);
        
        const outsideRadius = 280;
        const textRadius = 220; // موقع النص
        const insideRadius = 50;

        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 2;
        ctx.font = 'bold 18px Tajawal';

        for(let i = 0; i < users.length; i++) {
            const angle = startAngle + i * arc;
            
            // 1. رسم القطعة (Sector)
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(300, 300, outsideRadius, angle, angle + arc, false);
            ctx.arc(300, 300, insideRadius, angle + arc, angle, true);
            ctx.fill();
            ctx.stroke();

            // 2. رسم النص (السر هنا)
            ctx.save();
            ctx.fillStyle = "white";
            
            // ننتقل إلى مركز العجلة
            ctx.translate(300, 300);
            // ندوّر الكانفاس ليشير إلى منتصف القطعة الحالية
            ctx.rotate(angle + arc / 2);
            
            // الآن نكتب النص. لأنه تم التدوير، نكتبه أفقياً ببساطة
            ctx.textAlign = "right";
            ctx.fillText(users[i], outsideRadius - 20, 10); // 20px هو الهامش من الحافة
            
            ctx.restore();
        }
    }

    function spinWheel() {
        if(isSpinning) return;
        isSpinning = true;
        
        // سرعة جنونية في البداية
        spinAngleStart = Math.random() * 20 + 20; // سرعة دوران عالية
        spinTime = 0;
        spinTimeTotal = Math.random() * 5000 + 4000; // وقت بين 4 و 9 ثواني
        
        rotateWheel();
    }

    function rotateWheel() {
        spinTime += 20;
        
        // معادلة التباطؤ (كلما اقترب الوقت من النهاية، قلت الزاوية المضافة)
        if(spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        
        // معادلة EaseOut Cubic لحركة ناعمة
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        
        // منطق الصوت
        checkSound(startAngle);
        
        drawRouletteWheel();
        requestAnimationFrame(rotateWheel);
    }

    // دالة لتشغيل الصوت عند عبور الخطوط
    function checkSound(angle) {
        // نحسب الدرجة الحالية (0-360)
        const degrees = angle * 180 / Math.PI + 90;
        const arcd = 360 / users.length;
        // المؤشر (Index) الحالي الذي يمر تحت السهم
        const currentIndex = Math.floor((360 - degrees % 360) / arcd);

        if (lastPlayedSector !== currentIndex) {
            playTickSound();
            lastPlayedSector = currentIndex;
        }
    }

    function stopRotateWheel() {
        isSpinning = false;
        
        // حساب الفائز
        const degrees = startAngle * 180 / Math.PI + 90;
        const arcd = 360 / users.length;
        const index = Math.floor((360 - degrees % 360) / arcd);
        
        const winnerName = users[index];
        
        // تأثير الاحتفال
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });

        // فتح الرابط بعد ثانية ونصف
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

    function clearData() {
        if(confirm("هل أنت متأكد من حذف جميع المشاركين؟")) {
            localStorage.removeItem(storageKey);
            location.reload();
        }
    }

    // الرسم الأولي
    drawRouletteWheel();
}
