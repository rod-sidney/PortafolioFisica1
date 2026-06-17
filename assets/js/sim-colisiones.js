// Simulación de Colisiones Inelásticas (Fusión de Subsistemas)
// Usando parámetros físicos y conservación de cantidad de movimiento

// Parámetros físicos constantes
const m1 = 5;  // Masa del proyectil (kg)
const m2 = 15; // Masa del bloque (kg)
const v1_init = 6.0;  // Velocidad inicial del proyectil (m/s)
const v2_init = 1.5;  // Velocidad inicial del bloque (m/s)
const totalMass = m1 + m2; // Masa total = 20 kg

// Cálculo teórico pre-impacto
const p_init = m1 * v1_init + m2 * v2_init; // Momento total inicial = 5*6 + 15*1.5 = 52.5 kg*m/s
const v_final = p_init / totalMass; // Velocidad final = 52.5 / 20 = 2.625 m/s

const ke_init = 0.5 * m1 * v1_init * v1_init + 0.5 * m2 * v2_init * v2_init; // Ki = 106.875 J
const ke_final = 0.5 * totalMass * v_final * v_final; // Kf = 68.906 J
const ke_lost = ke_init - ke_final; // Disipación = 37.969 J

// Variables de estado de la simulación
let x1, x2;
let v1, v2;
let hasCollided = false;
let isRunning = false;

// Dimensiones de renderizado
const w1 = 30; // Ancho proyectil
const h1 = 30; // Alto proyectil
const w2 = 60; // Ancho bloque
const h2 = 60; // Alto bloque
const scalePixelsPerMeter = 50; // 50px = 1m

// Elementos de la telemetría del DOM
let elState, elV1, elV2, elVf, elKi, elKf, elKlost;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 300;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Vincular telemetría del DOM
    elState = document.getElementById('val-state');
    elV1 = document.getElementById('val-v1');
    elV2 = document.getElementById('val-v2');
    elVf = document.getElementById('val-vf');
    elKi = document.getElementById('val-ki');
    elKf = document.getElementById('val-kf');
    elKlost = document.getElementById('val-klost');
    
    // Vincular botones
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            isRunning = true;
        });
    }
    
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetSim();
        });
    }
    
    resetSim();
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let dt = min(0.03, deltaTime / 1000.0);
    let floorY = height - 60;
    
    // --- 1. LÓGICA DE MOVIMIENTO Y COLISIÓN ---
    if (isRunning) {
        if (!hasCollided) {
            // Movimiento independiente pre-impacto
            x1 += v1 * scalePixelsPerMeter * dt;
            x2 += v2 * scalePixelsPerMeter * dt;
            
            // Detección de colisión (el proyectil toca al bloque por detrás)
            if (x1 + w1 >= x2) {
                hasCollided = true;
                v1 = v_final;
                v2 = v_final;
                // Ajustar posición exacta de contacto para evitar superposición
                x1 = x2 - w1; 
            }
        } else {
            // Movimiento unificado post-impacto
            x2 += v2 * scalePixelsPerMeter * dt;
            x1 = x2 - w1; // El proyectil queda "incrustado" en la parte trasera del bloque
        }
    }
    
    // Bucle envolvente de pantalla para que no se pierdan
    if (x2 > width + 50) {
        // Reiniciar posiciones al salir
        x1 = -100;
        x2 = x1 + 200;
        if (hasCollided) {
            x1 = 50;
            x2 = x1 + w1;
        }
    }
    
    // --- 2. DIBUJO DE ELEMENTOS ---
    
    // Pista de deslizamiento
    stroke(48, 66, 181, 150); // #3042B5
    strokeWeight(4);
    line(0, floorY, width, floorY);
    
    // Dibujar el Bloque (m2 = 15 kg)
    let y2 = floorY - h2;
    noStroke();
    fill(48, 66, 181); // #3042B5
    rect(x2, y2, w2, h2, 4);
    
    // Dibujar el Proyectil (m1 = 5 kg)
    let y1 = floorY - h1;
    if (hasCollided) {
        // Si chocaron, dibujar el proyectil acoplado (se pinta de rosa #F682D5)
        fill(246, 130, 213);
        rect(x1, y1, w1, h1, 4);
        
        // Efecto visual de soldadura/deformación (chispas o líneas de contacto)
        stroke(255, 250, 163); // #FFFAA3
        strokeWeight(2);
        line(x2, y1, x2, floorY);
    } else {
        // Antes del impacto
        fill(246, 130, 213); // #F682D5
        rect(x1, y1, w1, h1, 4);
    }
    
    // Etiquetas de masas
    noStroke();
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text("5 kg", x1 + w1 / 2, y1 + h1 / 2);
    text("15 kg", x2 + w2 / 2, y2 + h2 / 2);
    
    // --- 3. DIBUJAR VECTORES DE VELOCIDAD ---
    if (isRunning) {
        if (!hasCollided) {
            // Vector proyectil (v1 = 6.0)
            drawVelocityVector(x1 + w1 / 2, y1 - 15, v1 * 8, color(246, 130, 213));
            // Vector bloque (v2 = 1.5)
            drawVelocityVector(x2 + w2 / 2, y2 - 15, v2 * 8, color(170, 162, 245));
        } else {
            // Vector unificado (vf = 2.625)
            drawVelocityVector(x2 + w2 / 2, y2 - 15, v_final * 8, color(255, 250, 163)); // Amarillo
        }
    }
    
    // --- 4. ACTUALIZAR TELEMETRÍA EN EL DOM ---
    updateTelemetry();
}

function drawVelocityVector(x, y, len, col) {
    if (len <= 0) return;
    stroke(col);
    strokeWeight(2);
    line(x, y, x + len, y);
    // Punta de flecha
    fill(col);
    noStroke();
    triangle(x + len, y, x + len - 5, y - 3, x + len - 5, y + 3);
}

function updateTelemetry() {
    let stateText = "Listo para iniciar";
    if (isRunning) {
        stateText = hasCollided ? "Post-Colisión (Unificados)" : "Pre-Colisión (Desplazamiento)";
    }
    
    if (elState) elState.innerText = stateText;
    
    if (hasCollided) {
        if (elV1) elV1.innerText = v_final.toFixed(3) + " m/s";
        if (elV2) elV2.innerText = v_final.toFixed(3) + " m/s";
        if (elVf) elVf.innerText = v_final.toFixed(3) + " m/s";
        if (elKi) elKi.innerText = ke_init.toFixed(3) + " J";
        if (elKf) elKf.innerText = ke_final.toFixed(3) + " J";
        if (elKlost) elKlost.innerText = ke_lost.toFixed(3) + " J (Disipada)";
    } else {
        if (elV1) elV1.innerText = v1.toFixed(1) + " m/s";
        if (elV2) elV2.innerText = v2.toFixed(1) + " m/s";
        if (elVf) elVf.innerText = "Calculando...";
        if (elKi) elKi.innerText = "106.875 J";
        if (elKf) elKf.innerText = "Calculando...";
        if (elKlost) elKlost.innerText = "Calculando...";
    }
}

function resetSim() {
    isRunning = false;
    hasCollided = false;
    x1 = 40;
    x2 = 240;
    v1 = v1_init;
    v2 = v2_init;
    updateTelemetry();
}

function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 300);
        resetSim();
    }
}
