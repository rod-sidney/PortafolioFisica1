// Simulación de Energía Potencial Gravitatoria y Pozos de Gravedad
// Portafolio de Física I - Sidney Rodríguez

// Configuración del Plano Cartesiano
const yZero = 130;        // Coordenada Y de la línea de energía cero (Y=0)
const r0 = 80;            // Distancia de la superficie del planeta (X inicial)
const GM = 60000;         // Constante gravitacional central
const energyScale = 0.25; // Escala para graficar la energía en pixeles

// Estado de la Simulación
let r = r0;
let isLaunched = false;
let direction = 1;        // 1 = Ascendiendo, -1 = Cayendo, 0 = Detenido
let escaped = false;
let crashed = false;
let stars = [];

let sliderK0;
let elValK0;
let elK, elU, elE, elStatus;

function setup() {
    const container = document.getElementById('sim-container');
    const w = container ? container.offsetWidth : 600;
    const h = 400;

    const canvas = createCanvas(w, h);
    if (container) {
        canvas.parent('sim-container');
    }

    // Inicializar estrellas decorativas en el fondo
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 100 + 50
        });
    }

    // Vinculación DOM
    sliderK0 = document.getElementById('slider-k0');
    elValK0 = document.getElementById('val-k0-slider');
    elK = document.getElementById('val-k');
    elU = document.getElementById('val-u');
    elE = document.getElementById('val-e');
    elStatus = document.getElementById('val-status');

    const btnLaunch = document.getElementById('btn-launch');
    const btnReset = document.getElementById('btn-reset');

    if (btnLaunch) {
        btnLaunch.addEventListener('click', () => {
            if (!isLaunched && !escaped) {
                isLaunched = true;
                direction = 1;
                crashed = false;
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetSim();
        });
    }

    if (sliderK0) {
        sliderK0.addEventListener('input', () => {
            if (!isLaunched) {
                resetSim();
            }
        });
    }

    resetSim();
}

function resetSim() {
    r = r0;
    isLaunched = false;
    direction = 1;
    escaped = false;
    crashed = false;
}

function draw() {
    background(27); // Fondo #1B1B1B

    // Fondo cósmico sutil
    noStroke();
    for (let star of stars) {
        fill(255, 255, 255, star.alpha * (0.8 + 0.2 * sin(frameCount * 0.02)));
        ellipse(star.x * width, star.y * height, star.size, star.size);
    }

    // Obtener condiciones iniciales desde el slider
    let K0 = sliderK0 ? parseFloat(sliderK0.value) : 600;
    if (elValK0) elValK0.innerText = K0.toFixed(0) + " J";

    // Energía potencial en la superficie
    let U0 = -GM / r0;
    // Energía mecánica total constante
    let E = K0 + U0;

    // LÓGICA DE FÍSICA Y MOVIMIENTO
    let U = -GM / r;
    let K = E - U; // Energía cinética en la posición r

    if (isLaunched) {
        if (direction === 1) {
            // Ascenso: La velocidad horizontal es proporcional a la velocidad real (sqrt(2*K))
            if (K > 0) {
                let speed = sqrt(2 * K);
                let dt = 0.05; // Escala de tiempo para la animación
                r += speed * dt;

                // Comprobar escape
                if (r >= width - 30) {
                    isLaunched = false;
                    escaped = true;
                    direction = 0;
                }
            } else {
                // Llegó al apoastro vertical (retorno): energía cinética es cero
                r = -GM / E; // Altura máxima teórica exacta
                direction = -1;
            }
        } else if (direction === -1) {
            // Caída libre acelerando de vuelta al planeta
            let speed = sqrt(2 * max(0.1, K));
            let dt = 0.05;
            r -= speed * dt;

            // Colisión con la superficie
            if (r <= r0) {
                r = r0;
                isLaunched = false;
                direction = 0;
                crashed = true;
            }
        }
    }

    // Recalcular energías para telemetría
    U = -GM / r;
    K = max(0, E - U);

    // Actualizar telemetría DOM
    if (elK) elK.innerText = K.toFixed(1) + " J";
    if (elU) elU.innerText = U.toFixed(1) + " J";
    if (elE) {
        elE.innerText = E.toFixed(1) + " J";
        if (E >= 0) {
            elE.style.color = "#F682D5"; // Rosa (Escape garantizado)
        } else {
            elE.style.color = "#AAA2F5"; // Morado (Captura)
        }
    }

    if (elStatus) {
        if (escaped) {
            elStatus.innerText = "Escape Exitoso (Fuera del Pozo)";
            elStatus.style.color = "#F682D5";
        } else if (crashed) {
            elStatus.innerText = "Colisión con la Superficie";
            elStatus.style.color = "#FF8080";
        } else if (isLaunched) {
            elStatus.innerText = direction === 1 ? "Ascendiendo..." : "Caída Libre...";
            elStatus.style.color = direction === 1 ? "#FFFAA3" : "#AAA2F5";
        } else {
            elStatus.innerText = "Listo para el Lanzamiento";
            elStatus.style.color = "#FFFFFF";
        }
    }

    // DIBUJAR PLANO CARTESIANO Y GRÁFICO
    // Ejes cartesianos
    stroke(255, 255, 255, 30);
    strokeWeight(1);
    line(50, 40, 50, height - 40); // Eje Y (Energía)
    line(40, yZero, width - 20, yZero); // Eje X (Distancia r, E=0)

    // Etiquetas de los ejes
    fill(255, 120);
    noStroke();
    textFont('Inter', 10);
    textAlign(LEFT, TOP);
    text("Energía (E)", 60, 45);
    textAlign(RIGHT, BOTTOM);
    text("Distancia al centro (r)", width - 25, yZero - 10);

    // Línea de Umbral de Escape (E = 0)
    stroke('#FFFAA3'); // Amarillo
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    line(50, yZero, width - 20, yZero);
    drawingContext.setLineDash([]);
    fill('#FFFAA3');
    noStroke();
    textAlign(RIGHT, BOTTOM);
    text("Umbral de Escape (E = 0)", width - 25, yZero - 2);

    // DIBUJAR POZO GRAVITATORIO: Curva U(r) = -GM/r
    noFill();
    stroke('#3042B5'); // Azul acento
    strokeWeight(3);
    beginShape();
    for (let x = r0; x < width - 20; x++) {
        let uVal = -GM / x;
        let yVal = yZero - uVal * energyScale;
        vertex(x, yVal);
    }
    endShape();

    // Etiqueta de la curva U(r)
    fill('#3042B5');
    noStroke();
    textAlign(LEFT, TOP);
    text("Curva de Energía Potencial U(r) = -G*M/r", r0 + 20, yZero + 180);

    // DIBUJAR LÍNEA DE ENERGÍA TOTAL CONSTANTE (E)
    let eY = yZero - E * energyScale;
    stroke('#AAA2F5'); // Morado
    strokeWeight(1.5);
    drawingContext.setLineDash([4, 4]);
    line(r0, eY, width - 20, eY);
    drawingContext.setLineDash([]);
    
    fill('#AAA2F5');
    noStroke();
    textAlign(LEFT, BOTTOM);
    text("Energía Mecánica Total Constante (E = " + Math.round(E) + " J)", r0 + 10, eY - 4);

    // DIBUJAR EL PLANETA (Visualización del sector del planeta a la izquierda)
    fill(48, 66, 181); // Azul oscuro
    stroke(170, 162, 245);
    strokeWeight(2);
    // Dibujamos un semicírculo en la parte izquierda que representa el planeta
    ellipse(0, yZero, r0 * 2, r0 * 2);
    
    fill(255, 150);
    noStroke();
    textAlign(CENTER, CENTER);
    text("PLANETA", 35, yZero);

    // COORDENADAS DEL COHETE EN EL GRÁFICO
    let rocketX = r;
    let rocketY = yZero - U * energyScale;

    // BARRA DE ENERGÍA CINÉTICA VERTICAL (K)
    if (!crashed && !escaped) {
        stroke('#F682D5'); // Rosa
        strokeWeight(4);
        line(rocketX, rocketY, rocketX, eY); // Conecta la curva U(r) con la línea de energía total E
        
        // Etiqueta "K" al lado de la barra
        fill('#F682D5');
        noStroke();
        textAlign(LEFT, CENTER);
        textFont('Courier New', 11);
        text(" K: " + Math.round(K) + " J", rocketX + 6, (rocketY + eY) / 2);
    }

    // DIBUJAR EL COHETE EN LA CURVA
    if (!crashed && !escaped) {
        push();
        translate(rocketX, rocketY);

        // Calcular ángulo tangente de la curva: dy/dx = - (GM / x^2) * scale
        let slope = - (GM / (r * r)) * energyScale;
        let angle = atan2(slope, 1);
        
        // Si cae, gira el cohete hacia abajo
        if (direction === -1) {
            angle += PI;
        }
        rotate(angle);

        // Estela del motor
        if (isLaunched && direction === 1) {
            noStroke();
            fill(255, 250, 163, 180 + 75 * sin(frameCount * 0.6));
            triangle(-10, 0, -22, -4, -22, 4);
        }

        // Fuselaje del Cohete
        stroke(255);
        strokeWeight(1);
        fill('#F682D5');
        triangle(12, 0, -8, -5, -8, 5);
        pop();
    }

    // PANTALLAS DE FIN DE SIMULACIÓN
    if (escaped) {
        textAlign(CENTER, CENTER);
        textFont('Inter', 26);
        textStyle(BOLD);
        
        // Sombra
        fill(0, 180);
        text("ESCAPE EXITOSO", width / 2 + 2, height / 2 + 2);
        
        // Texto principal
        fill('#F682D5');
        text("ESCAPE EXITOSO", width / 2, height / 2);
        
        textFont('Inter', 12);
        textStyle(NORMAL);
        fill(255, 180);
        text("El cohete superó la gravedad del planeta (E >= 0)", width / 2, height / 2 + 30);
    } else if (crashed) {
        textAlign(CENTER, CENTER);
        textFont('Inter', 26);
        textStyle(BOLD);
        
        // Sombra
        fill(0, 180);
        text("LANZAMIENTO FALLIDO", width / 2 + 2, height / 2 + 2);
        
        // Texto principal
        fill('#FF8080');
        text("LANZAMIENTO FALLIDO", width / 2, height / 2);
        
        textFont('Inter', 12);
        textStyle(NORMAL);
        fill(255, 180);
        text("La energía cinética se agotó antes de escapar (E < 0)", width / 2, height / 2 + 30);
    }

    // TELEMETRÍA FLOTANTE EN CANVAS
    let tx = 75;
    let ty = height - 70;
    fill(22, 22, 22, 210);
    stroke(48, 66, 181, 80);
    strokeWeight(1);
    rect(tx - 10, ty - 15, 230, 65, 6);

    noStroke();
    fill(255);
    textFont('Courier New', 11);
    textStyle(BOLD);
    text("K: " + Math.round(K) + " J | U: " + Math.round(U) + " J", tx, ty + 10);
    if (E >= 0) {
        fill('#F682D5');
    } else {
        fill('#FFFAA3');
    }
    text("E Mecánica Total: " + Math.round(E) + " J", tx, ty + 30);
    textStyle(NORMAL);
}

function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const w = container.offsetWidth;
        resizeCanvas(w, 400);
    }
}
