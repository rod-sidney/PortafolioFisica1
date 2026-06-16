// Simulación de Fuerza de Fricción (Estática vs Cinética)
// Usando parámetros físicos reales y deltaTime para una respuesta física precisa

let isPressing = false;
let appliedForce = 0;
let maxStaticFriction = 50;
let kineticFriction = 30;
let blockX = 80;
let blockV = 0;
let blockMass = 10;
let frictionForce = 0;
let isMoving = false;

// Elementos del DOM para la telemetría
let elState, elFa, elFf, elFn, elA, elV;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Vincular elementos de telemetría del DOM
    elState = document.getElementById('val-state');
    elFa = document.getElementById('val-fa');
    elFf = document.getElementById('val-ff');
    elFn = document.getElementById('val-fn');
    elA = document.getElementById('val-a');
    elV = document.getElementById('val-v');
    
    // Vincular eventos del botón interactivo
    const btn = document.getElementById('btn-apply-force');
    if (btn) {
        btn.addEventListener('mousedown', () => { isPressing = true; });
        btn.addEventListener('mouseup', () => { isPressing = false; });
        btn.addEventListener('mouseleave', () => { isPressing = false; });
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); isPressing = true; });
        btn.addEventListener('touchend', () => { isPressing = false; });
    }
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let floorY = height - 80;
    let blockSize = 60;
    let blockY = floorY - blockSize;
    
    // 1. LÓGICA FÍSICA: Fricción Estática vs Cinética
    let dt = deltaTime / 1000.0;
    
    if (isPressing) {
        // La fuerza aplicada crece progresivamente hasta un límite de 100 N
        appliedForce = min(100, appliedForce + 25 * dt);
    } else {
        // Al soltar, la fuerza decae rápidamente
        appliedForce = max(0, appliedForce - 120 * dt);
    }
    
    let netForce = 0;
    let blockA = 0;
    let stateStr = "Reposo (Fricción Estática)";
    
    if (!isMoving) {
        // Estado estático: no hay desplazamiento
        if (appliedForce <= maxStaticFriction) {
            frictionForce = -appliedForce;
            netForce = 0;
            blockA = 0;
            blockV = 0;
            stateStr = "Reposo (Fricción Estática)";
        } else {
            // Se supera el umbral de fricción estática máxima -> Comienza deslizamiento
            isMoving = true;
            frictionForce = -kineticFriction;
            netForce = appliedForce + frictionForce;
            blockA = netForce / blockMass;
            stateStr = "Deslizándose (Fricción Cinética)";
        }
    } else {
        // Estado cinético: en movimiento de deslizamiento
        frictionForce = -kineticFriction;
        netForce = appliedForce + frictionForce;
        
        blockA = netForce / blockMass;
        blockV += blockA * dt * 50; // Factor de escala para movimiento visible en píxeles
        blockX += blockV * dt;
        stateStr = "Deslizándose (Fricción Cinética)";
        
        // El bloque se frena si la fuerza de fricción supera a la aplicada y la velocidad cae a cero
        if (blockV <= 0) {
            blockV = 0;
            blockA = 0;
            isMoving = false;
            stateStr = "Reposo (Fricción Estática)";
        }
    }
    
    // Reposicionamiento cíclico del bloque (bucle de pantalla)
    if (blockX > width + blockSize) {
        blockX = -blockSize;
    } else if (blockX < -blockSize) {
        blockX = width;
    }
    
    // 2. DIBUJO DE ELEMENTOS
    // Suelo
    stroke(48, 66, 181, 150); // #3042B5
    strokeWeight(4);
    line(0, floorY, width, floorY);
    
    // Bloque pesado
    noStroke();
    fill(246, 130, 213); // #F682D5
    rect(blockX, blockY, blockSize, blockSize, 4);
    
    // Detalle decorativo (cruz estructural en el bloque)
    stroke(27);
    strokeWeight(1.5);
    line(blockX + 6, blockY + 6, blockX + blockSize - 6, blockY + blockSize - 6);
    line(blockX + blockSize - 6, blockY + 6, blockX + 6, blockY + blockSize - 6);
    
    // Puntos de anclaje de vectores
    let bCx = blockX + blockSize / 2;
    let bCy = blockY + blockSize / 2;
    
    // Dibujar Vector de Fuerza Aplicada (Fa: flecha amarilla #FFFAA3 a la derecha)
    if (appliedForce > 0.1) {
        drawVector(bCx, bCy, appliedForce * 0.8, 0, color(255, 250, 163));
        
        noStroke();
        fill(255, 250, 163);
        textSize(11);
        textAlign(CENTER, BOTTOM);
        text(`Fa: ${appliedForce.toFixed(1)} N`, bCx + (appliedForce * 0.4), bCy - 12);
    }
    
    // Dibujar Vector de Fricción (Ff: flecha rosa #F682D5 a la izquierda)
    if (abs(frictionForce) > 0.1) {
        drawVector(bCx, bCy, abs(frictionForce) * 0.8, PI, color(246, 130, 213));
        
        noStroke();
        fill(246, 130, 213);
        textSize(11);
        textAlign(CENTER, BOTTOM);
        text(`Ff: ${abs(frictionForce).toFixed(1)} N`, bCx - (abs(frictionForce) * 0.4), bCy - 12);
    }
    
    // 3. Escribir telemetría y estado en el lienzo
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    text(`Estado: ${stateStr}`, 20, 20);
    
    // 4. Actualizar telemetría en el DOM
    if (elState) elState.innerText = stateStr;
    if (elFa) elFa.innerText = appliedForce.toFixed(1) + " N";
    if (elFf) elFf.innerText = abs(frictionForce).toFixed(1) + " N";
    if (elFn) elFn.innerText = netForce.toFixed(1) + " N";
    if (elA) elA.innerText = blockA.toFixed(2) + " m/s²";
    if (elV) elV.innerText = (blockV / 10).toFixed(2) + " m/s";
}

// Función auxiliar para dibujar flechas vectoriales
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

// Reiniciar la simulación a los valores iniciales
function resetSim() {
    isPressing = false;
    appliedForce = 0;
    blockX = 80;
    blockV = 0;
    frictionForce = 0;
    isMoving = false;
}

// Redimensionar el lienzo
function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 400);
        resetSim();
    }
}
