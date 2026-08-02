# Portafolio de Fisica I

Portafolio web interactivo desarrollado por Sidney Rodriguez para el curso de Fisica I en la Universidad CENFOTEC, como parte del Bachillerato en Ingeniería de Software.
El objetivo del proyecto es demostrar la aplicacion directa de conceptos de fisica teorica al desarrollo de software, presentando para cada tema un caso especifico de ingenieria, el concepto fisico subyacente, la justificacion tecnica de su uso y una simulacion o diagrama interactivo implementado en el navegador.

---

## Tecnologías Utilizadas

* **HTML5 y CSS3** — Estructura semántica de cada subpágina y hoja de estilos global unificada (`assets/css/style.css`) que define el sistema de diseno, la paleta de colores en modo oscuro y todos los componentes reutilizables del portafolio.
* **JavaScript (Vanilla)** — Logica de control de los componentes de la interfaz, lectura de valores de sliders e inputs en tiempo real, y actualizacion dinamica de los paneles de telemetria HTML.
* **p5.js** — Biblioteca de dibujo y animacion 2D utilizada para implementar todas las simulaciones interactivas. Se emplea en modo instancia (`new p5(sketch)`) para encapsular cada simulacion en su propio contexto y evitar conflictos de variables globales entre paginas.
* **MathJax** — Motor de renderizado de expresiones matematicas en LaTeX integrado en las paginas que presentan ecuaciones fisicas complejas.

---

## Avance 1

### Semana 2

* **Movimiento en 3 Dimensiones:** Los motores graficos y videojuegos descomponen el movimiento de proyectiles en tres ejes independientes (MRU en X y Z, MRUA en Y bajo gravedad). Programar las ecuaciones parametricas del movimiento en lugar de animar arcos predefinidos garantiza precision absoluta en colisiones fisicas sin importar el angulo de disparo inicial, el viento o las variaciones del entorno, eliminando la necesidad de recursos graficos pregrabados y optimizando el consumo de memoria al no requerir animaciones almacenadas.

* **Movimiento Circular Uniforme:** En simuladores, robotica y videojuegos, los elementos que giran a ritmo uniforme —como el escaner de un radar de deteccion de colisiones— deben hacerlo a una velocidad angular definida en funcion del tiempo real transcurrido, no en grados fijos por fotograma. Al calcular el angulo como `theta = omega * delta_t`, se garantiza que la rotacion sea fisicamente constante independientemente de la tasa de refresco del dispositivo, resolviendo problemas de desincronizacion en entornos multijugador y sistemas embebidos de tiempo real.

### Semana 3

* **Fuerza Centripeta:** En simuladores de combate aereo, el motor de fisicas calcula la aceleracion centripeta (`ac = V^2 / R`) a la que esta sometida la camara del piloto durante un giro cerrado. Si este valor supera un umbral configurado (por ejemplo, 9G), el software activa un filtro visual de opacidad que oscurece la pantalla gradualmente simulando la perdida de flujo sanguineo al cerebro (G-LOC). A diferencia de una animacion de dano preprogramada, el sistema es completamente dinamico: el efecto visual se ajusta en tiempo real a las acciones impredecibles del jugador, obligandolo a gestionar su energia cinetica con precision.

* **Fuerza de Friccion:** Al programar el movimiento de un personaje u objeto pesado, se simulan dos tipos de resistencia: friccion estatica (cuando el objeto esta en reposo) y friccion cinetica (cuando ya esta deslizandose). Usar un umbral alto de friccion estatica seguido de una caida a la friccion cinetica una vez iniciado el movimiento otorga un peso fisico real a los objetos, previniendo el desplazamiento flotante y poco natural que produciria una unica desaceleracion generica y mejorando la respuesta del control y la inmersion del jugador.

### Semana 4

* **Trabajo y Energia:** En lugar de usar barras de puntos de vida arbitrarias, el motor de fisicas aplica el teorema de Trabajo-Energia Cinetica para calcular la distancia exacta que un objeto penetra en un material al impactar. Conociendo la energia cinetica acumulada durante la caida y la fuerza de resistencia del material, el software despeja la distancia de penetracion (`delta_x = K / F`), permitiendo simular impactos, abolladuras y destruccion de terreno de forma fisicamente precisa y adaptable a diferentes materiales mediante la modificacion del coeficiente de resistencia del obstaculo.

* **Conservacion de la Energia:** Cuando un proyectil impacta un bloque en un pendulo balistico y ambos se elevan, calcular cuadro por cuadro como la gravedad los frena es computacionalmente ineficiente. Al igualar la energia cinetica maxima en la base con la energia potencial en la altura maxima (`(1/2)mV^2 = mgh`), el software obtiene la altura final instantaneamente mediante una unica operacion aritmetica de complejidad O(1), sin necesidad de un bucle iterativo, liberando carga critica del procesador y eliminando riesgos de inestabilidad numerica.

### Semana 5

* **Impulso:** Las maniobras evasivas o de propulsion de duracion muy breve son inestables si se implementan sumando aceleracion continua fotograma a fotograma, ya que las caidas aleatorias de framerate distorsionan el resultado. El Impulso permite calcular exactamente el cambio de velocidad de la nave tras aplicar una fuerza intensa en un tiempo microscopico (`delta_v = F * delta_t / m`) y aplicarlo al vector de velocidad de forma instantanea en una sola operacion, asegurando trayectorias fisicamente exactas y liberando al motor fisico de inestabilidades al procesar colisiones, explosiones y maniobras abruptas.

* **Colisiones Inelasticas:** Cuando dos objetos deben quedar pegados tras un impacto —por ejemplo, una flecha clavandose en una caja en movimiento— los motores fisicos pueden generar el bug de clipping o solapamiento geometrico infinito. Al tratar el choque como una colision perfectamente inelastica, el codigo elimina ambos objetos originales y crea uno nuevo con masa igual a la suma de ambos y velocidad calculada exactamente por conservacion del momento (`m1*V1i + m2*V2i = (m1+m2)*Vf`), previniendo bugs fisicos severos y ofreciendo visualizacion y rendimiento estables.

---

## Avance 2

### Semana 6

* **Conservacion del Momento Angular:** Los satelites artificiales utilizan volantes de inercia internos para reorientarse sin gastar combustible: al acelerar el volante en un sentido, el chasis rota en sentido contrario segun `I_s * omega_s = -(I_w * omega_w)`. El software implementa bucles de control PID que leen la inercia real del volante y regulan exactamente su velocidad rotacional, garantizando precision milimetrica en la orientacion de antenas y paneles solares durante anos de operacion, sin los sistemas de particulas complejos de propulsores quimicos que deteriorarian el rendimiento computacional.

* **Torque y Cinematica Inversa:** Al implementar la ecuacion de torque (`tau = r * F * sin(theta)`) en los resolvedores de articulaciones fisicas de personajes 3D, el software evita las animaciones incoherentes donde objetos de 100 kg se levantan con la misma facilidad que objetos ligeros. Al asociar la fisica de torques con los limites de fuerza maxima de cada articulacion, el motor limita la velocidad angular del brazo o colapsa la articulacion si el torque requerido excede la fuerza disponible, simulando de forma fluida y adaptativa la fatiga muscular y los limites de esfuerzo del personaje ante cualquier masa.

### Semana 8

* **Gravitacion y Orbitas Satelitales:** En simuladores espaciales, la navegacion no se basa en trayectorias circulares rigidas predefinidas. El motor resuelve vectorialmente la Ley de Gravitacion Universal de Newton cuadro por cuadro, integrando la fuerza neta en la aceleracion y velocidad del satelite. Esto permite modificar orbitas en tiempo real (circulares, elipticas, parabolicas o hiperbolicas) al encender motores en un eje particular, y habilita la simulacion de maniobras de asistencia gravitatoria (slingshot) que serian imposibles de codificar con trayectorias circulares rigidas preprogramadas.

* **Energia Potencial Gravitatoria y Pozos de Gravedad:** Cuando un videojuego necesita calcular si un cohete logra escapar de la atraccion de un planeta, no requiere simular costosas ecuaciones diferenciales vectoriales fotograma a fotograma. El software evalua si la energia cinetica inicial es suficiente para superar la profundidad del pozo de energia potencial gravitatoria (`U(r) = -G*M*m/r`): si la energia mecanica total es mayor o igual a cero, el escape esta garantizado y el sistema gatilla la transicion de escena de forma inmediata con complejidad O(1), eliminando riesgos de inestabilidad numerica y garantizando transiciones deterministas.

---

## Entrega Final

### Semana 9

* **Fisicas de Suspension en Simuladores de Conduccion:** Cada rueda de un vehiculo simulado actua como una masa sujeta a un resorte (constante k) y un amortiguador (coeficiente b). El motor de fisicas resuelve la ecuacion diferencial del MAS amortiguado en tiempo real para cada rueda de forma independiente, calculando el desplazamiento vertical ante baches o curvas. Esto genera respuestas fisicas emergentes y distintas segun el tipo de terreno, la velocidad y la carga del vehiculo, sin necesidad de animaciones predefinidas de suspension y con posibilidad de ajustar los parametros en tiempo de ejecucion para diferentes configuraciones de vehiculos.

* **Simulador de Calibracion de Relojes Mecanicos:** El software industrial analiza la frecuencia de oscilacion del volante spiral mediante sensores de alta precision y la compara con el periodo teorico calculado por la ecuacion del pendulo de torsion (`T = 2*pi*sqrt(J/kappa)`). Si se detecta una desviacion, el algoritmo calcula el ajuste preciso necesario en la constante de torsion del resorte espiral para corregir la frecuencia, reemplazando el proceso de calibracion manual por un ciclo automatizado y reproducible que elimina la variabilidad humana en la manufactura de alta precision.

### Semana 10

* **Sintetizador Virtual VST por Modelado Fisico:** Los plugins de sintesis por modelado fisico no almacenan grabaciones reales; resuelven en tiempo real la ecuacion de frecuencias armonicas (`fn = n*v / (2*L)`) a partir de las propiedades fisicas de una cuerda virtual (longitud, tension, densidad lineal). Cada armonico es una onda senoidal cuya superposicion genera la forma de onda compleja del instrumento. Esto permite modificar la tension o el material de la cuerda en tiempo real, produciendo un sonido mas expresivo que cualquier libreria de samples, con un tamano de archivo inferior a 5 MB frente a las decenas de gigabytes de las alternativas basadas en muestras pregrabadas.

* **Software BIM de Mapeo de Estres Estructural:** El software BIM recorre algoritmicamente cada vertice de la malla 3D de la estructura, extrae su coordenada de profundidad, calcula `P = rho * g * h` y asigna un color al espectro de calor proporcional al valor de presion. El resultado es un mapa de calor instantaneo que permite al ingeniero de estructuras identificar visualmente las zonas criticas que requieren mayor espesor o refuerzo estructural, reduciendo el tiempo de analisis de semanas a minutos y eliminando errores humanos en los calculos de profundidad sobre mallas de decenas de miles de vertices.

### Semana 11

* **Simulacion de Carga Aerodinamica (Downforce):** El motor de fisicas aplica el Principio de Bernoulli para calcular la diferencia de presion entre la superficie superior (flujo lento, mayor presion) e inferior (flujo rapido por mayor curvatura, menor presion) del aleron invertido de un vehiculo de carreras. La fuerza neta resultante `F_down = (P_sup - P_inf) * A` se suma al peso del vehiculo para computar la fuerza normal sobre cada llanta, alterando dinamicamente el agarre segun la velocidad y habilitando mecanicas emergentes como el efecto rebufo, donde la estela de baja presion del vehiculo delantero reduce el downforce del que le sigue.

* **Algoritmos SCADA para Mantenimiento Predictivo:** El algoritmo SCADA analiza el flujo de datos de sensores de presion en tiempo real implementando un sliding window detector que calcula la derivada `dP/dt`. Si esta derivada supera un umbral critico, el sistema clasifica el evento como un golpe de ariete —pico de presion extremo descrito por la formula de Joukowsky `delta_P = rho * c * delta_V`— y activa automaticamente un protocolo de apagado de emergencia que cierra las electrovalvulas de forma gradual. Todo el ciclo de deteccion-reaccion ocurre en milisegundos, antes de que la onda de presion propague dano estructural a la instalacion.
