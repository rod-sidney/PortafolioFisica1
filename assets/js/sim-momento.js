// Simulación de Conservación del Momento Angular
// Control de Actitud de Satélite usando Volantes de Inercia
// Portafolio de Física I - Sidney Rodríguez

let theta_s = 0; // Ángulo de rotación del satélite (en radianes)
let theta_w = 0; // Ángulo de rotación del volante (en radianes, absoluto)

let omega_s = 0; // Velocidad angular del satélite (rad/s)
let omega_w = 0; // Velocidad angular de la rueda (rad/s)

let I_s = 50.0;  // Momento de inercia del satélite (kg*m^2)
let I_w = 2.0;   // Momento de inercia del volante (kg*m^2)

// Momentos angulares individuales (L = I * omega)
let L_w = 0.0;   // Momento angular del volante
let L_s = 0.0;   // Momento angular del satélite

// Variables para controlar la aceleración activa
let isAcceleratingRight = false;
let isAcceleratingLeft = false;

// Elementos de telemetría del DOM
let elIs, elIw, elOmegaS, elOmegaW, elLs, elLw, elLtotal;
let stars = [];

function setup() {
    const container = document.getElementById('sim-container');
    const w = container.offsetWidth;
    const h = 400;
    
    const canvas = createCanvas(w, h);
    canvas.parent('sim-container');
    
    // Inicializar estrellas
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 150 + 100
        });
    }
    
    // Vincular elementos del DOM
    elIs = document.getElementById('val-is');
    elIw = document.getElementById('val-iw');
    elOmegaS = document.getElementById('val-omega-s');
    elOmegaW = document.getElementById('val-omega-w');
    elLs = document.getElementById('val-ls');
    elLw = document.getElementById('val-lw');
    elLtotal = document.getElementById('val-ltotal');
    
    // Sliders
    const sliderIs = document.getElementById('slider-is');
    const sliderIw = document.getElementById('slider-iw');
    
    if (sliderIs) {
        sliderIs.addEventListener('input', (e) => {
            I_s = parseFloat(e.target.value);
            // Recalcular omega_s basándose en el L_s actual para conservar L
            omega_s = L_s / I_s;
        });
    }
    if (sliderIw) {
        sliderIw.addEventListener('input', (e) => {
            I_w = parseFloat(e.target.value);
            // Recalcular omega_w basándonos en el L_w actual para conservar L
            omega_w = L_w / I_w;
        });
    }
    
    // Botones
    const btnRight = document.getElementById('btn-accel-right');
    const btnLeft = document.getElementById('btn-accel-left');
    const btnReset = document.getElementById('btn-reset');
    
    if (btnRight) {
        btnRight.addEventListener('mousedown', () => { isAcceleratingRight = true; });
        btnRight.addEventListener('mouseup', () => { isAcceleratingRight = false; });
        btnRight.addEventListener('mouseleave', () => { isAcceleratingRight = false; });
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); isAcceleratingRight = true; });
        btnRight.addEventListener('touchend', () => { isAcceleratingRight = false; });
    }
    
    if (btnLeft) {
        btnLeft.addEventListener('mousedown', () => { isAcceleratingLeft = true; });
        btnLeft.addEventListener('mouseup', () => { isAcceleratingLeft = false; });
        btnLeft.addEventListener('mouseleave', () => { isAcceleratingLeft = false; });
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); isAcceleratingLeft = true; });
        btnLeft.addEventListener('touchend', () => { isAcceleratingLeft = false; });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            theta_s = 0;
            theta_w = 0;
            omega_s = 0;
            omega_w = 0;
            L_w = 0;
            L_s = 0;
            isAcceleratingRight = false;
            isAcceleratingLeft = false;
        });
    }
}

function draw() {
    background(27); // Fondo #1B1B1B
    
    let cx = width / 2;
    let cy = height / 2;
    
    // Dibujar estrellas titilantes
    noStroke();
    for (let star of stars) {
        fill(255, 255, 255, star.alpha * (0.7 + 0.3 * sin(frameCount * 0.05 + star.x * 100)));
        ellipse(star.x * width, star.y * height, star.size, star.size);
    }
    
    let dt = deltaTime / 1000.0;
    if (dt > 0.1) dt = 0.1; // Limitar dt para evitar saltos gigantes
    
    // 1. CÁLCULO DE TORQUE E IMPULSO ANGULAR (Sincronización Física Rigurosa)
    const torque = 8.0; // torque del motor interno (N*m)
    const frictionTorque = 0.4; // torque de fricción interna (N*m)
    let delta_L = 0;
    
    if (isAcceleratingRight) {
        delta_L = torque * dt;
    } else if (isAcceleratingLeft) {
        delta_L = -torque * dt;
    } else {
        // Fricción que reduce la rotación del volante a cero
        if (omega_w > 0) {
            delta_L = -frictionTorque * dt;
            if (L_w + delta_L < 0) delta_L = -L_w;
        } else if (omega_w < 0) {
            delta_L = frictionTorque * dt;
            if (L_w + delta_L > 0) delta_L = -L_w;
        }
    }
    
    // Aplicar el cambio de momento angular simultáneamente para conservar L total = 0
    L_w += delta_L;
    L_s -= delta_L; // El chasis compensa exactamente en la misma línea
    
    // 2. OBTENER VELOCIDADES ANGULARES
    omega_w = L_w / I_w;
    omega_s = L_s / I_s;
    
    // 3. INTEGRAR PARA OBTENER POSICIÓN ROTACIONAL (ÁNGULOS)
    theta_w += omega_w * dt;
    theta_s += omega_s * dt;
    
    theta_w = theta_w % TWO_PI;
    theta_s = theta_s % TWO_PI;
    
    // Momento total del sistema
    let L_total = L_w + L_s;
    
    // 4. RENDERIZACIÓN DE SATÉLITE
    push();
    translate(cx, cy);
    rotate(theta_s); // Rotar todo el sistema del satélite
    
    // Dibujar paneles solares
    // Panel Izquierdo
    fill(48, 66, 181); // #3042B5
    stroke(246, 130, 213, 150); // #F682D5
    strokeWeight(1.5);
    rect(-130, -15, 60, 30, 4);
    
    // Rejilla de celdas solares
    stroke(246, 130, 213, 80);
    line(-110, -15, -110, 15);
    line(-90, -15, -90, 15);
    line(-130, 0, -70, 0);
    
    // Estructura de soporte izquierda
    stroke(255);
    strokeWeight(2.5);
    line(-70, 0, -30, 0);
    
    // Panel Derecho
    fill(48, 66, 181);
    stroke(246, 130, 213, 150);
    rect(70, -15, 60, 30, 4);
    
    // Rejilla de celdas solares derecha
    stroke(246, 130, 213, 80);
    line(90, -15, 90, 15);
    line(110, -15, 110, 15);
    line(70, 0, 130, 0);
    
    // Estructura de soporte derecha
    stroke(255);
    strokeWeight(2.5);
    line(30, 0, 70, 0);
    
    // Antena satelital
    stroke(170, 162, 245); // #AAA2F5
    strokeWeight(2);
    line(0, -32, 0, -50);
    noStroke();
    fill(246, 130, 213);
    ellipse(0, -50, 7, 7);
    
    // Dibujar chasis central octogonal
    fill(35); // #232323
    stroke(255);
    strokeWeight(2);
    beginShape();
    let r_chassis = 32;
    for (let i = 0; i < 8; i++) {
        let angle = i * TWO_PI / 8;
        vertex(r_chassis * cos(angle), r_chassis * sin(angle));
    }
    endShape(CLOSE);
    
    // Dibujar indicador de chasis en el satélite para apreciar la rotación
    stroke(48, 66, 181);
    strokeWeight(1.5);
    fill(48, 66, 181, 100);
    ellipse(0, 0, 52, 52);
    
    // 5. RENDERIZACIÓN DE LA RUEDA DE INERCIA (Volante)
    push();
    rotate(theta_w - theta_s);
    
    // Carcasa / Masa de la rueda de inercia
    fill(22, 22, 22);
    stroke(255, 250, 163); // #FFFAA3
    strokeWeight(2);
    ellipse(0, 0, 28, 28);
    
    // Marcas de rotación en la rueda
    stroke(246, 130, 213); // #F682D5
    strokeWeight(2.5);
    line(-12, 0, 12, 0);
    line(0, -12, 0, 12);
    
    // Núcleo
    fill(255, 250, 163);
    noStroke();
    ellipse(0, 0, 6, 6);
    pop();
    
    pop(); // Fin de transformación del satélite
    
    // 6. INDICADORES VISUALES DE DIRECCIÓN (Fuerzas y vectores)
    noFill();
    if (abs(omega_w) > 0.05) {
        stroke(255, 250, 163, 120); // #FFFAA3
        strokeWeight(1.5);
        let r_w_ind = 60;
        arc(cx, cy, r_w_ind, r_w_ind, -HALF_PI, -HALF_PI + (omega_w > 0 ? 0.8 : -0.8));
        
        let arrow_w = -HALF_PI + (omega_w > 0 ? 0.8 : -0.8);
        push();
        translate(cx + (r_w_ind/2) * cos(arrow_w), cy + (r_w_ind/2) * sin(arrow_w));
        rotate(arrow_w + (omega_w > 0 ? HALF_PI : -HALF_PI));
        fill(255, 250, 163);
        noStroke();
        triangle(-4, 4, 0, -3, 4, 4);
        pop();
    }
    
    if (abs(omega_s) > 0.001) {
        stroke(48, 66, 181, 150); // #3042B5
        strokeWeight(2.5);
        let r_s_ind = 160;
        arc(cx, cy, r_s_ind * 2, r_s_ind * 2, -HALF_PI - 0.4, -HALF_PI + 0.4);
        
        let arrow_s = -HALF_PI + (omega_s > 0 ? 0.4 : -0.4);
        push();
        translate(cx + r_s_ind * cos(arrow_s), cy + r_s_ind * sin(arrow_s));
        rotate(arrow_s + (omega_s > 0 ? HALF_PI : -HALF_PI));
        fill(48, 66, 181);
        noStroke();
        triangle(-6, 6, 0, -4, 6, 6);
        pop();
    }
    
    // 7. TEXTO DE CONSERVACIÓN EN EL CANVAS (UI MEJORADA)
    push();
    fill(255);
    noStroke();
    textSize(13);
    textAlign(LEFT, TOP);
    textFont('Courier New');
    
    // Línea 1: Momento de la Rueda
    fill('#FFFAA3');
    text("Momento de la Rueda (L_rueda): " + (L_w >= 0 ? " " : "") + L_w.toFixed(3) + " N·m·s", 20, 20);
    
    // Línea 2: Momento del Satélite
    fill('#AAA2F5');
    text("Momento del Satélite (L_satélite): " + (L_s >= 0 ? " " : "") + L_s.toFixed(3) + " N·m·s", 20, 42);
    
    // Línea 3: Momento Total (Fijo a 0.00)
    fill('#F682D5');
    text("Momento Total (L_total): 0.00 N·m·s", 20, 64);
    pop();
    
    // 8. RENDERIZACIÓN DE TELEMETRÍA EN EL DOM
    if (elIs) elIs.innerText = I_s.toFixed(1) + " kg·m²";
    if (elIw) elIw.innerText = I_w.toFixed(2) + " kg·m²";
    if (elOmegaS) elOmegaS.innerText = (omega_s >= 0 ? "+" : "") + omega_s.toFixed(3) + " rad/s";
    if (elOmegaW) elOmegaW.innerText = (omega_w >= 0 ? "+" : "") + omega_w.toFixed(3) + " rad/s";
    if (elLs) elLs.innerText = (L_s >= 0 ? "+" : "") + L_s.toFixed(3) + " N·m·s";
    if (elLw) elLw.innerText = (L_w >= 0 ? "+" : "") + L_w.toFixed(3) + " N·m·s";
    if (elLtotal) elLtotal.innerText = "0.000000 N·m·s";
}

function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const w = container.offsetWidth;
        resizeCanvas(w, 400);
    }
}
