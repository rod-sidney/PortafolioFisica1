// ============================================================
//  sim-bernoulli.js — Túnel de Viento Virtual (p5.js)
//  Simulación de Downforce — Principio de Bernoulli
//  Portafolio Física I — Universidad CENFOTEC
// ============================================================

const sketchBern = (p) => {

    // ── Canvas ────────────────────────────────────────────────
    const W = 560;
    const H = 340;

    // ── Física ────────────────────────────────────────────────
    const rho  = 1.225;   // densidad del aire kg/m³
    const P0   = 101325;  // presión de referencia Pa

    // ── Parámetros de sliders ─────────────────────────────────
    let V_sup  = 50;      // velocidad del flujo superior (m/s)
    let k      = 1.35;    // factor de velocidad inferior

    // ── Geometría del alerón (perfil NACA invertido simplificado)
    const wingCX  = W / 2;        // centro X del alerón
    const wingCY  = H / 2 + 10;   // centro Y del alerón
    const wingW   = 220;          // semiancho total
    const wingThk = 28;           // grosor máximo
    const camber  = 22;           // combadura inferior (downforce)

    // ── Líneas de flujo ───────────────────────────────────────
    const NUM_STREAMS = 12;
    let streams = [];

    // ── Colores ───────────────────────────────────────────────
    const C_BG       = '#1B1B1B';
    const C_TUNNEL   = '#1e2530';
    const C_WING     = '#3042B5';
    const C_WING_E   = '#AAA2F5';
    const C_STREAM_S = [246, 130, 213];   // rosa — flujo superior (lento)
    const C_STREAM_F = [255, 250, 163];   // amarillo — flujo inferior (rápido)

    // ── DOM ───────────────────────────────────────────────────
    let sliderSpeed, sliderK;
    let valVsup, valVinf, valPsup, valPinf, valDp, valDf;

    // ─────────────────────────────────────────────────────────
    p.setup = () => {
        const cnv = p.createCanvas(W, H);
        cnv.parent('sim-container-bern');
        p.frameRate(60);

        sliderSpeed = document.getElementById('slider-speed');
        sliderK     = document.getElementById('slider-k-bern');
        valVsup  = document.getElementById('val-vsup');
        valVinf  = document.getElementById('val-vinf');
        valPsup  = document.getElementById('val-psup');
        valPinf  = document.getElementById('val-pinf');
        valDp    = document.getElementById('val-dp');
        valDf    = document.getElementById('val-df');

        initStreams();
    };

    // ─────────────────────────────────────────────────────────
    p.draw = () => {
        p.background(C_BG);

        V_sup = parseFloat(sliderSpeed.value);
        k     = parseFloat(sliderK.value);

        const V_inf = k * V_sup;
        const P_sup = P0 + 0.5 * rho * V_sup * V_sup;   // presión sobre el alerón (flujo lento)
        const P_inf = P0 + 0.5 * rho * V_sup * V_sup
                         - 0.5 * rho * V_inf * V_inf;    // presión bajo el alerón (flujo rápido)
        const dP    = P_sup - P_inf;                      // diferencia → downforce
        const F_df  = dP * 1.0;                           // área = 1 m²

        // Actualizar telemetría
        updateTelemetry(V_sup, V_inf, P_sup, P_inf, dP, F_df);

        // ── Fondo del túnel ───────────────────────────────────
        drawTunnel();

        // ── Líneas de flujo ───────────────────────────────────
        updateAndDrawStreams(V_sup, V_inf);

        // ── Perfil aerodinámico ───────────────────────────────
        drawWing();

        // ── Anotaciones de presión ────────────────────────────
        drawPressureAnnotations(P_sup, P_inf, dP, F_df, V_sup, V_inf);
    };

    // ─────────────────────────────────────────────────────────
    //  Inicializar partículas de líneas de flujo
    // ─────────────────────────────────────────────────────────
    function initStreams() {
        streams = [];
        for (let i = 0; i < NUM_STREAMS; i++) {
            const t = i / (NUM_STREAMS - 1);
            streams.push({
                y0:    p.lerp(30, H - 30, t),   // Y de inicio (izquierda del canvas)
                x:     p.random(0, W),
                above: null                      // se determina en draw
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Fondo del túnel de viento
    // ─────────────────────────────────────────────────────────
    function drawTunnel() {
        // Paredes del túnel
        p.noStroke();
        p.fill(C_TUNNEL);
        p.rect(0, 0, W, 28);             // pared superior
        p.rect(0, H - 28, W, 28);        // pared inferior

        // Marcas de flujo en paredes
        p.stroke('rgba(255,255,255,0.07)');
        p.strokeWeight(1);
        for (let x = 0; x < W; x += 30) {
            p.line(x, 4, x + 15, 24);
            p.line(x, H - 4, x + 15, H - 24);
        }

        // Etiquetas de paredes
        p.noStroke();
        p.fill('rgba(255,255,255,0.25)');
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(8);
        p.text('PARED DEL TÚNEL', 8, 14);
        p.text('PARED DEL TÚNEL', 8, H - 14);

        // Flecha de dirección del flujo
        drawFlowArrow();
    }

    function drawFlowArrow() {
        const ay = H / 2 - 60;
        p.stroke('rgba(255,255,255,0.18)');
        p.strokeWeight(1.5);
        p.fill('rgba(255,255,255,0.18)');
        p.line(16, ay, 60, ay);
        p.triangle(60, ay, 53, ay - 4, 53, ay + 4);
        p.noStroke();
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(8);
        p.text('FLUJO', 16, ay - 9);
    }

    // ─────────────────────────────────────────────────────────
    //  Perfil del alerón (NACA invertido simplificado)
    // ─────────────────────────────────────────────────────────
    function buildWingProfile() {
        // Puntos del borde superior (curva suave, poca combadura)
        const topPts = [];
        const botPts = [];
        const steps  = 60;

        for (let i = 0; i <= steps; i++) {
            const t  = i / steps;           // 0 = borde de ataque, 1 = borde de salida
            const x  = wingCX - wingW / 2 + t * wingW;

            // Perfil superior: ligeramente arqueado hacia arriba
            const yTop = wingCY - wingThk * Math.sin(Math.PI * t) * 0.55;
            // Perfil inferior: más combado hacia abajo (downforce)
            const yBot = wingCY + wingThk * Math.sin(Math.PI * t)
                                + camber   * Math.sin(Math.PI * t);

            topPts.push({ x, y: yTop });
            botPts.push({ x, y: yBot });
        }
        return { topPts, botPts };
    }

    function drawWing() {
        const { topPts, botPts } = buildWingProfile();

        // Glow del alerón
        p.drawingContext.shadowBlur  = 20;
        p.drawingContext.shadowColor = 'rgba(48,66,181,0.7)';

        // Relleno del perfil
        p.fill(C_WING);
        p.stroke(C_WING_E);
        p.strokeWeight(1.5);
        p.beginShape();
        for (const pt of topPts) p.vertex(pt.x, pt.y);
        for (let i = botPts.length - 1; i >= 0; i--) p.vertex(botPts[i].x, botPts[i].y);
        p.endShape(p.CLOSE);

        p.drawingContext.shadowBlur = 0;

        // Texto "ALERÓN"
        p.noStroke();
        p.fill('#FFFFFF');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.textStyle(p.BOLD);
        p.text('ALERÓN INVERTIDO', wingCX, wingCY - 2);
        p.textStyle(p.NORMAL);

        // Flecha de downforce
        if (parseFloat(sliderSpeed.value) > 5) {
            const arrowX = wingCX + wingW / 2 + 28;
            const arrowY = wingCY;
            const dfLen  = p.map(parseFloat(sliderSpeed.value), 0, 100, 0, 55);

            p.drawingContext.shadowBlur  = 10;
            p.drawingContext.shadowColor = 'rgba(246,130,213,0.7)';
            p.stroke('#F682D5');
            p.strokeWeight(2.5);
            p.line(arrowX, arrowY - dfLen / 2, arrowX, arrowY + dfLen / 2);
            p.noStroke();
            p.fill('#F682D5');
            p.triangle(arrowX, arrowY + dfLen / 2,
                       arrowX - 6, arrowY + dfLen / 2 - 10,
                       arrowX + 6, arrowY + dfLen / 2 - 10);
            p.drawingContext.shadowBlur = 0;

            p.fill('#F682D5');
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(9);
            p.textStyle(p.BOLD);
            p.text('F↓', arrowX + 8, arrowY + dfLen / 4);
            p.textStyle(p.NORMAL);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Líneas de flujo animadas
    // ─────────────────────────────────────────────────────────
    function updateAndDrawStreams(vSup, vInf) {
        const { topPts, botPts } = buildWingProfile();
        const wingLeft  = wingCX - wingW / 2;
        const wingRight = wingCX + wingW / 2;

        for (let s of streams) {
            // Determinar si la línea pasa por encima o por debajo del alerón
            const aboveWing = s.y0 < wingCY - wingThk * 0.3;

            // Velocidad visual de la partícula
            const baseSpeed = p.map(vSup, 0, 100, 1.2, 7);
            let spd;

            // Dentro del rango del alerón, acelera si va por debajo
            if (s.x > wingLeft && s.x < wingRight) {
                spd = aboveWing ? baseSpeed * 0.85 : baseSpeed * p.map(k, 1.05, 1.8, 1.1, 1.9);
            } else {
                spd = baseSpeed;
            }

            s.x += spd;
            if (s.x > W + 10) s.x = -10;

            // Y actual de la partícula (con desvío al pasar por el alerón)
            let yDraw = s.y0;

            if (s.x > wingLeft - 30 && s.x < wingRight + 30) {
                const t       = p.constrain((s.x - wingLeft) / wingW, 0, 1);
                const deflect = Math.sin(Math.PI * t) * (aboveWing ? -8 : 10);
                yDraw = s.y0 + deflect;
            }

            // Color según zona (rosa = lento-superior, amarillo = rápido-inferior)
            let [r, g, b] = aboveWing ? C_STREAM_S : C_STREAM_F;

            p.drawingContext.shadowBlur  = 6;
            p.drawingContext.shadowColor = `rgba(${r},${g},${b},0.4)`;

            p.stroke(r, g, b, 200);
            p.strokeWeight(aboveWing ? 1.3 : 1.8);
            p.point(s.x, yDraw);

            // Rastro corto
            for (let j = 1; j <= 6; j++) {
                const alpha = 180 - j * 28;
                if (alpha <= 0) break;
                p.stroke(r, g, b, alpha);
                p.strokeWeight(1);
                p.point(s.x - j * (spd * 0.7), yDraw);
            }

            p.drawingContext.shadowBlur = 0;
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Anotaciones de presión sobre el canvas
    // ─────────────────────────────────────────────────────────
    function drawPressureAnnotations(Psup, Pinf, dP, Fdf, vSup, vInf) {
        const wingTop = wingCY - wingThk - 10;
        const wingBot = wingCY + wingThk + camber + 10;

        // ── Zona de presión SUPERIOR ──────────────────────────
        p.noStroke();
        p.fill('rgba(27,27,27,0.82)');
        p.rect(8, wingTop - 46, 155, 42, 7);

        p.fill(C_STREAM_S[0], C_STREAM_S[1], C_STREAM_S[2]);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(9);
        p.text('▲ ZONA SUPERIOR (lenta)', 14, wingTop - 43);

        p.fill('#FFFFFF');
        p.textSize(9.5);
        p.text(`V = ${vSup.toFixed(1)} m/s`, 14, wingTop - 30);

        p.fill(C_STREAM_S[0], C_STREAM_S[1], C_STREAM_S[2]);
        p.textStyle(p.BOLD);
        p.textSize(10);
        p.text(`P = ${(Psup / 1000).toFixed(2)} kPa`, 14, wingTop - 17);
        p.textStyle(p.NORMAL);

        // ── Zona de presión INFERIOR ──────────────────────────
        p.noStroke();
        p.fill('rgba(27,27,27,0.82)');
        p.rect(8, wingBot + 4, 155, 42, 7);

        p.fill(C_STREAM_F[0], C_STREAM_F[1], C_STREAM_F[2]);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(9);
        p.text('▼ ZONA INFERIOR (rápida)', 14, wingBot + 7);

        p.fill('#FFFFFF');
        p.textSize(9.5);
        p.text(`V = ${vInf.toFixed(1)} m/s`, 14, wingBot + 20);

        p.fill(C_STREAM_F[0], C_STREAM_F[1], C_STREAM_F[2]);
        p.textStyle(p.BOLD);
        p.textSize(10);
        p.text(`P = ${(Pinf / 1000).toFixed(2)} kPa`, 14, wingBot + 33);
        p.textStyle(p.NORMAL);

        // ── Caja resumen ΔP y Downforce (esquina superior derecha) ──
        p.noStroke();
        p.fill('rgba(27,27,27,0.88)');
        p.rect(W - 175, 32, 162, 62, 8);

        p.fill('#F682D5');
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(9);
        p.text('ΔP = P_sup − P_inf', W - 165, 36);

        p.fill('#FFFAA3');
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(`ΔP = ${dP.toFixed(1)} Pa`, W - 165, 50);
        p.textStyle(p.NORMAL);

        p.fill('rgba(246,130,213,0.7)');
        p.textSize(9);
        p.text('Downforce (A = 1 m²)', W - 165, 68);

        p.fill('#F682D5');
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(`F↓ = ${Fdf.toFixed(1)} N`, W - 165, 82);
        p.textStyle(p.NORMAL);
    }

    // ─────────────────────────────────────────────────────────
    //  Actualizar telemetría HTML
    // ─────────────────────────────────────────────────────────
    function updateTelemetry(vSup, vInf, Psup, Pinf, dP, Fdf) {
        valVsup.textContent = `${vSup.toFixed(1)} m/s`;
        valVinf.textContent = `${vInf.toFixed(2)} m/s`;
        valPsup.textContent = `${(Psup / 1000).toFixed(3)} kPa`;
        valPinf.textContent = `${(Pinf / 1000).toFixed(3)} kPa`;
        valDp.textContent   = `${dP.toFixed(2)} Pa`;
        valDf.textContent   = `${Fdf.toFixed(2)} N`;

        // Color del downforce según magnitud
        const maxDf = 0.5 * rho * (Math.pow(100 * 1.8, 2) - Math.pow(100, 2));
        const ratio = p.constrain(Fdf / maxDf, 0, 1);
        const r = Math.round(p.lerp(255, 246, ratio));
        const g = Math.round(p.lerp(255, 130, ratio));
        const b = Math.round(p.lerp(163, 213, ratio));
        valDf.style.color = `rgb(${r},${g},${b})`;
    }

}; // fin sketchBern

new p5(sketchBern);
