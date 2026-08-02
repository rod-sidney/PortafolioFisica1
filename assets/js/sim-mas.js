// ============================================================
//  sim-mas.js — Simulación MAS Amortiguado (p5.js)
//  Físicas de Suspensión Vehicular — Portafolio Física I
// ============================================================

const sketch = (p) => {

    // ── Dimensiones del canvas ───────────────────────────────
    const W = 560;
    const H = 380;

    // ── Parámetros físicos (se leen de los sliders) ──────────
    let k = 4.0;    // rigidez del resorte
    let b = 0.8;    // coeficiente de amortiguamiento
    const m = 1.0;  // masa del chasis (normalizada)

    // ── Variables de estado del sistema ─────────────────────
    let A = 0;          // amplitud inicial del impacto
    let t = 0;          // tiempo transcurrido
    let simRunning = false;

    // ── Posiciones base (sin perturbación) ───────────────────
    const chassisBaseY = 140;   // Y del chasis en reposo
    const wheelBaseY   = 280;   // Y de la rueda en reposo
    let chassisY = chassisBaseY;
    let wheelY   = wheelBaseY;

    // ── Colores de la paleta ─────────────────────────────────
    const C_BG      = '#1B1B1B';
    const C_CHASSIS = '#3042B5';
    const C_WHEEL   = '#FFFFFF';
    const C_SPRING  = '#F682D5';
    const C_ROAD    = '#2A2A2A';
    const C_ACCENT  = '#FFFAA3';
    const C_TEXT    = '#A0A0A0';

    // ── Elementos HTML ────────────────────────────────────────
    let sliderK, sliderB, btnBache;
    let valAmplitud, valXt, valTiempo, valEstado;

    // ─────────────────────────────────────────────────────────
    p.setup = () => {
        const cnv = p.createCanvas(W, H);
        cnv.parent('sim-container');

        sliderK    = document.getElementById('slider-k');
        sliderB    = document.getElementById('slider-b');
        btnBache   = document.getElementById('btn-bache');
        valAmplitud = document.getElementById('val-amplitud');
        valXt       = document.getElementById('val-xt');
        valTiempo   = document.getElementById('val-tiempo');
        valEstado   = document.getElementById('val-estado');

        btnBache.addEventListener('click', triggerBache);

        // ── Tarjetas de régimen ─────────────────────────────
        function setRegime(newK, newB) {
            k = newK;
            b = newB;

            sliderK.value = newK;
            sliderB.value = newB;
            document.getElementById('lbl-k').innerText = newK.toFixed(1);
            document.getElementById('lbl-b').innerText = newB.toFixed(1);

            triggerBache();
        }

        document.getElementById('btn-regime-under')
            .addEventListener('click', () => setRegime(8.0, 0.3));

        document.getElementById('btn-regime-critical')
            .addEventListener('click', () => setRegime(4.0, 4.0));

        document.getElementById('btn-regime-over')
            .addEventListener('click', () => setRegime(2.0, 5.0));
    };

    // ─────────────────────────────────────────────────────────
    p.draw = () => {
        p.background(C_BG);

        // Leer parámetros de sliders en cada frame
        k = parseFloat(sliderK.value);
        b = parseFloat(sliderB.value);

        // ── Actualizar física ────────────────────────────────
        if (simRunning) {
            const dt = 0.006;   // delta de tiempo (ralentizado para análisis visual)
            t += dt;

            const omega0 = Math.sqrt(k / m);
            const gamma  = b / (2 * m);

            let xt;
            if (gamma < omega0) {
                // Subamortiguado
                const omegaD = Math.sqrt(omega0 * omega0 - gamma * gamma);
                xt = A * Math.exp(-gamma * t) * Math.cos(omegaD * t);
            } else {
                // Críticamente / Sobreamortiguado
                xt = A * Math.exp(-gamma * t);
            }

            chassisY = chassisBaseY + xt;

            // Fin de la oscilación cuando la amplitud efectiva es despreciable
            if (Math.abs(xt) < 0.3 && t > 0.5) {
                simRunning = false;
                chassisY   = chassisBaseY;
                t = 0;
                A = 0;
                updateTelemetry(0, 0, 0, 'EN REPOSO');
            } else {
                updateTelemetry(
                    Math.abs(A),
                    xt,
                    t,
                    gamma < Math.sqrt(k / m) ? 'OSCILANDO' : 'AMORTIGUANDO'
                );
            }
        }

        // ── Dibujar carretera ────────────────────────────────
        drawRoad();

        // ── Dibujar resorte (zigzag) ─────────────────────────
        drawSpring(W / 2, chassisY + 30, W / 2, wheelY - 20);

        // ── Dibujar rueda ────────────────────────────────────
        drawWheel(W / 2, wheelY);

        // ── Dibujar chasis ───────────────────────────────────
        drawChassis(W / 2, chassisY);

        // ── Etiqueta de amplitud ─────────────────────────────
        if (simRunning) {
            drawAmplitudeLabel(chassisY);
        }
    };

    // ─────────────────────────────────────────────────────────
    //  Funciones de dibujo
    // ─────────────────────────────────────────────────────────

    function drawRoad() {
        p.noStroke();
        p.fill(C_ROAD);
        p.rect(0, wheelY + 26, W, H - wheelY - 26, 0);

        // Líneas de carretera
        p.stroke('#444444');
        p.strokeWeight(1);
        p.drawingContext.setLineDash([20, 15]);
        p.line(0, wheelY + 40, W, wheelY + 40);
        p.drawingContext.setLineDash([]);
    }

    function drawChassis(cx, cy) {
        // Sombra glow
        p.drawingContext.shadowBlur  = 20;
        p.drawingContext.shadowColor = 'rgba(48, 66, 181, 0.6)';

        p.fill(C_CHASSIS);
        p.stroke('#AAA2F5');
        p.strokeWeight(1.5);
        p.rect(cx - 80, cy - 28, 160, 56, 10);

        p.drawingContext.shadowBlur = 0;

        // Texto interior del chasis
        p.noStroke();
        p.fill('#FFFFFF');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(11);
        p.textStyle(p.BOLD);
        p.text('CHASIS', cx, cy - 8);

        p.fill('#FFFAA3');
        p.textSize(9);
        p.textStyle(p.NORMAL);
        p.text('m = 1.0 kg', cx, cy + 8);
    }

    function drawWheel(cx, cy) {
        p.drawingContext.shadowBlur  = 12;
        p.drawingContext.shadowColor = 'rgba(255,255,255,0.2)';

        // Neumático
        p.fill('#333333');
        p.stroke(C_WHEEL);
        p.strokeWeight(4);
        p.ellipse(cx, cy, 60, 60);

        // Llanta interior
        p.fill('#555555');
        p.stroke('#888888');
        p.strokeWeight(2);
        p.ellipse(cx, cy, 30, 30);

        // Radio de llanta
        p.stroke('#AAAAAA');
        p.strokeWeight(2);
        for (let a = 0; a < p.TWO_PI; a += p.PI / 3) {
            p.line(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6,
                   cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
        }

        p.drawingContext.shadowBlur = 0;
    }

    function drawSpring(x1, y1, x2, y2) {
        const segments  = 12;
        const amplitude = 10;
        const step      = (y2 - y1) / segments;

        p.stroke(C_SPRING);
        p.strokeWeight(2);
        p.drawingContext.shadowBlur  = 8;
        p.drawingContext.shadowColor = 'rgba(246,130,213,0.5)';

        p.beginShape();
        p.vertex(x1, y1);
        for (let i = 0; i <= segments; i++) {
            const y = y1 + step * i;
            const xOff = (i % 2 === 0) ? amplitude : -amplitude;
            p.vertex(x1 + xOff, y);
        }
        p.vertex(x2, y2);
        p.endShape();

        p.drawingContext.shadowBlur = 0;

        // Línea recta guía (fantasma)
        p.stroke('rgba(246,130,213,0.15)');
        p.strokeWeight(1);
        p.line(x1, y1, x2, y2);
    }

    function drawAmplitudeLabel(cy) {
        const diff = cy - chassisBaseY;
        if (Math.abs(diff) < 3) return;

        const midY = (chassisBaseY + cy) / 2;

        // Línea de referencia base
        p.stroke('rgba(255,250,163,0.3)');
        p.strokeWeight(1);
        p.drawingContext.setLineDash([4, 6]);
        p.line(W / 2 + 90, chassisBaseY, W / 2 + 90, cy);
        p.drawingContext.setLineDash([]);

        // Flechas
        p.stroke(C_ACCENT);
        p.strokeWeight(1.5);
        p.line(W / 2 + 90, chassisBaseY, W / 2 + 90, cy);
        p.fill(C_ACCENT);
        p.noStroke();
        p.triangle(W / 2 + 90, chassisBaseY,
                   W / 2 + 86, chassisBaseY + 8 * Math.sign(diff),
                   W / 2 + 94, chassisBaseY + 8 * Math.sign(diff));

        // Etiqueta
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(10);
        p.fill(C_ACCENT);
        p.text(`x(t) = ${diff.toFixed(1)} px`, W / 2 + 96, midY);
    }

    // ─────────────────────────────────────────────────────────
    //  Disparar impacto (bache)
    // ─────────────────────────────────────────────────────────
    function triggerBache() {
        A = -60;            // amplitud inicial del impacto (negativo = rueda sube)
        t = 0;
        simRunning = true;

        // Feedback visual del botón
        btnBache.classList.add('mas-btn-bache--active');
        setTimeout(() => btnBache.classList.remove('mas-btn-bache--active'), 300);
    }

    // ─────────────────────────────────────────────────────────
    //  Actualizar panel de telemetría HTML
    // ─────────────────────────────────────────────────────────
    function updateTelemetry(amp, xt, time, estado) {
        valAmplitud.textContent = `${Math.abs(amp).toFixed(2)} px`;
        valXt.textContent       = `${xt.toFixed(2)} px`;
        valTiempo.textContent   = `${time.toFixed(2)} s`;
        valEstado.textContent   = estado;

        // Color del estado
        const colors = {
            'EN REPOSO':   '#FFFFFF',
            'OSCILANDO':   '#F682D5',
            'AMORTIGUANDO':'#FFFAA3'
        };
        valEstado.style.color = colors[estado] || '#FFFFFF';
    }

}; // fin sketch

// Montar el sketch de p5.js en modo instancia
new p5(sketch);
