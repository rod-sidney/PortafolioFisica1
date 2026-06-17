// Simulación de Impulso y Cantidad de Movimiento
// Usando parámetros físicos en un entorno de gravedad cero

// Parámetros de la simulación
const shipMass = 20; // Masa de la nave (kg)
const thrusterForce = 400; // Fuerza del propulsor (N)
const thrustDuration = 0.1; // Duración del impulso (s) = 100ms
const impulseValue = thrusterForce * thrustDuration; // I = F * dt = 40 N*s

// Variables de estado
let shipX, shipY;
let shipVx = 0; // Velocidad X (m/s)
let shipVy = 0; // Velocidad Y (m/s)
let shipAngle = 0; // Ángulo de orientación de la nave (radianes)
let lastImpulseAngle = 0;
let isThrusting = false;
let thrustStartTime = 0;

// Elementos del DOM para la telemetría
let elState, elV, elP, elI, elF, elDt;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Inicializar posición de la nave en el centro
    shipX = width / 2;
    shipY = height / 2;
    
    // Vincular elementos de la telemetría
    elState = document.getElementById('val-state');
    elV = document.getElementById('val-v');
    elP = document.getElementById('val-p');
    elI = document.getElementById('val-i');
    elF = document.getElementById('val-f');
    elDt = document.getElementById('val-dt');
    
    // Vincular botones
    const btnThrust = document.getElementById('btn-thrust');
    if (btnThrust) {
        btnThrust.addEventListener('click', () => {
            applyThrustImpulse();
        });
    }
    
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetSim();
        });
    }
    
    updateTelemetry();
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    // 1. CONTROL DE TIEMPO DEL IMPULSO (100ms)
    if (isThrusting) {
        if (millis() - thrustStartTime >= 100) {
            isThrusting = false;
        }
    }
    
    // 2. ACTUALIZAR POSICIÓN DE LA NAVE (MRU en gravedad cero)
    // Escala: 1 m/s = 50 píxeles por segundo
    let dt = deltaTime / 1000.0;
    shipX += shipVx * 50 * dt;
    shipY += shipVy * 50 * dt;
    
    // Límites de pantalla envolventes (wrap-around)
    if (shipX > width + 20) shipX = -20;
    else if (shipX < -20) shipX = width + 20;
    
    if (shipY > height + 20) shipY = -20;
    else if (shipY < -20) shipY = height + 20;
    
    // 3. DIBUJAR LA NAVE Y DETALLES
    push();
    translate(shipX, shipY);
    rotate(shipAngle);
    
    // Estilo de la nave (forma de punta de flecha aerodinámica)
    noStroke();
    fill(246, 130, 213); // #F682D5
    beginShape();
    vertex(20, 0);       // Punta
    vertex(-15, -12);    // Ala izquierda
    vertex(-8, 0);       // Centro trasero
    vertex(-15, 12);     // Ala derecha
    endShape(CLOSE);
    
    // Ventana/Cabina de la nave
    fill(48, 66, 181); // #3042B5
    ellipse(3, 0, 8, 5);
    
    // Dibujar el fuego del propulsor si está activo
    if (isThrusting) {
        // Fuego parpadeante (amarillo #FFFAA3 y naranja)
        fill(255, 250, 163);
        beginShape();
        vertex(-9, 0);
        vertex(-25 - random(5, 15), -6);
        vertex(-18, 0);
        vertex(-25 - random(5, 15), 6);
        endShape(CLOSE);
    }
    pop();
    
    // 4. DIBUJAR EL VECTOR DE IMPULSO
    if (isThrusting) {
        // Dibujar vector de fuerza en la dirección del impulso en color amarillo #FFFAA3
        // El vector se dibuja desde la popa de la nave
        let vectorLength = 70;
        let startX = shipX - 10 * cos(lastImpulseAngle);
        let startY = shipY - 10 * sin(lastImpulseAngle);
        
        // El vector apunta en la dirección del empuje (hacia adelante)
        drawVector(startX, startY, vectorLength, lastImpulseAngle, color(255, 250, 163));
        
        // Texto del vector
        noStroke();
        fill(255, 250, 163);
        textSize(11);
        textAlign(CENTER, BOTTOM);
        text(`Impulso: ${impulseValue.toFixed(1)} N·s`, shipX, shipY - 25);
    }
    
    // 5. ACTUALIZAR TELEMETRÍA
    updateTelemetry();
}

function applyThrustImpulse() {
    // Definir dirección del impulso: elegimos un ángulo aleatorio en el plano
    let angle = random(0, TWO_PI);
    shipAngle = angle; // Orientar la nave hacia esa dirección
    lastImpulseAngle = angle;
    
    // Aplicar teorema del impulso: Vf = Vi + (F * dt / m)
    let deltaV = impulseValue / shipMass;
    shipVx += deltaV * cos(angle);
    shipVy += deltaV * sin(angle);
    
    // Activar estados visuales
    isThrusting = true;
    thrustStartTime = millis();
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
    let speed = Math.sqrt(shipVx * shipVx + shipVy * shipVy);
    let momentum = shipMass * speed;
    
    let stateText = "Flotación Inercial (MRU)";
    if (speed < 0.01) {
        stateText = "Estática";
    }
    if (isThrusting) {
        stateText = "Impulso Activo (100ms)";
    }
    
    if (elState) elState.innerText = stateText;
    if (elV) elV.innerText = speed.toFixed(2) + " m/s";
    if (elP) elP.innerText = momentum.toFixed(1) + " kg·m/s";
    if (elI) elI.innerText = impulseValue.toFixed(1) + " N·s";
    if (elF) elF.innerText = thrusterForce.toFixed(0) + " N";
    if (elDt) elDt.innerText = (thrustDuration * 1000).toFixed(0) + " ms";
}

function resetSim() {
    shipVx = 0;
    shipVy = 0;
    shipAngle = 0;
    isThrusting = false;
    shipX = width / 2;
    shipY = height / 2;
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
