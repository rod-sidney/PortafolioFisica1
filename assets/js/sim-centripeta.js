// Simulación de Fuerza Centrípeta y Algoritmo de Blackout en Simuladores
// Usando parámetros físicos reales y deltaTime para un cálculo de Gs consistente

let angle = 0;
let vReal = 120; // Velocidad inicial en m/s
let rReal = 400; // Radio inicial en metros
let mass = 80;   // Masa del piloto estándar (kg)

// Elementos del DOM para la telemetría
let elAc, elGForce, elFc, elV, elR, elStatus;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Vincular elementos de telemetría del DOM
    elAc = document.getElementById('val-ac');
    elGForce = document.getElementById('val-gforce');
    elFc = document.getElementById('val-fc');
    elV = document.getElementById('val-v');
    elR = document.getElementById('val-r');
    elStatus = document.getElementById('val-status');
    
    // Sincronizar sliders
    const sliderV = document.getElementById('slider-v');
    const sliderR = document.getElementById('slider-r');
    
    if (sliderV) {
        sliderV.addEventListener('input', (e) => {
            vReal = parseFloat(e.target.value);
        });
    }
    if (sliderR) {
        sliderR.addEventListener('input', (e) => {
            rReal = parseFloat(e.target.value);
        });
    }
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let cx = width / 2;
    let cy = height / 2;
    
    // 1. CÁLCULOS FÍSICOS REALES
    let ac = (vReal * vReal) / rReal;     // Aceleración centrípeta (m/s²)
    let gForce = ac / 9.8;                // Fuerzas G
    let fcVal = mass * ac;                // Fuerza centrípeta sobre el piloto (N)
    let omega = vReal / rReal;            // Velocidad angular (rad/s)
    
    // 2. ACTUALIZACIÓN DE POSICIÓN (Cinemática rotacional usando deltaTime)
    let dt = deltaTime / 1000.0;
    angle += omega * dt;
    angle = angle % TWO_PI;
    
    // 3. RENDERIZADO DE LA TRAYECTORIA Y EL ENTORNO
    // Dibujar el radio del círculo en píxeles (mapeado para ajuste visual)
    let drawRadius = map(rReal, 200, 800, 45, 140);
    
    // Dibujar centro de rotación (pivote)
    stroke(48, 66, 181, 100); // #3042B5
    strokeWeight(1.5);
    noFill();
    ellipse(cx, cy, 10, 10);
    
    // Dibujar órbita de giro
    stroke(48, 66, 181, 40);
    drawingContext.setLineDash([5, 5]); // Línea discontinua
    ellipse(cx, cy, drawRadius * 2, drawRadius * 2);
    drawingContext.setLineDash([]); // Restablecer
    
    // Calcular coordenadas del avión
    let px = cx + drawRadius * cos(angle);
    let py = cy + drawRadius * sin(angle);
    
    // Dibujar línea del radio vector (Fuerza centrípeta apuntando al centro)
    stroke(255, 250, 163, 150); // #FFFAA3
    strokeWeight(1);
    line(px, py, cx, cy);
    
    // Dibujar vector de velocidad tangencial (perpendicular al radio vector)
    let velAngle = angle + HALF_PI;
    let velLength = map(vReal, 80, 250, 20, 55);
    stroke(246, 130, 213, 180); // #F682D5
    strokeWeight(2);
    line(px, py, px + velLength * cos(velAngle), py + velLength * sin(velAngle));
    
    // Dibujar el avión (un triángulo apuntando en dirección al vector de velocidad tangencial)
    push();
    translate(px, py);
    rotate(velAngle);
    
    noStroke();
    fill(255);
    // Triángulo que simula un caza a reacción
    triangle(-6, 8, 0, -12, 6, 8);
    // Alas del ala delta
    fill(48, 66, 181);
    triangle(-14, 5, 0, -2, 14, 5);
    pop();
    
    // 4. ALGORITMO DE BLACKOUT VISUAL
    // Mapear opacidad de filtro de blackout basado en fuerzas G
    // Umbral de inicio de pérdida de visión a 3.5G, blackout total a 9.0G
    let blackoutAlpha = 0;
    if (gForce > 3.5) {
        blackoutAlpha = map(gForce, 3.5, 9.0, 0, 240, true);
    }
    
    // Dibujar el filtro de blackout sobre el canvas
    if (blackoutAlpha > 0) {
        noStroke();
        fill(0, 0, 0, blackoutAlpha);
        rect(0, 0, width, height);
        
        // Indicador de alerta de blackout en pantalla
        fill(246, 130, 213, blackoutAlpha);
        textSize(16);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text("ALERTA: EXCESO DE FUERZAS G (BLACKOUT)", width / 2, height - 35);
        textStyle(NORMAL);
    }
    
    // 5. RENDERIZACIÓN DE TELEMETRÍA EN EL DOM
    if (elAc) elAc.innerText = ac.toFixed(1) + " m/s²";
    if (elGForce) elGForce.innerText = gForce.toFixed(1) + " G";
    if (elFc) elFc.innerText = Math.round(fcVal) + " N";
    if (elV) elV.innerText = Math.round(vReal) + " m/s";
    if (elR) elR.innerText = Math.round(rReal) + " m";
    
    // Estado del piloto en base a Fuerzas G
    if (elStatus) {
        if (gForce < 3.5) {
            elStatus.innerText = "ESTABLE (Normal)";
            elStatus.style.color = "#FFFFFF";
        } else if (gForce >= 3.5 && gForce < 6.0) {
            elStatus.innerText = "VISIÓN DE TÚNEL (G-LOC leve)";
            elStatus.style.color = "#FFFAA3";
        } else if (gForce >= 6.0 && gForce < 9.0) {
            elStatus.innerText = "PÉRDIDA DE VISIÓN PERIFÉRICA (G-LOC medio)";
            elStatus.style.color = "#F682D5";
        } else {
            elStatus.innerText = "PÉRDIDA DE CONCIENCIA (G-LOC Crítico)";
            elStatus.style.color = "#E03A3A";
        }
    }
}

// Redimensionar el canvas adaptativamente
function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 400);
    }
}
