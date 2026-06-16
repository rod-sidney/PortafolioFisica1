// Simulación de Movimiento Circular Uniforme (MCU) - Barrido de Haz de Radar
// Usando velocidad angular y deltaTime física real para consistencia temporal

let theta = 0;
let omega = 1.0; // Velocidad angular en radianes por segundo
let maxRadius = 160;

// Objetivos detectables (en coordenadas polares: radio, ángulo, tamaño, brillo)
let targets = [];

// Elementos del DOM para la telemetría
let elThetaRad, elThetaDeg, elOmega, elPeriod, elFreq, elDeltaTime;

function setup() {
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // Generar objetivos estáticos aleatorios dentro del rango del radar
    targets = [
        { r: 70, a: 0.8, size: 8, brightness: 0 },
        { r: 120, a: 2.3, size: 6, brightness: 0 },
        { r: 90, a: 4.1, size: 9, brightness: 0 },
        { r: 140, a: 5.5, size: 7, brightness: 0 }
    ];
    
    // Inicializar elementos de telemetría del DOM
    elThetaRad = document.getElementById('val-theta-rad');
    elThetaDeg = document.getElementById('val-theta-deg');
    elOmega = document.getElementById('val-omega');
    elPeriod = document.getElementById('val-period');
    elFreq = document.getElementById('val-freq');
    elDeltaTime = document.getElementById('val-deltatime');
    
    // Configurar selectores de control de velocidad angular si existen
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            omega = parseFloat(e.target.value);
        });
    }
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let cx = width / 2;
    let cy = height / 2;
    
    // 1. LÓGICA VITAL: Rotación basada en deltaTime real del sistema (segundos)
    let dt = deltaTime / 1000.0;
    theta += omega * dt;
    theta = theta % TWO_PI; // Mantener el ángulo en el rango [0, 2*PI]
    
    // 2. Dibujar rejilla estática del radar (Círculos concéntricos y ejes de barrido)
    noFill();
    stroke(48, 66, 181, 60); // #3042B5 con baja opacidad
    strokeWeight(1);
    circle(cx, cy, maxRadius * 2);
    circle(cx, cy, maxRadius * 1.5);
    circle(cx, cy, maxRadius * 1.0);
    circle(cx, cy, maxRadius * 0.5);
    
    // Ejes cardinales
    stroke(48, 66, 181, 40);
    line(cx - maxRadius - 10, cy, cx + maxRadius + 10, cy);
    line(cx, cy - maxRadius - 10, cx, cy + maxRadius + 10);
    
    // Marcadores radiales en cruz
    stroke(48, 66, 181, 80);
    for (let r = 40; r <= maxRadius; r += 40) {
        line(cx - 5, cy - r, cx + 5, cy - r);
        line(cx - 5, cy + r, cx + 5, cy + r);
        line(cx - r, cy - 5, cx - r, cy + 5);
        line(cx + r, cy - 5, cx + r, cy + 5);
    }
    
    // 3. Procesar y dibujar objetivos (Fading Effect al pasar el escáner)
    for (let target of targets) {
        // Calcular la distancia angular absoluta
        // Nota: en p5.js el ángulo crece hacia el sentido horario.
        // Convertimos target.a para estar seguros del barrido.
        let diff = abs(theta - target.a);
        
        // Manejar el cruce por cero en la discontinuidad angular
        if (diff > PI) {
            diff = TWO_PI - diff;
        }
        
        // Si el haz está muy cerca del objetivo (umbral de 0.05 radianes), brilla al máximo
        if (diff < 0.06 && omega > 0) {
            target.brightness = 255;
        } else {
            // Desvanecimiento progresivo basado en el tiempo
            target.brightness = max(0, target.brightness - 180 * dt);
        }
        
        // Dibujar el objetivo detectado si tiene brillo
        if (target.brightness > 0) {
            let tx = cx + target.r * cos(target.a);
            let ty = cy + target.r * sin(target.a);
            
            // Efecto de halo brillante (#FFFAA3)
            noStroke();
            fill(255, 250, 163, target.brightness * 0.3);
            ellipse(tx, ty, target.size * 2.5, target.size * 2.5);
            
            // Punto central (#F682D5)
            fill(246, 130, 213, target.brightness);
            ellipse(tx, ty, target.size, target.size);
            
            // Texto de distancia al objetivo
            fill(246, 130, 213, target.brightness * 0.7);
            textSize(10);
            textAlign(LEFT, CENTER);
            text(`OBJ R:${target.r}`, tx + 10, ty);
        }
    }
    
    // 4. Dibujar estela del haz del radar (Gradiente de atenuación angular)
    let tailLength = 90; // Segmentos de la cola
    let step = 0.012; // Separación angular entre segmentos
    
    for (let i = 0; i < tailLength; i++) {
        let angle = theta - i * step;
        let alpha = map(i, 0, tailLength, 150, 0);
        
        stroke(48, 66, 181, alpha); // Estela azulada de fondo #3042B5
        if (i < 40) {
            // Parte cercana al haz brilla en el acento morado/rosa (#F682D5)
            stroke(246, 130, 213, map(i, 0, 40, alpha, 0));
        }
        
        strokeWeight(1.5);
        line(cx, cy, cx + maxRadius * cos(angle), cy + maxRadius * sin(angle));
    }
    
    // Haz principal del radar (Línea frontal blanca/amarilla #FFFAA3)
    stroke(255, 250, 163);
    strokeWeight(2.5);
    line(cx, cy, cx + maxRadius * cos(theta), cy + maxRadius * sin(theta));
    
    // Halo decorativo en la punta del haz
    noStroke();
    fill(255, 250, 163, 100);
    circle(cx + maxRadius * cos(theta), cy + maxRadius * sin(theta), 6);
    
    // Centro del radar (decoración)
    fill(255, 250, 163);
    circle(cx, cy, 6);
    
    // 5. Actualizar telemetría en tiempo real
    if (elThetaRad) elThetaRad.innerText = theta.toFixed(3) + " rad";
    if (elThetaDeg) elThetaDeg.innerText = Math.round(degrees(theta)) + "°";
    if (elOmega) elOmega.innerText = omega.toFixed(2) + " rad/s";
    if (elPeriod) elPeriod.innerText = omega > 0 ? (TWO_PI / omega).toFixed(2) + " s" : "&infin;";
    if (elFreq) elFreq.innerText = omega > 0 ? (omega / TWO_PI).toFixed(2) + " Hz" : "0.00 Hz";
    if (elDeltaTime) elDeltaTime.innerText = (deltaTime).toFixed(1) + " ms";
}

// Redimensión responsiva del canvas
function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 400);
    }
}
