// ============================================================
//  sim-ariete.js — Simulador SCADA: Detector de Golpe de Ariete
//  Sliding-Window dP/dt Detector (Ecuacion de Joukowsky)
//  Portafolio Fisica I — Universidad CENFOTEC
// ============================================================

const sketchAriete = (p) => {

    // ── Canvas ────────────────────────────────────────────────
    let W;                     // ancho dinamico, se resuelve en setup()
    const H   = 380;
    let MID;                   // se recalcula tras conocer W

    // ── Colores (paleta estricta) ─────────────────────────────
    const C_BG        = '#1B1B1B';
    const C_PIPE      = '#333333';
    const C_WATER     = '#3042B5';
    const C_CHART_OK  = '#FFFAA3';
    const C_ALARM     = '#F64747';
    const C_CAVIT     = '#FFAA00';
    const C_TEXT      = '#E0E0E0';
    const C_GRID      = '#2A2A2A';
    const C_CHART_BG  = '#111111';

    // ── Fisica ────────────────────────────────────────────────
    const P_BASE      = 300;   // kPa presion base operativa
    const RHO         = 1000;  // kg/m3 densidad del agua
    const C_WAVE      = 1200;  // m/s velocidad de onda en acero-agua
    const DP_UMBRAL   = 500;   // kPa/s umbral de alarma dP/dt
    const P_CAVIT     = 50;    // kPa umbral de cavitacion
    const P_CAVIT_MIN = 10;    // kPa piso fisico (sin presion negativa)

    // ── Estado de simulacion ──────────────────────────────────
    let presionActual   = P_BASE;
    let dpdt            = 0;
    let alarmaActiva    = false;
    let alarmaLatch     = false;
    let cavitacionActiva = false;
    let simulando       = false;
    let tiempoSim       = 0;
    let tcCierre        = 1.0;
    let velocidadV      = 5.0;

    // ── Historial de presion (grafica scrolling) ───────────────
    let MAX_HIST;
    let histPresion = [];

    // ── Ventana deslizante (sliding window) ───────────────────
    const WIN_SIZE = 10;
    let ventana    = [];

    // ── Particulas de flujo en tuberia ───────────────────────
    const NUM_PART = 18;
    let particulas = [];

    // ── Valvula ───────────────────────────────────────────────
    let valvulaAngulo = 0;
    let valvulaEstado = 'ABIERTA';

    // ── DOM ───────────────────────────────────────────────────
    let sliderTc, sliderV;
    let telP, telDp, telValvula, telAlarma;
    let btnEjecutar, btnReset;

    // ── Parpadeo de alarma ────────────────────────────────────
    let blinkTimer   = 0;
    let blinkVisible = true;

    // ─────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────
    p.setup = () => {
        // Ancho dinamico: ocupa el contenedor padre al 100 %
        const contenedor = document.getElementById('sim-container-ariete');
        W        = contenedor ? contenedor.clientWidth : 560;
        MID      = H / 2;
        MAX_HIST = W - 40;

        const cnv = p.createCanvas(W, H);
        cnv.parent('sim-container-ariete');
        p.frameRate(60);
        p.textFont('monospace');

        // Inicializar historial
        for (let i = 0; i < MAX_HIST; i++) histPresion.push(P_BASE);

        // Inicializar ventana deslizante
        for (let i = 0; i < WIN_SIZE; i++) ventana.push(P_BASE);

        // Inicializar particulas
        inicializarParticulas();

        // Capturar referencias DOM
        sliderTc    = document.getElementById('slider-tc-ariete');
        sliderV     = document.getElementById('slider-v-ariete');
        telP        = document.getElementById('tel-presion');
        telDp       = document.getElementById('tel-dpdt');
        telValvula  = document.getElementById('tel-valvula');
        telAlarma   = document.getElementById('tel-alarma');
        btnEjecutar = document.getElementById('btn-ejecutar-ariete');
        btnReset    = document.getElementById('btn-reset-ariete');

        if (btnEjecutar) btnEjecutar.addEventListener('click', ejecutarCierre);
        if (btnReset)    btnReset.addEventListener('click', restablecerSistema);
    };

    // ─────────────────────────────────────────────────────────
    // DRAW
    // ─────────────────────────────────────────────────────────
    p.draw = () => {
        p.background(C_BG);

        if (sliderTc) tcCierre   = parseFloat(sliderTc.value);
        if (sliderV)  velocidadV = parseFloat(sliderV.value);

        actualizarFisica();
        actualizarSlidingWindow();
        actualizarParticulas();

        blinkTimer++;
        if (blinkTimer % 18 === 0) blinkVisible = !blinkVisible;

        dibujarTuberia();

        p.stroke(C_PIPE);
        p.strokeWeight(1.5);
        p.line(20, MID, W - 20, MID);

        dibujarGrafica();
        actualizarTelemetria();
    };

    // ─────────────────────────────────────────────────────────
    // FISICA
    // ─────────────────────────────────────────────────────────
    function actualizarFisica() {
        if (!simulando) return;

        const dt = 1 / p.frameRate();
        tiempoSim += dt;

        valvulaAngulo = p.min(tiempoSim / tcCierre, 1.0);

        if (valvulaAngulo < 0.5) {
            valvulaEstado = 'CERRANDO';
        } else if (valvulaAngulo < 1.0) {
            valvulaEstado = 'CERRANDO...';
        } else {
            valvulaEstado = 'CERRADA';
        }

        // Ecuacion de Joukowsky simplificada
        const deltaP_max = (RHO * C_WAVE * velocidadV) / 1000;
        const severidad  = p.constrain(1.0 / (tcCierre * 0.8), 0.05, 4.0);

        let presionCalc = P_BASE;

        if (valvulaAngulo > 0) {
            const tOnd = tiempoSim - (tcCierre * 0.3);
            if (tOnd > 0) {
                const omega    = 2 * Math.PI * (1.5 / tcCierre);
                const decay    = Math.exp(-tOnd * (1.5 + severidad * 0.5));
                const amplitud = deltaP_max * severidad;
                presionCalc    = P_BASE + amplitud * decay * Math.sin(omega * tOnd);
            } else {
                presionCalc = P_BASE + (deltaP_max * 0.3 * severidad) * (tiempoSim / tcCierre);
            }
        }

        // Ruido de sensor (realismo SCADA)
        presionCalc += (Math.random() - 0.5) * 4;

        // Cavitacion: si la presion cae por debajo del umbral, limitarla
        if (presionCalc < P_CAVIT) {
            cavitacionActiva = true;
            presionCalc = P_CAVIT_MIN + (Math.random() - 0.5) * 3;
        }

        presionActual = p.max(0, presionCalc);

        histPresion.push(presionActual);
        if (histPresion.length > MAX_HIST) histPresion.shift();

        if (tiempoSim > 8) simulando = false;
    }

    // ─────────────────────────────────────────────────────────
    // SLIDING WINDOW dP/dt
    // ─────────────────────────────────────────────────────────
    function actualizarSlidingWindow() {
        ventana.push(presionActual);
        if (ventana.length > WIN_SIZE) ventana.shift();

        const dt_ventana = WIN_SIZE / p.frameRate();
        dpdt = (ventana[ventana.length - 1] - ventana[0]) / dt_ventana;

        if (dpdt > DP_UMBRAL && simulando) {
            alarmaActiva = true;
            alarmaLatch  = true;
        }

        if (!simulando && alarmaLatch) alarmaActiva = alarmaLatch;
    }

    // ─────────────────────────────────────────────────────────
    // PARTICULAS DE FLUJO
    // ─────────────────────────────────────────────────────────
    function inicializarParticulas() {
        particulas = [];
        for (let i = 0; i < NUM_PART; i++) {
            particulas.push({
                x: p.random(40, W - 120),
                y: p.random(MID * 0.35, MID * 0.65),
                vel: p.random(1.5, 3.0)
            });
        }
    }

    function actualizarParticulas() {
        const factorVel = simulando ? (1.0 - valvulaAngulo * 0.95) : 1.0;
        for (let pt of particulas) {
            pt.x += pt.vel * factorVel;
            if (pt.x > W - 120) {
                pt.x = 40;
                pt.y = p.random(MID * 0.35, MID * 0.65);
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // DIBUJO: TUBERIA ESQUEMATICA
    // ─────────────────────────────────────────────────────────
    function dibujarTuberia() {
        const pipeY1 = MID * 0.25;
        const pipeY2 = MID * 0.75;
        const pipeH  = pipeY2 - pipeY1;
        const pipeX1 = 40;
        const pipeX2 = W - 100;
        const valveX = W - 130;

        p.noStroke();
        p.fill(C_CHART_BG);
        p.rect(0, 0, W, MID - 1);

        p.fill(C_TEXT);
        p.noStroke();
        p.textSize(9);
        p.textAlign(p.LEFT, p.TOP);
        p.text('ESQUEMA DE TUBERIA — VISTA FUNCIONAL', 10, 6);

        p.noStroke();
        p.fill(C_PIPE);
        p.rect(pipeX1, pipeY1, pipeX2 - pipeX1, pipeH, 4);

        // Color del agua segun cavitacion
        const waterColor = cavitacionActiva ? (blinkVisible ? '#B0C8FF' : C_WATER) : C_WATER;
        p.fill(waterColor);
        p.rect(pipeX1, pipeY1 + 3, pipeX2 - pipeX1, pipeH - 6, 2);

        // Color de particulas segun estado
        const alarmaColor = cavitacionActiva
            ? (blinkVisible ? C_CAVIT : '#FFDDAA')
            : (alarmaLatch && blinkVisible ? C_ALARM : '#7AADFF');
        p.fill(alarmaColor);
        p.noStroke();
        for (let pt of particulas) {
            if (pt.x < valveX - 6) {
                p.ellipse(pt.x, pt.y, 5, 3);
            }
        }

        // Valvula compuerta
        const gateH_max = pipeH - 6;
        const gateH_cur = gateH_max * valvulaAngulo;

        p.fill(C_PIPE);
        p.noStroke();
        p.rect(valveX - 6, pipeY1, 12, pipeH, 2);

        if (valvulaAngulo > 0) {
            p.fill('#888888');
            p.rect(valveX - 8, pipeY1 + 3, 16, gateH_cur, 1);
        }

        p.fill('#AAAAAA');
        p.rect(valveX - 4, pipeY1 - 18, 8, 18);
        p.fill('#888888');
        p.ellipse(valveX, pipeY1 - 22, 12, 8);

        const ledColor = valvulaAngulo === 0 ? '#00FF88' :
                         valvulaAngulo >= 1   ? C_ALARM   : '#FFAA00';
        p.fill(ledColor);
        p.ellipse(valveX, pipeY1 - 32, 8, 8);

        // Sensor de presion
        const sensorX = valveX - 80;
        p.fill(C_PIPE);
        p.noStroke();
        p.rect(sensorX - 5, pipeY1 - 2, 10, 10);
        const sensorColor = cavitacionActiva ? C_CAVIT : (alarmaLatch ? C_ALARM : '#FFFAA3');
        p.fill(sensorColor);
        p.ellipse(sensorX, pipeY1 - 8, 14, 14);
        p.fill(C_BG);
        p.textSize(6);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('P', sensorX, pipeY1 - 8);

        p.fill(C_TEXT);
        p.textSize(7.5);
        p.textAlign(p.CENTER, p.TOP);
        p.text('PT-01', sensorX, pipeY1 - 18);

        p.stroke(alarmaColor);
        p.strokeWeight(1.2);
        p.noFill();
        for (let fx = pipeX1 + 30; fx < valveX - 30; fx += 55) {
            p.line(fx, MID * 0.5, fx + 18, MID * 0.5);
            p.line(fx + 18, MID * 0.5, fx + 13, MID * 0.5 - 4);
            p.line(fx + 18, MID * 0.5, fx + 13, MID * 0.5 + 4);
        }

        p.noStroke();
        p.fill(C_TEXT);
        p.textSize(8);
        p.textAlign(p.LEFT, p.CENTER);
        p.text('FLUJO', pipeX1 + 5, MID * 0.5);

        p.textAlign(p.CENTER, p.TOP);
        p.textSize(8);
        p.fill(C_TEXT);
        p.text('VALVULA-01', valveX, pipeY2 + 6);

        const pDispColor = cavitacionActiva && blinkVisible ? C_CAVIT :
                           alarmaLatch && blinkVisible ? C_ALARM : C_CHART_OK;
        p.textSize(9);
        p.fill(pDispColor);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text(presionActual.toFixed(1) + ' kPa', sensorX - 30, pipeY1 - 20);
    }

    // ─────────────────────────────────────────────────────────
    // DIBUJO: GRAFICA DE PRESION (SCROLLING CHART)
    // ─────────────────────────────────────────────────────────
    function dibujarGrafica() {
        const gX = 20;
        const gY = MID + 12;
        const gW = W - 40;
        const gH = H - MID - 20;

        p.noStroke();
        p.fill(C_CHART_BG);
        p.rect(gX, gY, gW, gH, 4);

        const P_MIN     = 0;
        const P_MAX     = 1200;
        const gridLines = [0, 300, 600, 900, 1200];

        p.textSize(8);
        p.textAlign(p.RIGHT, p.CENTER);
        for (let pVal of gridLines) {
            const yGrid = gY + gH - ((pVal - P_MIN) / (P_MAX - P_MIN)) * gH;
            p.stroke(C_GRID);
            p.strokeWeight(0.8);
            p.line(gX, yGrid, gX + gW, yGrid);
            p.noStroke();
            p.fill(C_TEXT);
            p.text(pVal, gX - 2, yGrid);
        }

        // Linea umbral de alarma
        const yUmbral = gY + gH - ((900 - P_MIN) / (P_MAX - P_MIN)) * gH;
        p.stroke(C_ALARM);
        p.strokeWeight(0.7);
        p.drawingContext.setLineDash([4, 4]);
        p.line(gX, yUmbral, gX + gW, yUmbral);
        p.drawingContext.setLineDash([]);
        p.noStroke();
        p.fill(C_ALARM);
        p.textSize(7);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('UMBRAL CRITICO', gX + 4, yUmbral - 2);

        // Linea umbral de cavitacion
        const yCavit = gY + gH - ((P_CAVIT - P_MIN) / (P_MAX - P_MIN)) * gH;
        p.stroke(C_CAVIT);
        p.strokeWeight(0.7);
        p.drawingContext.setLineDash([2, 6]);
        p.line(gX, yCavit, gX + gW, yCavit);
        p.drawingContext.setLineDash([]);
        p.noStroke();
        p.fill(C_CAVIT);
        p.textSize(7);
        p.textAlign(p.LEFT, p.TOP);
        p.text('UMBRAL CAVITACION', gX + 4, yCavit + 2);

        // Linea base
        const yBase = gY + gH - ((P_BASE - P_MIN) / (P_MAX - P_MIN)) * gH;
        p.stroke('#3042B5');
        p.strokeWeight(0.7);
        p.drawingContext.setLineDash([3, 5]);
        p.line(gX, yBase, gX + gW, yBase);
        p.drawingContext.setLineDash([]);
        p.noStroke();
        p.fill('#7AADFF');
        p.textSize(7);
        p.textAlign(p.LEFT, p.TOP);
        p.text('P_BASE = 300 kPa', gX + 4, yBase + 2);

        // Curva de presion
        const useColor = cavitacionActiva && blinkVisible ? C_CAVIT :
                         alarmaLatch && blinkVisible ? C_ALARM : C_CHART_OK;
        p.stroke(useColor);
        p.strokeWeight((alarmaLatch || cavitacionActiva) ? 2.2 : 1.5);
        p.noFill();
        p.beginShape();
        const startIdx = Math.max(0, histPresion.length - gW);
        for (let i = startIdx; i < histPresion.length; i++) {
            const ix        = gX + (i - startIdx);
            const iy        = gY + gH - ((histPresion[i] - P_MIN) / (P_MAX - P_MIN)) * gH;
            const iyClamped = p.constrain(iy, gY, gY + gH);
            p.vertex(ix, iyClamped);
        }
        p.endShape();

        // Etiquetas de ejes
        p.noStroke();
        p.fill(C_TEXT);
        p.textSize(8);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('TIEMPO (s) — desplazamiento en tiempo real', gX + gW / 2, gY + gH + 12);

        p.push();
        p.translate(gX - 14, gY + gH / 2);
        p.rotate(-Math.PI / 2);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text('PRESION (kPa)', 0, 0);
        p.pop();

        p.textSize(8.5);
        p.textAlign(p.LEFT, p.TOP);
        p.fill(C_TEXT);
        p.text('GRAFICA EN TIEMPO REAL — PRESION vs TIEMPO', gX + 2, gY + 3);

        const dpdtColor = dpdt > DP_UMBRAL ? C_ALARM : C_CHART_OK;
        p.fill(dpdtColor);
        p.textSize(8);
        p.textAlign(p.RIGHT, p.TOP);
        p.text('dP/dt: ' + dpdt.toFixed(0) + ' kPa/s', gX + gW - 4, gY + 3);

        // Overlay de alarma o cavitacion
        if (cavitacionActiva && blinkVisible) {
            p.noStroke();
            p.fill(255, 170, 0, 25);
            p.rect(gX, gY, gW, gH, 4);
        } else if (alarmaLatch && blinkVisible) {
            p.noStroke();
            p.fill(246, 71, 71, 30);
            p.rect(gX, gY, gW, gH, 4);
        }
    }

    // ─────────────────────────────────────────────────────────
    // TELEMETRIA DOM
    // ─────────────────────────────────────────────────────────
    function actualizarTelemetria() {
        if (!telP) return;

        telP.textContent       = presionActual.toFixed(1) + ' kPa';
        telDp.textContent      = dpdt.toFixed(0) + ' kPa/s';
        telValvula.textContent = valvulaEstado;

        if (cavitacionActiva) {
            // Prioridad de mensaje: cavitacion sobre alarma de presion alta
            const msg = blinkVisible ? 'PELIGRO: CAVITACION' : '-- VAPORIZACION --';
            telAlarma.textContent = msg;
            telAlarma.style.color = C_CAVIT;
            telP.style.color      = C_CAVIT;
            telDp.style.color     = C_CHART_OK;
        } else if (alarmaLatch) {
            const msg = blinkVisible ? 'EMERGENCIA: BOMBAS DETENIDAS' : '-- ALARMA ACTIVA --';
            telAlarma.textContent = msg;
            telAlarma.style.color = C_ALARM;
            telP.style.color      = C_ALARM;
            telDp.style.color     = C_ALARM;
        } else {
            telAlarma.textContent = 'NORMAL';
            telAlarma.style.color = '#00FF88';
            telP.style.color      = C_CHART_OK;
            telDp.style.color     = C_CHART_OK;
        }

        const ledValvula = document.getElementById('led-valvula');
        if (ledValvula) {
            if (valvulaEstado === 'CERRADA') {
                ledValvula.style.backgroundColor = C_ALARM;
                ledValvula.style.boxShadow       = '0 0 6px ' + C_ALARM;
            } else if (valvulaEstado === 'ABIERTA') {
                ledValvula.style.backgroundColor = '#00FF88';
                ledValvula.style.boxShadow       = '0 0 6px #00FF88';
            } else {
                ledValvula.style.backgroundColor = '#FFAA00';
                ledValvula.style.boxShadow       = '0 0 6px #FFAA00';
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // ACCION: EJECUTAR CIERRE DE VALVULA
    // ─────────────────────────────────────────────────────────
    function ejecutarCierre() {
        if (simulando) return;
        restablecerSistema();
        simulando = true;
    }

    // ─────────────────────────────────────────────────────────
    // ACCION: RESTABLECER SISTEMA
    // ─────────────────────────────────────────────────────────
    function restablecerSistema() {
        simulando        = false;
        tiempoSim        = 0;
        valvulaAngulo    = 0;
        valvulaEstado    = 'ABIERTA';
        alarmaActiva     = false;
        alarmaLatch      = false;
        cavitacionActiva = false;
        presionActual    = P_BASE;
        dpdt             = 0;

        histPresion = [];
        for (let i = 0; i < MAX_HIST; i++) histPresion.push(P_BASE);

        ventana = [];
        for (let i = 0; i < WIN_SIZE; i++) ventana.push(P_BASE);
    }

};

// Montar sketch al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    new p5(sketchAriete);
});
