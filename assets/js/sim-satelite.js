// Simulación de Gravitación y Órbitas Satelitales
// Portafolio de Física I - Sidney Rodríguez

// Parámetros del planeta
let planet = { x: 0, y: 0, r: 45, mass: 1000000 };
// Parámetros del satélite
let sat = { x: 0, y: 0, vx: 0, vy: 0, r: 8 };

let mu = 1000000; // GM constante
let r0 = 130;     // Distancia inicial en píxeles

let initialVel = 87.7; // v_c = sqrt(mu/r0) = sqrt(1000000/130) = 87.7 px/s
let trail = [];
let isCrashed = false;
let isEscaped = false;

// Elementos de telemetría del DOM
let elR, elV, elStatus;
let stars = [];

function setup() {
    const container = document.getElementById('sim-container');
    const w = container.offsetWidth;
    const h = 400;
    
    const canvas = createCanvas(w, h);
    canvas.parent('sim-container');
    
    // Inicializar estrellas
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 150 + 100
        });
    }
    
    // Vincular DOM
    elR = document.getElementById('val-r');
    elV = document.getElementById('val-v');
    elStatus = document.getElementById('val-status');
    
    const sliderV = document.getElementById('slider-v');
    const btnReset = document.getElementById('btn-reset');
    
    if (sliderV) {
        sliderV.addEventListener('input', (e) => {
            initialVel = parseFloat(e.target.value);
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetSim();
        });
    }
    
    resetSim();
}

function resetSim() {
    planet.x = width / 2;
    planet.y = height / 2;
    
    sat.x = planet.x;
    sat.y = planet.y - r0;
    
    sat.vx = initialVel;
    sat.vy = 0;
    
    trail = [];
    isCrashed = false;
    isEscaped = false;
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let cx = width / 2;
    let cy = height / 2;
    planet.x = cx;
    planet.y = cy;
    
    // Dibujar estrellas
    noStroke();
    for (let star of stars) {
        fill(255, 255, 255, star.alpha * (0.7 + 0.3 * sin(frameCount * 0.05 + star.x * 100)));
        ellipse(star.x * width, star.y * height, star.size, star.size);
    }
    
    // 1. CÁLCULO DE LA FÍSICA ORBITAL
    let rx = sat.x - planet.x;
    let ry = sat.y - planet.y;
    let d = sqrt(rx * rx + ry * ry);
    
    if (!isCrashed && !isEscaped) {
        let dt = deltaTime / 1000.0;
        if (dt > 0.05) dt = 0.05; // Limitar dt para evitar inestabilidad si baja el framerate
        
        // F = G * M * m / d^2 (aceleración orbital a = F/m = GM/d^2)
        let forceMag = mu / (d * d);
        let ax = - (rx / d) * forceMag;
        let ay = - (ry / d) * forceMag;
        
        sat.vx += ax * dt;
        sat.vy += ay * dt;
        
        sat.x += sat.vx * dt;
        sat.y += sat.vy * dt;
        
        // Agregar puntos al rastro orbital
        if (frameCount % 2 === 0) {
            trail.push({ x: sat.x, y: sat.y });
            if (trail.length > 300) trail.shift();
        }
        
        // Comprobar colisión con la superficie
        if (d < planet.r + sat.r - 2) {
            isCrashed = true;
            sat.vx = 0;
            sat.vy = 0;
        }
        
        // Comprobar si escapó
        if (d > 800) {
            isEscaped = true;
        }
    }
    
    // 2. DIBUJAR RASTRO DE TRAYECTORIA
    noFill();
    stroke(170, 162, 245, 150); // #AAA2F5
    strokeWeight(1.5);
    beginShape();
    for (let p of trail) {
        vertex(p.x, p.y);
    }
    endShape();
    
    // 3. DIBUJAR PLANETA (Con atmósfera y brillo premium)
    push();
    translate(planet.x, planet.y);
    
    // Brillo atmosférico
    noStroke();
    for (let rGlow = planet.r + 15; rGlow > planet.r; rGlow -= 3) {
        fill(48, 66, 181, 12); // #3042B5 con opacidad
        ellipse(0, 0, rGlow * 2, rGlow * 2);
    }
    
    // Cuerpo del Planeta
    fill(48, 66, 181); // #3042B5
    stroke(170, 162, 245); // #AAA2F5
    strokeWeight(2);
    ellipse(0, 0, planet.r * 2, planet.r * 2);
    
    // Relieves continentales decorativos
    fill(27, 27, 27, 70);
    noStroke();
    ellipse(-12, -8, planet.r * 0.9, planet.r * 0.4);
    ellipse(14, 12, planet.r * 0.7, planet.r * 0.6);
    pop();
    
    // 4. DIBUJAR SATÉLITE Y VECTORES
    let velMag = sqrt(sat.vx * sat.vx + sat.vy * sat.vy);
    
    if (!isCrashed) {
        push();
        translate(sat.x, sat.y);
        
        // Rotar el satélite en la dirección de su velocidad
        let angle = atan2(sat.vy, sat.vx);
        rotate(angle);
        
        // Chasis del satélite
        fill(255);
        stroke(246, 130, 213); // #F682D5
        strokeWeight(1.5);
        rect(-6, -6, 12, 12, 2);
        
        // Paneles solares laterales
        fill(48, 66, 181);
        rect(-16, -2, 10, 4, 1);
        rect(6, -2, 10, 4, 1);
        pop();
        
        if (!isEscaped) {
            // Vector de Fuerza Gravitatoria (F) apuntando al centro
            stroke(255, 250, 163, 200); // #FFFAA3
            strokeWeight(1.5);
            let arrowScale = 0.45;
            line(sat.x, sat.y, sat.x - rx * arrowScale, sat.y - ry * arrowScale);
            
            // Vector de Velocidad (V) tangencial
            stroke(246, 130, 213, 200); // #F682D5
            strokeWeight(2);
            let vScale = 0.65;
            line(sat.x, sat.y, sat.x + sat.vx * vScale, sat.y + sat.vy * vScale);
        }
    } else {
        // Marcador de impacto en la superficie
        fill(246, 130, 213);
        ellipse(sat.x, sat.y, 16, 16);
        fill(255, 250, 163);
        ellipse(sat.x, sat.y, 8, 8);
    }
    
    // 5. TEXTO DE TELEMETRÍA EN EL CANVAS (UI DE DATOS)
    push();
    fill(255);
    noStroke();
    textSize(13);
    textAlign(LEFT, TOP);
    textFont('Courier New');
    
    fill('#FFFAA3');
    text("Velocidad Inicial: " + Math.round(initialVel) + " px/s", 20, 20);
    
    fill('#AAA2F5');
    text("Distancia Orbit:   " + Math.round(d) + " px", 20, 42);
    
    fill('#F682D5');
    text("Velocidad Actual:  " + Math.round(velMag) + " px/s", 20, 64);
    pop();
    
    // 6. RENDERIZACIÓN DE TELEMETRÍA EN EL DOM
    if (elR) elR.innerText = Math.round(d * 50) + " km";
    if (elV) elV.innerText = (velMag * 0.1).toFixed(2) + " km/s";
    
    if (elStatus) {
        if (isCrashed) {
            elStatus.innerText = "COLAPSO ESTRUCTURAL: Satélite impactó la superficie planetaria.";
            elStatus.style.color = "#E03A3A";
        } else if (isEscaped) {
            elStatus.innerText = "TRAYECTORIA HIPERBÓLICA: Velocidad superó la atracción gravitatoria (Escape).";
            elStatus.style.color = "#F682D5";
        } else {
            let circularVel = sqrt(mu / d);
            let diff = velMag / circularVel;
            
            if (diff > 0.96 && diff < 1.04) {
                elStatus.innerText = "ESTABLE: Órbita Circular Estable (v ≈ vc)";
                elStatus.style.color = "#FFFAA3";
            } else if (diff >= 1.04 && diff < 1.414) {
                elStatus.innerText = "ESTABLE: Órbita Elíptica Estable";
                elStatus.style.color = "#AAA2F5";
            } else if (diff >= 1.414) {
                elStatus.innerText = "ESCAPE: Velocidad de Escape Alcanzada (v >= √2 * vc)";
                elStatus.style.color = "#F682D5";
            } else {
                elStatus.innerText = "CRÍTICO: Decaimiento de Órbita (Colapso Inminente)";
                elStatus.style.color = "#E03A3A";
            }
        }
    }
}

function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const w = container.offsetWidth;
        resizeCanvas(w, 400);
    }
}
