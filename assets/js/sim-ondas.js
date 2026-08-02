// ============================================================
//  sim-ondas.js — Simulación Ondas Estacionarias (p5.js)
//  Sintetizador VST por Modelado Físico — Portafolio Física I
// ============================================================

const sketchOndas = (p) => {

    // ── Dimensiones del canvas ───────────────────────────────
    const W = 560;
    const H = 320;

    // ── Parámetros físicos ───────────────────────────────────
    const L_real = 0.65;    // longitud de la cuerda en metros (guitarra estándar)
    const mu     = 0.003;   // densidad lineal kg/m (cuerda Mi grave de guitarra)
    let   T      = 100;     // tensión en Newtons (leída del slider)
    let   n      = 1;       // número de armónico activo

    // ── Posición del dibujo en canvas ───────────────────────
    const stringY  = H / 2;       // Y central de la cuerda
    const stringX0 = 50;          // X inicio de la cuerda
    const stringX1 = W - 50;      // X fin de la cuerda
    const stringLen = stringX1 - stringX0;
    // AMP_MAX eliminado — se calcula dinámicamente en draw() según T

    // ── Colores ──────────────────────────────────────────────
    const C_BG      = '#1B1B1B';
    const C_STRING  = '#F682D5';
    const C_NODE    = '#FFFAA3';
    const C_FRET    = '#3042B5';
    const C_GUIDE   = 'rgba(255,255,255,0.06)';
    const C_TEXT    = '#A0A0A0';

    // ── Elementos HTML ───────────────────────────────────────
    let sliderTension;
    let valN, valV, valFn, valLambda;
    let btnN1, btnN2, btnN3;
    let activeButtons;

    // ── Tiempo de animación ──────────────────────────────────
    let phase = 0;

    // ─────────────────────────────────────────────────────────
    p.setup = () => {
        const cnv = p.createCanvas(W, H);
        cnv.parent('sim-container-ondas');
        p.frameRate(60);

        // Referencias DOM
        sliderTension = document.getElementById('slider-tension');
        valN      = document.getElementById('val-n');
        valV      = document.getElementById('val-v-ondas');
        valFn     = document.getElementById('val-fn');
        valLambda = document.getElementById('val-lambda');

        btnN1 = document.getElementById('btn-n1');
        btnN2 = document.getElementById('btn-n2');
        btnN3 = document.getElementById('btn-n3');
        activeButtons = [btnN1, btnN2, btnN3];

        // Listeners botones de armónico
        btnN1.addEventListener('click', () => setHarmonic(1));
        btnN2.addEventListener('click', () => setHarmonic(2));
        btnN3.addEventListener('click', () => setHarmonic(3));
    };

    // ─────────────────────────────────────────────────────────
    p.draw = () => {
        p.background(C_BG);

        // Leer tensión del slider
        T = parseFloat(sliderTension.value);

        // Calcular física
        const v      = Math.sqrt(T / mu);
        const fn     = (n * v) / (2 * L_real);
        const lambda = (2 * L_real) / n;

        // Amplitud dinámica: mayor tensión → cuerda más rígida → menos desplazamiento
        const currentAmp = p.map(T, 10, 400, 90, 30);

        // Velocidad de animación vinculada a la frecuencia real calculada
        phase += fn * 0.0015;

        // Actualizar telemetría HTML
        updateTelemetry(v, fn, lambda);

        // ── Fondo con rejilla sutil ──────────────────────────
        drawGrid();

        // ── Caja de cuerpo de la guitarra (estética) ─────────
        drawBody();

        // ── Cuerda vibrada ───────────────────────────────────
        drawString(fn, phase, currentAmp);

        // ── Marcadores de nodos ──────────────────────────────
        drawNodes();

        // ── Etiquetas ────────────────────────────────────────
        drawLabels(fn, currentAmp);
    };

    // ─────────────────────────────────────────────────────────
    //  Dibujar rejilla de fondo
    // ─────────────────────────────────────────────────────────
    function drawGrid() {
        p.stroke(C_GUIDE);
        p.strokeWeight(1);
        for (let x = stringX0; x <= stringX1; x += stringLen / (n * 4)) {
            p.line(x, 20, x, H - 20);
        }
        p.line(stringX0, stringY, stringX1, stringY);
    }

    // ─────────────────────────────────────────────────────────
    //  Dibujar cuerpos (clavijero y puente estilizados)
    // ─────────────────────────────────────────────────────────
    function drawBody() {
        // Clavijero (izquierda)
        p.noStroke();
        p.fill(C_FRET);
        p.drawingContext.shadowBlur  = 14;
        p.drawingContext.shadowColor = 'rgba(48,66,181,0.7)';
        p.rect(stringX0 - 40, stringY - 22, 42, 44, 6);
        p.drawingContext.shadowBlur = 0;

        // Puente (derecha)
        p.fill(C_FRET);
        p.drawingContext.shadowBlur  = 14;
        p.drawingContext.shadowColor = 'rgba(48,66,181,0.7)';
        p.rect(stringX1, stringY - 22, 42, 44, 6);
        p.drawingContext.shadowBlur = 0;

        // Texto etiquetas
        p.fill('#AAA2F5');
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text('CLAVIJERO', stringX0 - 19, stringY);
        p.text('PUENTE', stringX1 + 21, stringY);
    }

    // ─────────────────────────────────────────────────────────
    //  Dibujar cuerda vibrante (onda estacionaria)
    // ─────────────────────────────────────────────────────────
    function drawString(fn, ph, currentAmp) {
        const steps = 200;
        const dx    = stringLen / steps;

        // Glow de la cuerda
        p.drawingContext.shadowBlur  = 18;
        p.drawingContext.shadowColor = 'rgba(246,130,213,0.6)';

        p.stroke(C_STRING);
        p.strokeWeight(2.5);
        p.noFill();

        p.beginShape();
        for (let i = 0; i <= steps; i++) {
            const x_norm = i / steps;                      // 0..1
            const x_px   = stringX0 + i * dx;
            const spatial = Math.sin(n * Math.PI * x_norm);
            const temporal = Math.cos(ph);
            const y = stringY + currentAmp * spatial * temporal;
            p.vertex(x_px, y);
        }
        p.endShape();

        p.drawingContext.shadowBlur = 0;
    }

    // ─────────────────────────────────────────────────────────
    //  Marcar nodos y antinodos
    // ─────────────────────────────────────────────────────────
    function drawNodes() {
        // n+1 nodos (incluyendo extremos)
        for (let k = 0; k <= n; k++) {
            const x = stringX0 + (k / n) * stringLen;

            // Círculo nodo
            p.drawingContext.shadowBlur  = 10;
            p.drawingContext.shadowColor = 'rgba(255,250,163,0.7)';
            p.fill(C_NODE);
            p.noStroke();
            p.ellipse(x, stringY, 9, 9);
            p.drawingContext.shadowBlur = 0;

            // Etiqueta "N"
            p.fill(C_TEXT);
            p.textSize(9);
            p.textAlign(p.CENTER, p.TOP);
            p.text('N', x, stringY + 10);
        }

        // n antinodos (centros entre nodos)
        for (let k = 0; k < n; k++) {
            const x = stringX0 + ((k + 0.5) / n) * stringLen;
            p.fill('rgba(246,130,213,0.35)');
            p.noStroke();
            p.ellipse(x, stringY, 12, 12);

            p.fill(C_STRING);
            p.textSize(9);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text('A', x, stringY - 10);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Etiquetas de frecuencia sobre el canvas
    // ─────────────────────────────────────────────────────────
    function drawLabels(fn, currentAmp) {
        // Caja de frecuencia
        p.noStroke();
        p.fill('rgba(27,27,27,0.85)');
        p.rect(W - 170, 12, 148, 46, 8);

        p.fill('#FFFAA3');
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(10);
        p.text(`Armónico n = ${n}`, W - 160, 27);

        p.fill('#F682D5');
        p.textSize(13);
        p.textStyle(p.BOLD);
        p.text(`f${n} = ${fn.toFixed(1)} Hz`, W - 160, 46);
        p.textStyle(p.NORMAL);

        // Longitud de onda visual
        if (n >= 1) {
            const halfWaveLen = stringLen / n;
            p.stroke('rgba(255,250,163,0.25)');
            p.strokeWeight(1);
            p.drawingContext.setLineDash([5, 5]);
            p.line(stringX0, stringY - currentAmp - 20, stringX0 + halfWaveLen, stringY - currentAmp - 20);
            p.drawingContext.setLineDash([]);

            p.noStroke();
            p.fill('rgba(255,250,163,0.5)');
            p.textSize(8.5);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text('λ/2', stringX0 + halfWaveLen / 2, stringY - currentAmp - 24);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Actualizar panel de telemetría HTML
    // ─────────────────────────────────────────────────────────
    function updateTelemetry(v, fn, lambda) {
        valN.textContent      = n;
        valV.textContent      = `${v.toFixed(2)} m/s`;
        valFn.textContent     = `${fn.toFixed(2)} Hz`;
        valLambda.textContent = `${lambda.toFixed(3)} m`;
    }

    // ─────────────────────────────────────────────────────────
    //  Cambiar armónico activo
    // ─────────────────────────────────────────────────────────
    function setHarmonic(newN) {
        n     = newN;
        phase = 0;

        // Actualizar estado visual de botones
        activeButtons.forEach((btn, i) => {
            if (i + 1 === newN) {
                btn.classList.add('ondas-harmonic-btn--active');
            } else {
                btn.classList.remove('ondas-harmonic-btn--active');
            }
        });
    }

}; // fin sketchOndas

// Montar el sketch de p5.js en modo instancia
new p5(sketchOndas);
