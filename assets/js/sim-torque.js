// Simulación de Torque y Cinemática Inversa en Levantamiento de Peso
// Portafolio de Física I - Sidney Rodríguez

// Parámetros Físicos
const r_real = 0.35;    // Longitud del antebrazo en metros
const F_real = 100.0;   // Fuerza del peso constante (Newtons, ~10 kg)

// Variables de Control
let theta_deg = 45.0;   // Ángulo del brazo en grados (0 a 130)

// Elementos de Telemetría del DOM
let elAngle, elForce, elTorque, elStatus;
let stars = [];

function setup() {
    const container = document.getElementById('sim-container');
    const w = container.offsetWidth;
    const h = 400;
    
    const canvas = createCanvas(w, h);
    canvas.parent('sim-container');
    
    // Inicializar estrellas para el fondo
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 150 + 80
        });
    }
    
    // Vincular elementos de la interfaz
    elAngle = document.getElementById('val-angle');
    elForce = document.getElementById('val-force');
    elTorque = document.getElementById('val-torque');
    elStatus = document.getElementById('val-status');
    
    // Slider
    const sliderTheta = document.getElementById('slider-theta');
    const btnReset = document.getElementById('btn-reset');
    
    if (sliderTheta) {
        sliderTheta.addEventListener('input', (e) => {
            theta_deg = parseFloat(e.target.value);
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            theta_deg = 45.0;
            if (sliderTheta) sliderTheta.value = 45.0;
        });
    }
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    // Dibujar estrellas
    noStroke();
    for (let star of stars) {
        fill(255, 255, 255, star.alpha * (0.7 + 0.3 * sin(frameCount * 0.04 + star.x * 100)));
        ellipse(star.x * width, star.y * height, star.size, star.size);
    }
    
    // 1. CÁLCULO FÍSICO
    let theta_rad = theta_deg * Math.PI / 180.0;
    let torque = r_real * F_real * Math.sin(theta_rad);
    
    // Coordenadas de la articulación (codo) en el canvas
    let cx = width / 2 - 30;
    let cy = height / 2 + 50;
    let r_px = 160; // Longitud visual del antebrazo en píxeles
    
    // Hombro (fijo en la simulación)
    let sx = cx - 110;
    let sy = cy - 90;
    
    // 2. DIBUJAR BANCO PREDICADOR (Fondo decorativo)
    stroke(45, 45, 45, 120);
    strokeWeight(5);
    fill(35, 35, 35, 150);
    beginShape();
    vertex(sx - 50, sy - 10);
    vertex(cx + 50, cy + 40);
    vertex(cx - 30, cy + 90);
    vertex(sx - 90, sy + 30);
    endShape(CLOSE);
    
    // Soporte metálico del banco
    stroke(80);
    strokeWeight(3);
    line(cx - 10, cy + 65, cx - 10, height - 10);
    line(sx - 70, sy + 20, sx - 70, height - 10);
    
    // 3. DIBUJAR MÚSCULO BÍCEPS CON CONTRACCIÓN DINÁMICA (Bulge)
    // El punto medio del húmero
    let bx = (sx + cx) / 2;
    let by = (sy + cy) / 2;
    
    push();
    translate(bx, by);
    rotate(atan2(cy - sy, cx - sx));
    
    // El bíceps se contrae (se ensancha) a medida que el antebrazo se flexiona (mayor theta)
    let bulge = map(theta_deg, 0, 130, 22, 54);
    
    // Dibujar músculo bíceps
    fill(246, 130, 213, 200); // #F682D5 con opacidad
    stroke(255, 255, 255, 180);
    strokeWeight(1.5);
    ellipse(0, -6, 95, bulge);
    
    // Tríceps (en la parte inferior de la almohadilla)
    fill(80, 80, 80, 150);
    noStroke();
    ellipse(0, 8, 95, 18);
    pop();
    
    // Húmero (Hueso del brazo)
    stroke(200);
    strokeWeight(4);
    line(sx, sy, cx, cy);
    
    // 4. DIBUJAR ANTEBRAZO (Rotando según theta)
    // theta = 0 es vertical hacia abajo.
    // x = cx + r*sin(theta), y = cy + r*cos(theta)
    let hx = cx + r_px * Math.sin(theta_rad);
    let hy = cy + r_px * Math.cos(theta_rad);
    
    // Antebrazo (Viga/Línea del brazo)
    stroke(48, 66, 181); // #3042B5
    strokeWeight(7);
    line(cx, cy, hx, hy);
    
    // Hueso interno del antebrazo (decorativo)
    stroke(255);
    strokeWeight(2);
    line(cx + 5 * Math.sin(theta_rad), cy + 5 * Math.cos(theta_rad), hx - 5 * Math.sin(theta_rad), hy - 5 * Math.cos(theta_rad));
    
    // Articulación del codo
    fill(255, 250, 163); // #FFFAA3
    stroke(255);
    strokeWeight(2);
    ellipse(cx, cy, 18, 18);
    fill(27);
    noStroke();
    ellipse(cx, cy, 6, 6);
    
    // Articulación de la muñeca / mano
    fill(255);
    stroke(48, 66, 181);
    strokeWeight(2);
    ellipse(hx, hy, 12, 12);
    
    // 5. DIBUJAR EL PESO (Mancuerna)
    stroke(100);
    strokeWeight(5);
    // Barra de la mancuerna orientada de forma perpendicular a la gravedad (horizontal)
    line(hx - 22, hy, hx + 22, hy);
    
    // Discos de la mancuerna
    fill(35);
    stroke(255, 250, 163); // #FFFAA3
    strokeWeight(2.5);
    rect(hx - 30, hy - 20, 10, 40, 2);
    rect(hx + 20, hy - 20, 10, 40, 2);
    
    // 6. DIBUJAR VECTOR DE FUERZA DE GRAVEDAD
    stroke(255, 250, 163); // #FFFAA3
    strokeWeight(2.5);
    // Dibujar flecha hacia abajo
    line(hx, hy, hx, hy + 75);
    fill(255, 250, 163);
    noStroke();
    triangle(hx - 5, hy + 67, hx, hy + 77, hx + 5, hy + 67);
    
    // Etiqueta del vector Fuerza
    fill(255);
    textSize(10);
    textAlign(LEFT, CENTER);
    text("F (Gravedad)", hx + 8, hy + 45);
    
    // 7. DIBUJAR ARCO DE ÁNGULO (θ)
    noFill();
    stroke(170, 162, 245); // #AAA2F5
    strokeWeight(2);
    // El arco va desde vertical abajo (HALF_PI) hasta la dirección del antebrazo (HALF_PI + theta)
    arc(cx, cy, 75, 75, HALF_PI, HALF_PI + theta_rad);
    
    // Posicionar texto del ángulo
    let labelAngle = HALF_PI + theta_rad / 2;
    let lx = cx + 55 * Math.cos(labelAngle);
    let ly = cy + 55 * Math.sin(labelAngle);
    fill(170, 162, 245);
    noStroke();
    textSize(11);
    textAlign(CENTER, CENTER);
    text(Math.round(theta_deg) + "°", lx, ly);
    
    // 8. TEXTOS EN EL CANVAS (DATOS EN TIEMPO REAL)
    push();
    fill(255);
    noStroke();
    textSize(13);
    textAlign(LEFT, TOP);
    textFont('Courier New');
    
    // Ángulo actual
    fill('#FFFAA3');
    text("Ángulo del Brazo (θ):   " + Math.round(theta_deg) + "°", 20, 20);
    
    // Fuerza constante (peso)
    fill('#AAA2F5');
    text("Fuerza del Peso (F):   " + F_real.toFixed(0) + " N", 20, 42);
    
    // Torque resultante
    fill('#F682D5');
    text("Torque en el Codo (τ): " + torque.toFixed(2) + " N·m", 20, 64);
    
    // Barra de torque dinámico
    stroke(255, 255, 255, 30);
    fill(22);
    rect(20, 92, 210, 14, 4);
    
    let max_torque = r_real * F_real; // Máximo a 90° (35 N·m)
    let bar_width = map(torque, 0, max_torque, 0, 210);
    noStroke();
    // Color cambia a rosa brillante a medida que se acerca al torque máximo
    fill(lerpColor(color(48, 66, 181), color(246, 130, 213), torque / max_torque));
    rect(20, 92, bar_width, 14, 4);
    
    fill(255);
    textSize(9);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("ESFUERZO DE ROTACIÓN (TORQUE)", 25, 99);
    pop();
    
    // 9. ACTUALIZACIÓN DEL DOM
    if (elAngle) elAngle.innerText = Math.round(theta_deg) + "°";
    if (elForce) elForce.innerText = F_real.toFixed(0) + " N";
    if (elTorque) elTorque.innerText = torque.toFixed(2) + " N·m";
    
    if (elStatus) {
        // Explicación de la eficiencia/máximo esfuerzo
        if (theta_deg >= 85 && theta_deg <= 95) {
            elStatus.innerText = "MÁXIMO ESFUERZO: Brazo paralelo al suelo (θ = 90°, sin(θ) = 1.00)";
            elStatus.style.color = "#F682D5";
            elStatus.style.fontWeight = "700";
        } else {
            let sin_val = Math.sin(theta_rad).toFixed(2);
            elStatus.innerText = `Esfuerzo Parcial (sin(θ) = ${sin_val})`;
            elStatus.style.color = "#FFFFFF";
            elStatus.style.fontWeight = "400";
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
