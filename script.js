// ================= المتغيرات العامة =================
const storageKey = 'raffle_users';

// ================= منطق واجهة المستخدم (index.html) =================
if (typeof isAdminPage === 'undefined') {
    
    // 1. توليد رمز عشوائي للمستخدم
    const userCode = 'USER-' + Math.floor(1000 + Math.random() * 9000);
    const codeSpan = document.getElementById('user-code');
    if(codeSpan) codeSpan.innerText = userCode;

    // 2. تسجيل المستخدم
    function joinRaffle() {
        const input = document.getElementById('username');
        let username = input.value.trim();
        const msg = document.getElementById('msg');

        if (!username) {
            msg.innerText = "يرجى كتابة اسم المستخدم!";
            msg.style.color = "red";
            return;
        }

        // إضافة @ إذا لم تكن موجودة
        if (!username.startsWith('@')) username = '@' + username;

        // حفظ البيانات في المتصفح
        let users = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // التحقق من التكرار
        if(users.includes(username)) {
            msg.innerText = "لقد قمت بالتسجيل مسبقاً!";
            msg.style.color = "orange";
            return;
        }

        users.push(username);
        localStorage.setItem(storageKey, JSON.stringify(users));

        msg.innerText = "تم تسجيلك في القرعة بنجاح! ✅";
        msg.style.color = "#4cd137";
        input.value = '';
    }

    // 3. المنطقة السرية (12 نقرة)
    let clickCount = 0;
    const clickArea = document.getElementById('click-area');
    const modal = document.getElementById('admin-modal');

    // كشف النقرات على الخلفية فقط
    clickArea.addEventListener('click', function(e) {
        // التأكد أن النقر تم على الخلفية وليس على الأزرار
        if(e.target === clickArea || e.target.classList.contains('container')) {
            clickCount++;
            console.log("Clicks: " + clickCount);
            
            if (clickCount === 12) {
                modal.style.display = 'flex';
                clickCount = 0; // تصفير العداد
            }
        }
    });

    function closeModal() {
        modal.style.display = 'none';
    }

    function checkPass() {
        const pass = document.getElementById('admin-pass').value;
        // كلمة السر المطلوبة
        if (pass === 'Mmoussadzx07@') {
            window.location.href = 'admin.html';
        } else {
            alert('كلمة المرور خاطئة!');
        }
    }
}

// ================= منطق واجهة الأدمن والعجلة (admin.html) =================
if (typeof isAdminPage !== 'undefined' && isAdminPage === true) {

    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    let users = JSON.parse(localStorage.getItem(storageKey)) || ['لا يوجد مشاركين', 'تجربة', 'مثال'];
    
    // ألوان العجلة
    const colors = ['#e94560', '#16213e', '#0f3460', '#533483', '#E94560', '#1A1A2E'];

    let startAngle = 0;
    let arc = Math.PI * 2 / users.length;
    let spinTimeout = null;
    let spinArcStart = 10;
    let spinTime = 0;
    let spinTimeTotal = 0;
    let isSpinning = false;

    // رسم العجلة
    function drawRouletteWheel() {
        // تحديث القوس بناءً على عدد المستخدمين الجدد
        arc = Math.PI * 2 / users.length;
        
        if (canvas.getContext) {
            const outsideRadius = 200;
            const textRadius = 160;
            const insideRadius = 0; // عجلة مصمتة

            ctx.clearRect(0,0,500,500);

            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;

            for(let i = 0; i < users.length; i++) {
                const angle = startAngle + i * arc;
                ctx.fillStyle = colors[i % colors.length];

                ctx.beginPath();
                ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
                ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
                ctx.stroke();
                ctx.fill();

                ctx.save();
                ctx.shadowOffsetX = -1;
                ctx.shadowOffsetY = -1;
                ctx.shadowBlur    = 0;
                ctx.fillStyle = "white";
                ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius, 
                              250 + Math.sin(angle + arc / 2) * textRadius);
                ctx.rotate(angle + arc / 2 + Math.PI / 2);
                const text = users[i];
                ctx.font = 'bold 16px Cairo';
                ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
                ctx.restore();
            }
        }
    }

    // بدء الدوران
    function spinWheel() {
        if(isSpinning) return;
        if(users.length === 0) { alert('لا يوجد مشاركين!'); return; }
        
        isSpinning = true;
        spinTime = 0;
        // زمن دوران عشوائي بين 5 و 8 ثواني لضمان الشفافية
        spinTimeTotal = Math.random() * 3000 + 4000 * 1; 
        rotateWheel();
    }

    // حركة الدوران الفيزيائية
    function rotateWheel() {
        spinTime += 30;
        if(spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        
        // معادلة التباطؤ (Easing Out)
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        drawRouletteWheel();
        spinTimeout = setTimeout(rotateWheel, 30);
    }

    function stopRotateWheel() {
        clearTimeout(spinTimeout);
        isSpinning = false;
        
        // حساب الفائز
        const degrees = startAngle * 180 / Math.PI + 90;
        const arcd = 360 / users.length;
        const index = Math.floor((360 - degrees % 360) / arcd);
        
        ctx.save();
        ctx.font = 'bold 30px Cairo';
        const text = users[index];
        // تأثير فوز بصري
        alert("الفائز هو: " + text + "\nسيتم فتح حسابه الآن!");
        
        // فتح حساب تيك توك تلقائياً
        let cleanUsername = text.replace('@', '');
        window.open(`https://www.tiktok.com/@${cleanUsername}`, '_blank');
        
        ctx.restore();
    }

    // دالة الحركة الفيزيائية
    function easeOut(t, b, c, d) {
        const ts = (t/=d)*t;
        const tc = ts*t;
        return b+c*(tc + -3*ts + 3*t);
    }

    // مسح البيانات
    function clearData() {
        if(confirm("هل أنت متأكد من مسح جميع الأسماء؟")) {
            localStorage.removeItem(storageKey);
            location.reload();
        }
    }

    // متغير ابتدائي لسرعة الدوران
    var spinAngleStart = Math.random() * 10 + 10;
    
    // التشغيل الأولي
    drawRouletteWheel();
}
