// Simulación de Trabajo y Energía: Martinete de Impacto
// Usando parámetros físicos reales y deltaTime para una respuesta física precisa

// Estados de la simulación
const STATE_IDLE = 'IDLE';
const STATE_FALL = 'FALL';
const STATE_IMPACT = 'IMPACT';
const STATE_STOPPED = 'STOPPED';

let currentState = STATE_IDLE;

// Parámetros físicos
const mass = 50; // Masa del martinete (kg)
const g = 9.8; // Aceleración de la gravedad (m/s^2)
const Fg = mass * g; // Fuerza de gravedad (N) = 490 N
let fResistance = 1500; // Fuerza de resistencia del suelo (N)

// Variables de movimiento
let blockY = 40; // Posición Y inicial del bloque (px)
let blockV = 0; // Velocidad (m/s)
let blockA = 0; // Aceleración (m/s^2)
let ke = 0; // Energía cinética (J)
let keImpact = 0; // Energía cinética justo en el momento del impacto (J)
let dx = 0; // Profundidad de penetración (m)
let initialGroundY = 260; // Posición Y del suelo (px)
let blockWidth = 50;
let blockHeight = 80;
let scalePixelsPerMeter = 100; // 100px = 1m

// Elementos del DOM para la telemetría y controles
let elState, elV, elKe, elKeImpact, elFResistance, elDx, elHardnessSlider, elHardnessValue;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Vincular elementos de telemetría del DOM
    elState = document.getElementById('val-state');
    elV = document.getElementById('val-v');
    elKe = document.getElementById('val-ke');
    elKeImpact = document.getElementById('val-ke-impact');
    elFResistance = document.getElementById('val-f-resistance');
    elDx = document.getElementById('val-dx');
    
    // Vincular controles del DOM
    elHardnessSlider = document.getElementById('slider-hardness');
    elHardnessValue = document.getElementById('val-hardness-slider');
    
    if (elHardnessSlider) {
        elHardnessSlider.addEventListener('input', (e) => {
            fResistance = parseFloat(e.target.value);
            if (elHardnessValue) {
                elHardnessValue.innerText = fResistance + " N";
            }
            if (currentState === STATE_IDLE || currentState === STATE_STOPPED) {
                if (elFResistance) elFResistance.innerText = fResistance + " N";
            }
        });
    }
    
    const btnDrop = document.getElementById('btn-drop');
    if (btnDrop) {
        btnDrop.addEventListener('click', () => {
            if (currentState === STATE_IDLE) {
                currentState = STATE_FALL;
            }
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
    
    let dt = min(0.03, deltaTime / 1000.0); // Limitar dt para estabilidad
    let blockBottom = blockY + blockHeight;
    let blockCenterX = width / 2;
    
    // --- 1. ACTUALIZAR FÍSICA SEGÚN EL ESTADO ---
    if (currentState === STATE_FALL) {
        // Caída libre
        blockA = g;
        blockV += blockA * dt;
        blockY += blockV * dt * scalePixelsPerMeter;
        ke = 0.5 * mass * blockV * blockV;
        
        // Comprobar colisión con el suelo
        if (blockY + blockHeight >= initialGroundY) {
            currentState = STATE_IMPACT;
            // Ajustar posición al ras del suelo inicialmente para precisión
            blockY = initialGroundY - blockHeight;
            keImpact = ke;
            if (elKeImpact) elKeImpact.innerText = keImpact.toFixed(2) + " J";
        }
    } else if (currentState === STATE_IMPACT) {
        // Penetración del suelo (Desaceleración por Trabajo de resistencia)
        // Fnet = Fg - F_resistencia (hacia abajo es positivo)
        let Fnet = Fg - fResistance;
        blockA = Fnet / mass; // Negativo (desaceleración)
        blockV += blockA * dt;
        
        // Detenerse cuando la velocidad llegue a cero
        if (blockV <= 0) {
            blockV = 0;
            blockA = 0;
            ke = 0;
            currentState = STATE_STOPPED;
        } else {
            blockY += blockV * dt * scalePixelsPerMeter;
            ke = 0.5 * mass * blockV * blockV;
        }
        
        // Calcular penetración actual
        dx = (blockY + blockHeight - initialGroundY) / scalePixelsPerMeter;
    } else if (currentState === STATE_STOPPED) {
        blockV = 0;
        blockA = 0;
        ke = 0;
        dx = (blockY + blockHeight - initialGroundY) / scalePixelsPerMeter;
    } else {
        // STATE_IDLE
        blockV = 0;
        blockA = 0;
        ke = 0;
        dx = 0;
    }
    
    // --- 2. DIBUJAR ELEMENTOS EN EL CANVAS ---
    
    // Suelo (Fondo y línea de superficie)
    // Dibujar el área de suelo como un gradiente o área rellena
    noStroke();
    fill(48, 66, 181, 30); // #3042B5 con opacidad
    rect(0, initialGroundY, width, height - initialGroundY);
    
    stroke(48, 66, 181, 180); // Línea de suelo #3042B5
    strokeWeight(4);
    line(0, initialGroundY, width, initialGroundY);
    
    // Línea de referencia original (punteada fina si se hunde)
    if (dx > 0) {
        stroke(255, 255, 255, 60);
        strokeWeight(1);
        for (let i = 0; i < width; i += 10) {
            line(i, initialGroundY, i + 5, initialGroundY);
        }
    }
    
    // Dibujar el Martinete (Bloque)
    let drawX = blockCenterX - blockWidth / 2;
    noStroke();
    fill(246, 130, 213); // #F682D5
    rect(drawX, blockY, blockWidth, blockHeight, 6);
    
    // Detalles del martinete (Estética industrial)
    fill(27);
    rect(drawX + 8, blockY + 8, blockWidth - 16, blockHeight - 16, 4);
    
    // Líneas estructurales
    stroke(246, 130, 213, 100);
    strokeWeight(1.5);
    line(drawX + 8, blockY + 8, drawX + blockWidth - 8, blockY + blockHeight - 8);
    line(drawX + blockWidth - 8, blockY + 8, drawX + 8, blockY + blockHeight - 8);
    
    // Texto de masa
    noStroke();
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text("50 kg", blockCenterX, blockY + blockHeight / 2);
    
    // --- 3. DIBUJAR VECTORES Y ACOTACIONES ---
    let vectorStartY = blockY + blockHeight / 2;
    
    if (currentState === STATE_FALL) {
        // Fuerza de Gravedad (Fg = 490 N)
        drawVector(blockCenterX, vectorStartY, Fg * 0.1, HALF_PI, color(246, 130, 213));
        fill(246, 130, 213);
        textSize(11);
        textAlign(LEFT, CENTER);
        text(`Fg: ${Fg.toFixed(0)} N`, blockCenterX + 35, vectorStartY + 20);
    } else if (currentState === STATE_IMPACT) {
        // Gravedad (Fg = 490 N)
        drawVector(blockCenterX, vectorStartY, Fg * 0.1, HALF_PI, color(246, 130, 213));
        
        // Resistencia del Suelo (Fr = slider N)
        drawVector(blockCenterX, blockY + blockHeight, fResistance * 0.05, -HALF_PI, color(255, 250, 163)); // #FFFAA3
        
        fill(255, 250, 163);
        textSize(11);
        textAlign(LEFT, CENTER);
        text(`Fr: ${fResistance} N`, blockCenterX + 35, blockY + blockHeight - 20);
    }
    
    // Dibujar acotación de la profundidad de penetración (dx)
    if (dx > 0) {
        let dimensionX = blockCenterX - blockWidth / 2 - 25;
        stroke(255, 250, 163); // #FFFAA3
        strokeWeight(1.5);
        // Línea vertical de cota
        line(dimensionX, initialGroundY, dimensionX, blockY + blockHeight);
        // Flechas de cota
        line(dimensionX - 4, initialGroundY + 5, dimensionX, initialGroundY);
        line(dimensionX + 4, initialGroundY + 5, dimensionX, initialGroundY);
        line(dimensionX - 4, blockY + blockHeight - 5, dimensionX, blockY + blockHeight);
        line(dimensionX + 4, blockY + blockHeight - 5, dimensionX, blockY + blockHeight);
        
        // Texto de cota
        noStroke();
        fill(255, 250, 163);
        textSize(12);
        textAlign(RIGHT, CENTER);
        text(`Δx = ${dx.toFixed(3)} m`, dimensionX - 8, initialGroundY + (dx * scalePixelsPerMeter) / 2);
    }
    
    // --- 4. ACTUALIZAR TELEMETRÍA EN EL DOM ---
    updateTelemetry();
}

function drawVector(x, y, len, angle, col) {
    push();
    translate(x, y);
    rotate(angle);
    stroke(col);
    strokeWeight(2.5);
    line(0, 0, len, 0);
    
    let arrowSize = 6;
    fill(col);
    noStroke();
    triangle(len, 0, len - arrowSize, -arrowSize / 2, len - arrowSize, arrowSize / 2);
    pop();
}

function updateTelemetry() {
    let stateText = "Listo";
    if (currentState === STATE_IDLE) stateText = "Listo para soltar";
    else if (currentState === STATE_FALL) stateText = "Caída Libre (Acelerando)";
    else if (currentState === STATE_IMPACT) stateText = "Impacto (Desacelerando)";
    else if (currentState === STATE_STOPPED) stateText = "Detenido (Trabajo Completado)";
    
    if (elState) elState.innerText = stateText;
    if (elV) elV.innerText = blockV.toFixed(2) + " m/s";
    if (elKe) elKe.innerText = ke.toFixed(2) + " J";
    if (elFResistance) elFResistance.innerText = fResistance + " N";
    if (elDx) elDx.innerText = dx.toFixed(3) + " m";
}

function resetSim() {
    currentState = STATE_IDLE;
    blockY = 40;
    blockV = 0;
    blockA = 0;
    ke = 0;
    keImpact = 0;
    dx = 0;
    
    if (elKeImpact) elKeImpact.innerText = "0.00 J";
    if (elHardnessSlider) {
        fResistance = parseFloat(elHardnessSlider.value);
    }
    updateTelemetry();
}

function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 400);
        resetSim();
    }
}
