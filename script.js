// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            // Cambiar icono de hamburguesa a X y viceversa
            const icon = mobileMenuButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== "#" && href.startsWith("#")) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    // Considerar la altura del header si es sticky para un offset
                    // const headerOffset = document.querySelector('header')?.offsetHeight || 0;
                    // const elementPosition = targetElement.getBoundingClientRect().top;
                    // const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    // window.scrollTo({ top: offsetPosition, behavior: "smooth" });

                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
            // Close mobile menu on item click
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuButton.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });

    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('i.fas');
            
            // Cerrar otras respuestas abiertas si se desea un comportamiento de acordeón puro
            // faqQuestions.forEach(q => {
            //     if (q !== question) {
            //         q.nextElementSibling.classList.add('hidden');
            //         q.querySelector('i.fas').classList.remove('fa-chevron-up');
            //         q.querySelector('i.fas').classList.add('fa-chevron-down');
            //     }
            // });

            if (answer) {
                answer.classList.toggle('hidden');
            }
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
    });

    // Modal for 3D Prototype
    const explorePrototypeBtn = document.getElementById('explore-prototype-btn');
    const modal3D = document.getElementById('modal-3d');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const interactive3DViewer = document.getElementById('interactive-3d-viewer');
    const loadingText = document.getElementById('loading-text');

    let scene, camera, renderer, cube, controls, animationFrameId;

    function initThreeJS() {
        if (!interactive3DViewer || typeof THREE === 'undefined') {
            console.error("Three.js o el contenedor del visor no están disponibles.");
            if (loadingText) loadingText.textContent = "Error al cargar visor 3D.";
            return;
        }
        
        // Limpiar cualquier contenido previo (canvas, texto de carga)
        interactive3DViewer.innerHTML = ''; 

        // 1. Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xeeeeee);

        // 2. Camera
        const viewerRect = interactive3DViewer.getBoundingClientRect();
        camera = new THREE.PerspectiveCamera(75, viewerRect.width / viewerRect.height, 0.1, 1000);
        camera.position.set(0, 1.5, 4); // Ajustar posición inicial de la cámara

        // 3. Renderer
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (e) {
            console.error("Error al inicializar WebGLRenderer:", e);
            interactive3DViewer.innerHTML = '<p class="text-red-500 p-4">No se pudo inicializar el visor 3D. Asegúrate de que WebGL esté habilitado en tu navegador.</p>';
            return;
        }
        renderer.setSize(viewerRect.width, viewerRect.height);
        renderer.setPixelRatio(window.devicePixelRatio);
        interactive3DViewer.appendChild(renderer.domElement);


        // 4. Geometry and Material (a simple cube as placeholder)
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, // Indigo
            roughness: 0.5,
            metalness: 0.1 
        });
        cube = new THREE.Mesh(geometry, material);
        cube.position.y = 0.75; // Levantar el cubo para que esté sobre el "suelo"
        scene.add(cube);

        // Añadir un suelo simple (opcional)
        const planeGeometry = new THREE.PlaneGeometry(10, 10);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide, roughness: 0.8 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // Rotar para que sea horizontal
        // plane.position.y = -0.75; // Posicionar debajo del cubo
        scene.add(plane);


        // 5. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true; // Opcional: para sombras
        scene.add(directionalLight);

        // Configurar sombras (opcional, puede impactar rendimiento)
        // renderer.shadowMap.enabled = true;
        // cube.castShadow = true;
        // plane.receiveShadow = true;

        // 6. Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 2;
            controls.maxDistance = 15;
            controls.target.set(0, 0.75, 0); // Apuntar al centro del cubo
            controls.update();
        } else {
            console.warn("OrbitControls no está cargado. La interacción 3D estará limitada.");
        }
        
        window.addEventListener('resize', onWindowResize, false);
        onWindowResize(); // Llamar para ajustar tamaño inicial
    }

    function onWindowResize() {
        if (!renderer || !camera || !interactive3DViewer) return;
        
        // Solo redimensionar si el modal está activo y el visor es visible
        if (modal3D && modal3D.classList.contains('active')) {
            const viewerRect = interactive3DViewer.getBoundingClientRect();
            if (viewerRect.width > 0 && viewerRect.height > 0) {
                camera.aspect = viewerRect.width / viewerRect.height;
                camera.updateProjectionMatrix();
                renderer.setSize(viewerRect.width, viewerRect.height);
            }
        }
    }
    
    function animateThreeJS() {
        if (!renderer || !scene || !camera) return; 
        animationFrameId = requestAnimationFrame(animateThreeJS);

        if (cube) {
            // cube.rotation.x += 0.003;
            // cube.rotation.y += 0.003;
        }
        if (controls) {
            controls.update();
        }
        renderer.render(scene, camera);
    }

    function stopThreeJSAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    function disposeThreeJS() {
        stopThreeJSAnimation();
        window.removeEventListener('resize', onWindowResize);

        if (controls) controls.dispose();
        
        if (scene) {
            // Eliminar todos los objetos de la escena y disponer sus geometrías/materiales
            scene.traverse(object => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
            // Eliminar todos los hijos de la escena
             while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
            }
        }

        if (renderer) {
            renderer.dispose(); // Limpia el contexto WebGL
            if (renderer.domElement && renderer.domElement.parentElement) {
                 renderer.domElement.parentElement.removeChild(renderer.domElement);
            }
            renderer = null;
        }
        
        // Restablecer variables
        scene = null;
        camera = null;
        controls = null;
        cube = null; // y cualquier otro objeto 3D

        if (interactive3DViewer && loadingText) {
            interactive3DViewer.innerHTML = ''; // Limpiar canvas
            const p = document.createElement('p');
            p.id = 'loading-text';
            p.className = 'text-gray-500';
            p.textContent = 'Cargando modelo 3D interactivo...';
            interactive3DViewer.appendChild(p);
        }
    }

    if (explorePrototypeBtn && modal3D && closeModalBtn && interactive3DViewer) {
        explorePrototypeBtn.addEventListener('click', () => {
            modal3D.classList.add('active');
            // Retrasar la inicialización para asegurar que el modal sea visible y las dimensiones sean correctas
            setTimeout(() => {
                if (!renderer) { 
                    initThreeJS();
                }
                if (renderer) { // Solo animar si el renderer se inicializó correctamente
                    animateThreeJS(); 
                    onWindowResize(); // Ajustar tamaño después de que el modal esté completamente renderizado
                }
            }, 150); // Un poco más de tiempo para asegurar renderizado del modal
        });

        const closeAndCleanModal = () => {
            modal3D.classList.remove('active');
            // Esperar a que la animación de cierre del modal termine antes de limpiar
            setTimeout(() => {
                 disposeThreeJS(); // Limpieza completa al cerrar
            }, 300); // Coincidir con la duración de la transición del modal si la hay
        };

        closeModalBtn.addEventListener('click', closeAndCleanModal);

        modal3D.addEventListener('click', (event) => {
            if (event.target === modal3D) { // Si se hace clic en el fondo del modal
                closeAndCleanModal();
            }
        });
    } else {
        console.error("Uno o más elementos del modal 3D (botones, contenedor) no fueron encontrados en el DOM.");
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simulación de envío
            formStatus.textContent = 'Gracias por su mensaje. Nos pondremos en contacto pronto.';
            formStatus.className = 'mt-4 text-center text-green-300'; // Asegúrate que este color contraste bien con el fondo
            contactForm.reset();
            setTimeout(() => { 
                formStatus.textContent = ''; 
                formStatus.className = 'mt-4 text-center'; // Reset class
            }, 5000);
        });
    }
    
    // Sandbox request button
    const sandboxRequestBtn = document.getElementById('sandbox-request-btn');
    if (sandboxRequestBtn) {
        sandboxRequestBtn.addEventListener('click', () => {
            // Aquí se podría abrir un modal específico para la solicitud del sandbox
            // o redirigir a una página/sección diferente.
            alert('Gracias por su interés en el Sandbox. Esta funcionalidad se activará pronto. Por ahora, puede usar el formulario de contacto general para expresar su interés.');
        });
    }

    // Language Switcher (Conceptual - requiere implementación completa de i18n)
    const langSwitcher = document.getElementById('lang-switcher');
    let currentLang = 'es'; // Asumiendo español como idioma por defecto
    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            if (currentLang === 'es') {
                // Aquí iría la lógica para cambiar todos los textos a Inglés.
                // Esto usualmente involucra tener un objeto o JSON con las traducciones
                // y recorrer los elementos del DOM para actualizar su textContent.
                alert('Language switching to English (EN) is not yet implemented.');
                // Ejemplo conceptual: document.querySelector('#hero h1').textContent = "VOTE-5D: The Future of Secure Democracy in Chile";
                // langSwitcher.textContent = 'ES';
                // currentLang = 'en';
            } else {
                alert('Language switching to Spanish (ES) is not yet implemented.');
                // langSwitcher.textContent = 'EN';
                // currentLang = 'es';
            }
        });
    }

    // Set current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

}); // Fin de DOMContentLoaded
