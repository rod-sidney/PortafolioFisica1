// ============================================================
//  sim-presion.js — Diagrama Presión Hidrostática (p5.js)
//  Software BIM de Mapeo de Estrés Estructural — Portafolio Física I
// ============================================================

const sketchPresion = (p) => {

    // ── Dimensiones del canvas ───────────────────────────────
    const W = 560;
    const H = 380;

    // ── Constantes físicas ───────────────────────────────────
    const g = 9.81;

    // ── Parámetros leídos de sliders ─────────────────────────
    let H_real = 10;
    let rho    = 1000;

    // ── Layout fijo del diagrama (el muro NUNCA se mueve) ────
    const PAD_TOP    = 40;
    const PAD_BOTTOM = 40;
    const WALL_X     = 300;
    const WALL_W     = 55;
    const WATER_X0   = 60;
    const ARROW_X1   = WALL_X - 6;

    // ── Colores ──────────────────────────────────────────────
    const C_BG      = '#1B1B1B';
    const C_SKY     = '#1e2530';
    const C_GROUND  = '#2A2A2A';
    const C_WATER   = 'rgba(48, 130, 220, 0.55)';
    const C_WATER_S = 'rgba(100, 190, 255, 0.9)';

    // ── Elementos HTML ───────────────────────────────────────
    let sliderH, sliderRho;
    let valH, valPmax, valHc, valFuerza;

    // ─────────────────────────────────────────────────────────
    p.setup = () => {
        const cnv = p.createCanvas(W, H);
        cnv.parent('sim-container-presion');
        p.frameRate(30);

        sliderH   = document.getElementById('slider-H');
        sliderRho = document.getElementById('slider-rho');
        valH      = document.getElementById('val-H');
        valPmax   = document.getElementById('val-pmax');
        valHc     = document.getElementById('val-hc');
        valFuerza = document.getElementById('val-fuerza');
    };

    // ─────────────────────────────────────────────────────────
    p.draw = () => {
        p.background(C_BG);

        // Leer sliders
        H_real = parseFloat(sliderH.value);
        rho    = parseFloat(sliderRho.value);

        // Cálculos físicos
        const P_max = rho * g * H_real;
        const h_c   = (2 / 3) * H_real;
        const F_tot = 0.5 * rho * g * H_real * H_real;

        // ── Posiciones absolutas fijas del muro ──────────────
        const wallTop = PAD_TOP;              // techo del muro (NUNCA cambia)
        const groundY = H - PAD_BOTTOM;      // suelo (NUNCA cambia)

        // ── Nivel del agua: mapeo dinámico ───────────────────
        // H_real = 0  → waterTop en groundY (sin agua)
        // H_real = 20 → waterTop en wallTop  (lleno)
        const waterTop = p.map(H_real, 0, 20, groundY, wallTop);

        // Actualizar telemetría HTML
        updateTelemetry(H_real, P_max, h_c, F_tot);

        // ── Fondo cielo (zona encima del muro) ───────────────
        p.noStroke();
        p.fill(C_SKY);
        p.rect(0, 0, W, wallTop);

        // ── Cuerpo del agua ───────────────────────────────────
        drawWater(waterTop, groundY);

        // ── Muro (estructura fija) con mapa de calor dinámico ─
        drawWall(wallTop, groundY, waterTop);

        // ── Suelo ─────────────────────────────────────────────
        drawGround(groundY);

        // ── Vectores de presión ───────────────────────────────
        drawPressureArrows(waterTop, groundY, P_max);

        // ── Etiquetas del diagrama ────────────────────────────
        drawDiagramLabels(wallTop, groundY, waterTop, h_c, P_max);
    };

    // ─────────────────────────────────────────────────────────
    //  Dibujar cuerpo del agua
    // ─────────────────────────────────────────────────────────
    function drawWater(top, bottom) {
        const waterH = bottom - top;

        // Rectángulo azul de agua
        p.noStroke();
        p.fill(C_WATER);
        p.rect(WATER_X0, top, WALL_X - WATER_X0, waterH);

        // Línea de superficie
        p.stroke(C_WATER_S);
        p.strokeWeight(2);
        p.drawingContext.setLineDash([8, 6]);
        p.line(WATER_X0, top, WALL_X, top);
        p.drawingContext.setLineDash([]);

        // Etiqueta "Superficie libre" encima de la línea
        p.noStroke();
        p.fill('rgba(100,190,255,0.85)');
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(9);
        p.text('Superficie libre  (h = 0)', WATER_X0 + 4, top - 4);

        // Textos interiores (solo si hay suficiente espacio)
        if (waterH >= 40) {
            const textX = WATER_X0 + (WALL_X - WATER_X0) * 0.35;
            const midY  = top + waterH / 2;

            p.fill('rgba(150,210,255,0.5)');
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(13);
            p.textStyle(p.BOLD);
            p.text('AGUA', textX, midY - 9);
            p.textStyle(p.NORMAL);

            p.fill('rgba(150,210,255,0.35)');
            p.textSize(9);
            p.text('ρ = ' + rho + ' kg/m³', textX, midY + 9);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Dibujar muro — estructura rígida con mapa de calor solo
    //  en la zona mojada
    // ─────────────────────────────────────────────────────────
    function drawWall(wallTop, groundY, waterTop) {
        const wetTop    = waterTop;
        const wetBottom = groundY;
        const wetH      = wetBottom - wetTop;

        // ── Zona seca (gris oscuro fijo, arriba del agua) ────
        if (waterTop > wallTop) {
            p.noStroke();
            p.fill('#333333');
            p.rect(WALL_X, wallTop, WALL_W, waterTop - wallTop);
        }

        // ── Zona mojada (mapa de calor: azul → amarillo → rojo)
        if (wetH > 0) {
            const steps = 60;
            for (let i = 0; i < steps; i++) {
                const t  = i / steps;               // 0 = nivel agua, 1 = base
                const y  = wetTop + t * wetH;
                const dy = wetH / steps + 1;

                let r, gr, bl;
                if (t < 0.5) {
                    const tt = t * 2;
                    r  = Math.round(48  + tt * (255 - 48));
                    gr = Math.round(66  + tt * (200 - 66));
                    bl = Math.round(181 * (1 - tt));
                } else {
                    const tt = (t - 0.5) * 2;
                    r  = 255;
                    gr = Math.round(200 * (1 - tt));
                    bl = 0;
                }

                p.noStroke();
                p.fill(r, gr, bl, 220);
                p.rect(WALL_X, y, WALL_W, dy);
            }
        }

        // ── Contorno completo del muro (siempre fijo) ────────
        p.noFill();
        p.stroke('rgba(255,255,255,0.15)');
        p.strokeWeight(1);
        p.rect(WALL_X, wallTop, WALL_W, groundY - wallTop);

        // ── Texto vertical "MURO DE CONTENCIÓN" (siempre fijo)
        p.noStroke();
        p.fill('rgba(255,255,255,0.65)');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(9.5);
        p.textStyle(p.BOLD);
        p.push();
        p.translate(WALL_X + WALL_W / 2, (wallTop + groundY) / 2);
        p.rotate(-p.HALF_PI);
        p.text('MURO DE CONTENCIÓN', 0, 0);
        p.pop();
        p.textStyle(p.NORMAL);
    }

    // ─────────────────────────────────────────────────────────
    //  Dibujar suelo
    // ─────────────────────────────────────────────────────────
    function drawGround(groundY) {
        p.noStroke();
        p.fill(C_GROUND);
        p.rect(0, groundY, W, H - groundY);

        p.stroke('rgba(255,255,255,0.08)');
        p.strokeWeight(1);
        p.line(0, groundY, W, groundY);

        p.stroke('rgba(255,255,255,0.04)');
        for (let x = 0; x < W; x += 16) {
            p.line(x, groundY, x - 12, H);
        }

        p.noStroke();
        p.fill('rgba(255,255,255,0.3)');
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(9);
        p.text('BASE / FUNDACIÓN', WATER_X0, groundY + 6);
    }

    // ─────────────────────────────────────────────────────────
    //  Vectores de presión (flechas) — solo entre waterTop y groundY
    // ─────────────────────────────────────────────────────────
    function drawPressureArrows(waterTop, groundY, P_max) {
        const waterH     = groundY - waterTop;
        const numArrows  = 9;
        const maxArrowLen = 110;
        const arrowSize   = 6;

        // Sin agua: nada que dibujar
        if (waterH < 4) return;

        for (let i = 1; i <= numArrows; i++) {
            const t   = i / numArrows;                   // 0..1 profundidad
            const y   = waterTop + t * waterH;
            const len = t * maxArrowLen;
            const x0  = ARROW_X1 - len;

            const r  = Math.round(p.lerp(100, 246, t));
            const gr = Math.round(p.lerp(180, 130, t));
            const bl = Math.round(p.lerp(255, 213, t));

            p.drawingContext.shadowBlur  = 8;
            p.drawingContext.shadowColor = `rgba(${r},${gr},${bl},0.5)`;

            p.stroke(r, gr, bl);
            p.strokeWeight(1.8);
            p.line(x0, y, ARROW_X1, y);

            p.noStroke();
            p.fill(r, gr, bl);
            p.triangle(
                ARROW_X1,            y,
                ARROW_X1 - arrowSize, y - arrowSize * 0.6,
                ARROW_X1 - arrowSize, y + arrowSize * 0.6
            );

            // Etiqueta presión en la flecha de la base
            if (i === numArrows) {
                p.fill('#FFFAA3');
                p.noStroke();
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(9);
                p.text(`P = ${(rho * g * H_real).toFixed(0)} Pa`, x0 - 4, y);
            }

            // Etiqueta en el punto crítico h_c (≈ flecha 6 de 9)
            if (i === Math.round(numArrows * 2 / 3)) {
                p.fill('#FFFAA3');
                p.noStroke();
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(9);
                p.text(`h_c → ${(rho * g * H_real * (2 / 3)).toFixed(0)} Pa`, x0 - 4, y);
            }
        }

        p.drawingContext.shadowBlur = 0;

        // Envolvente triangular de distribución
        p.stroke('rgba(246,130,213,0.2)');
        p.strokeWeight(1);
        p.drawingContext.setLineDash([4, 6]);
        p.line(ARROW_X1, waterTop, ARROW_X1 - maxArrowLen, groundY);
        p.drawingContext.setLineDash([]);
    }

    // ─────────────────────────────────────────────────────────
    //  Etiquetas del diagrama
    // ─────────────────────────────────────────────────────────
    function drawDiagramLabels(wallTop, groundY, waterTop, h_c, P_max) {
        const waterH = groundY - waterTop;

        // ── Cota H: desde waterTop hasta groundY ─────────────
        const cotaX = WATER_X0 - 18;
        p.stroke('rgba(255,255,255,0.3)');
        p.strokeWeight(1);
        p.line(cotaX, waterTop, cotaX, groundY);
        p.line(cotaX - 4, waterTop, cotaX + 4, waterTop);
        p.line(cotaX - 4, groundY, cotaX + 4, groundY);

        p.noStroke();
        p.fill('rgba(255,255,255,0.65)');
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(10);
        p.text(`H = ${H_real.toFixed(1)} m`, cotaX - 6, waterTop + waterH / 2);

        // ── Cota h_c: 2/3 desde waterTop ─────────────────────
        if (waterH >= 20) {
            const hc_y = waterTop + (2 / 3) * waterH;
            p.stroke('#FFFAA3');
            p.strokeWeight(1);
            p.drawingContext.setLineDash([5, 5]);
            p.line(WATER_X0, hc_y, WALL_X + WALL_W + 50, hc_y);
            p.drawingContext.setLineDash([]);

            p.noStroke();
            p.fill('#FFFAA3');
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(9);
            p.text(`h_c = 2/3 H = ${h_c.toFixed(1)} m`, WALL_X + WALL_W + 4, hc_y);
        }

        // ── Caja de ecuación (esquina superior derecha) ───────
        p.fill('rgba(27,27,27,0.85)');
        p.noStroke();
        p.rect(W - 165, 10, 152, 38, 7);

        p.fill('#F682D5');
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(10);
        p.text('P = ρ · g · h', W - 155, 22);

        p.fill('#FFFAA3');
        p.textSize(9);
        p.text(`P_máx = ${(P_max / 1000).toFixed(1)} kPa`, W - 155, 37);
    }

    // ─────────────────────────────────────────────────────────
    //  Actualizar panel de telemetría HTML
    // ─────────────────────────────────────────────────────────
    function updateTelemetry(H_r, P_max, h_c, F_tot) {
        valH.textContent      = `${H_r.toFixed(1)} m`;
        valPmax.textContent   = `${(P_max / 1000).toFixed(2)} kPa`;
        valHc.textContent     = `${h_c.toFixed(2)} m`;
        valFuerza.textContent = `${(F_tot / 1000).toFixed(2)} kN/m`;
    }

}; // fin sketchPresion

// Montar el sketch de p5.js en modo instancia
new p5(sketchPresion);
