// Simulación de Movimiento de un Proyectil en 2D (Vista Lateral)
// Usando ecuaciones paramétricas de la Física Mecánica

let t = 0;
let shooting = false;
let x0, y0;
let v0x = 0;
let v0y = 0;
let g = 0.25; // Gravedad a escala en píxeles por frame
let projectile = { x: 0, y: 0 };
let trajectory = []; // Almacena los puntos previos para dibujar la estela

// Elementos del DOM para la telemetría en tiempo real
let elT, elX, elY, elVx, elVy;

function setup() {
    // Obtener contenedor para dimensionar el lienzo dinámicamente
    const container = document.getElementById('sim-container');
    const width = container.offsetWidth;
    const height = 400;
    
    const canvas = createCanvas(width, height);
    canvas.parent('sim-container');
    
    // El origen (x0, y0) se ubica en la esquina inferior izquierda
    x0 = 50;
    y0 = height - 50;
    
    // Inicializar variables del DOM
    elT = document.getElementById('val-t');
    elX = document.getElementById('val-x');
    elY = document.getElementById('val-y');
    elVx = document.getElementById('val-vx');
    elVy = document.getElementById('val-vy');
    
    resetSim();
}

function draw() {
    background(27); // Color de fondo #1B1B1B
    
    // Dibujar suelo (línea de referencia horizontal)
    stroke(48, 66, 181, 120); // #3042B5 con opacidad
    strokeWeight(2);
    line(0, y0 + 5, width, y0 + 5);
    
    // Dibujar base del cañón (punto de inicio)
    noStroke();
    fill(48, 66, 181);
    arc(x0, y0, 30, 30, PI, TWO_PI);
    
    // Si no está disparando, mostrar guía apuntando al ratón
    if (!shooting) {
        let angle = atan2(mouseY - y0, mouseX - x0);
        // Constreñir ángulo al cuadrante superior derecho (disparo hacia adelante/arriba)
        angle = constrain(angle, -PI/2, 0);
        
        push();
        translate(x0, y0);
        rotate(angle);
        stroke(170, 162, 245); // #AAA2F5
        strokeWeight(4);
        line(0, 0, 35, 0);
        pop();
        
        // Texto instructivo en el canvas
        fill(160);
        noStroke();
        textSize(13);
        textAlign(CENTER);
        text("Haz clic dentro del área para disparar en dirección al cursor", width / 2, 30);
    }
    
    // Física y renderizado durante el disparo
    if (shooting) {
        t += 0.4; // Incremento de tiempo
        
        // Ecuaciones paramétricas aplicadas
        let px = x0 + v0x * t;
        let py = y0 - (v0y * t - 0.5 * g * t * t);
        
        projectile.x = px;
        projectile.y = py;
        
        // Añadir posición actual a la estela
        trajectory.push(createVector(px, py));
        
        // Dibujar estela
        stroke(248, 212, 238, 120); // #F8D4EE con opacidad
        strokeWeight(3);
        noFill();
        beginShape();
        for (let pos of trajectory) {
            vertex(pos.x, pos.y);
        }
        endShape();
        
        // Dibujar proyectil
        noStroke();
        fill(248, 212, 238); // #F8D4EE
        ellipse(projectile.x, projectile.y, 14, 14);
        
        // Calcular componentes de velocidad instantánea
        let currentVx = v0x;
        let currentVy = v0y - g * t;
        
        // Actualizar telemetría en el DOM
        if (elT) elT.innerText = (t * 0.1).toFixed(2) + " s";
        if (elX) elX.innerText = (px - x0).toFixed(1) + " m";
        if (elY) elY.innerText = max(0, (y0 - py)).toFixed(1) + " m";
        if (elVx) elVx.innerText = (currentVx * 10).toFixed(1) + " m/s";
        if (elVy) elVy.innerText = (currentVy * 10).toFixed(1) + " m/s";
        
        // Detener simulación al chocar con el suelo o salir del canvas
        if (py >= y0 || px > width || py < -1000) {
            shooting = false;
        }
    }
}

function mousePressed() {
    // Verificar si el clic fue dentro del canvas
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !shooting) {
        let dx = mouseX - x0;
        let dy = y0 - mouseY;
        
        // Solo permitir disparar si el vector apunta hacia la derecha y arriba
        if (dx > 5 && dy > 5) {
            // Factor de escala para convertir distancia en velocidad
            let speedFactor = 0.07;
            v0x = dx * speedFactor;
            v0y = dy * speedFactor;
            
            // Limitar velocidad de disparo máxima
            let speed = sqrt(v0x * v0x + v0y * v0y);
            if (speed > 16) {
                v0x = (v0x / speed) * 16;
                v0y = (v0y / speed) * 16;
            }
            
            t = 0;
            trajectory = [];
            shooting = true;
        }
    }
}

function resetSim() {
    shooting = false;
    t = 0;
    trajectory = [];
    
    // Restaurar telemetría a ceros
    if (elT) elT.innerText = "0.00 s";
    if (elX) elX.innerText = "0.0 m";
    if (elY) elY.innerText = "0.0 m";
    if (elVx) elVx.innerText = "0.0 m/s";
    if (elVy) elVy.innerText = "0.0 m/s";
}

// Escuchar cambios de tamaño en el contenedor para redimensionar el lienzo de forma responsiva
function windowResized() {
    const container = document.getElementById('sim-container');
    if (container) {
        const width = container.offsetWidth;
        resizeCanvas(width, 400);
        x0 = 50;
        y0 = height - 50;
        resetSim();
    }
}
