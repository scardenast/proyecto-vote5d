// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        // Populate mobile menu with links from the main navigation
        const navContainer = document.querySelector('header nav');
        const desktopNavLinks = navContainer ? navContainer.querySelector('div.hidden.md\\:flex') : null;
        
        if (desktopNavLinks) {
            mobileMenu.innerHTML = desktopNavLinks.innerHTML;
            // Add necessary classes for mobile styling if different
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.classList.add('block', 'px-6', 'py-3', 'hover:bg-indigo-50');
                link.classList.remove('relative'); // Remove any desktop-specific classes
            });
        }

        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
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
            
            if (answer) {
                answer.classList.toggle('hidden');
            }
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
    });

    // --- Three.js Modal Logic ---
    const explorePrototypeBtn = document.getElementById('explore-prototype-btn');
    const modal3D = document.getElementById('modal-3d');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const interactive3DViewer = document.getElementById('interactive-3d-viewer');
    const loadingText = document.getElementById('loading-text');

    let scene, camera, renderer, model, controls, animationFrameId;
    const modelPath = null; // Set to null to load placeholder cube, or provide path e.g., 'model.glb'

    function initThreeJS() {
        if (!interactive3DViewer || typeof THREE === 'undefined') {
            console.error("Three.js or the viewer container is not available.");
            if (loadingText) loadingText.textContent = "Error al cargar visor 3D.";
            return false; 
        }
        
        interactive3DViewer.innerHTML = ''; 
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xeeeeee); 

        const viewerRect = interactive3DViewer.getBoundingClientRect();
        camera = new THREE.PerspectiveCamera(50, viewerRect.width / viewerRect.height, 0.1, 1000);
        camera.position.set(0, 1.6, 5); 

        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
        } catch (e) {
            console.error("Error initializing WebGLRenderer:", e);
            interactive3DViewer.innerHTML = '<p class="text-red-500 p-4">No se pudo inicializar el visor 3D. Asegúrese de que WebGL esté habilitado en su navegador.</p>';
            return false; 
        }
        renderer.setSize(viewerRect.width, viewerRect.height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true; 
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        interactive3DViewer.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); 
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024; 
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;    
        directionalLight.shadow.camera.far = 50;     
        scene.add(directionalLight);

        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8, metalness: 0.2 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; 
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 1;
            controls.maxDistance = 20;
            controls.target.set(0, 1, 0); 
            controls.update();
        } else {
            console.warn("OrbitControls.js is not loaded. 3D interaction will be limited.");
        }

        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            if (modelPath) { 
                if(loadingText) loadingText.style.display = 'block'; 
                loader.load(modelPath, function (gltf) {
                    model = gltf.scene;
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2.0 / maxDim; 
                    
                    model.scale.set(scale, scale, scale);
                    model.position.sub(center.multiplyScalar(scale)); 
                    model.position.y += (size.y * scale / 2); 

                    model.traverse(function (node) {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true; 
                        }
                    });
                    scene.add(model);
                    if (loadingText) loadingText.style.display = 'none';
                }, undefined, function (error) {
                    console.error('Error loading GLTF model from path:', modelPath, error);
                    if (loadingText) loadingText.textContent = "Error al cargar modelo 3D.";
                    loadPlaceholderCube(); 
                });
            } else {
                loadPlaceholderCube(); 
            }
        } else {
            console.warn("GLTFLoader.js is not loaded. Displaying placeholder cube.");
            loadPlaceholderCube();
        }
        
        window.addEventListener('resize', onWindowResizeThreeJS, false);
        onWindowResizeThreeJS(); 
        return true; 
    }

    function loadPlaceholderCube() {
        const geometry = new THREE.BoxGeometry(1, 1.5, 1); 
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, 
            roughness: 0.4,
            metalness: 0.1 
        });
        model = new THREE.Mesh(geometry, material); 
        model.position.y = 0.75; 
        model.castShadow = true;
        scene.add(model);
        if (loadingText) loadingText.style.display = 'none'; 
    }

    function onWindowResizeThreeJS() {
        if (!renderer || !camera || !interactive3DViewer) return;
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
        window.removeEventListener('resize', onWindowResizeThreeJS);
        if (controls) controls.dispose();
        if (scene) {
            scene.traverse(object => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => {
                                if (material.map) material.map.dispose();
                                material.dispose();
                            });
                        } else {
                            if (object.material.map) object.material.map.dispose();
                            object.material.dispose();
                        }
                    }
                }
            });
             while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
            }
        }
        if (renderer) {
            renderer.dispose(); 
            if (renderer.domElement && renderer.domElement.parentElement) {
                 renderer.domElement.parentElement.removeChild(renderer.domElement);
            }
            renderer = null; 
        }
        scene = null;
        camera = null;
        controls = null;
        model = null; 
        if (interactive3DViewer && loadingText) {
            interactive3DViewer.innerHTML = ''; 
            const p = document.createElement('p');
            p.id = 'loading-text';
            p.className = 'text-gray-500'; 
            p.textContent = 'Cargando modelo 3D interactivo...';
            interactive3DViewer.appendChild(p);
            loadingText.style.display = 'block'; 
        }
    }

    if (explorePrototypeBtn && modal3D && closeModalBtn && interactive3DViewer) {
        explorePrototypeBtn.addEventListener('click', () => {
            modal3D.classList.add('active');
            setTimeout(() => {
                if (!renderer) { 
                    if(initThreeJS()) { 
                         animateThreeJS(); 
                         onWindowResizeThreeJS(); 
                    }
                } else { 
                    animateThreeJS(); 
                    onWindowResizeThreeJS();
                }
            }, 150); 
        });
        const closeAndCleanModal = () => {
            modal3D.classList.remove('active');
            setTimeout(disposeThreeJS, 300); 
        };
        closeModalBtn.addEventListener('click', closeAndCleanModal);
        modal3D.addEventListener('click', (event) => {
            if (event.target === modal3D) { 
                closeAndCleanModal();
            }
        });
    } else {
        console.error("One or more 3D modal elements (buttons, container) were not found in the DOM.");
    }

    // --- Chart.js Logic ---
    const fiveFactorCtx = document.getElementById('fiveFactorAuthChart');
    if (fiveFactorCtx && typeof Chart !== 'undefined') {
        new Chart(fiveFactorCtx, {
            type: 'doughnut',
            data: {
                labels: ['Huella Digital', 'Reconocimiento Facial', 'Voz', 'Firma Digital', 'Autenticador Móvil'],
                datasets: [{
                    label: 'Factores de Autenticación',
                    data: [20, 20, 20, 20, 20], 
                    backgroundColor: [
                        'rgba(79, 70, 229, 0.7)',  
                        'rgba(96, 165, 250, 0.7)', 
                        'rgba(52, 211, 153, 0.7)', 
                        'rgba(250, 204, 21, 0.7)',  
                        'rgba(248, 113, 113, 0.7)'  
                    ],
                    borderColor: [ 
                        'rgba(79, 70, 229, 1)',
                        'rgba(96, 165, 250, 1)',
                        'rgba(52, 211, 153, 1)',
                        'rgba(250, 204, 21, 1)',
                        'rgba(248, 113, 113, 1)'
                    ],
                    borderWidth: 1.5, 
                    hoverOffset: 10 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, 
                aspectRatio: 1.2, // Ajusta esto para controlar la proporción del gráfico de dona
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 10, family: 'Inter' }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de los 5 Factores de Autenticación',
                        padding: { top: 10, bottom: 15 },
                        font: { size: 14, weight: '600', family: 'Inter' }, 
                        color: '#1a237e' 
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    } else {
        if (!fiveFactorCtx) console.error("Canvas 'fiveFactorAuthChart' not found.");
        if (typeof Chart === 'undefined') console.error("Chart.js library is not loaded.");
    }

    const impactCtx = document.getElementById('impactChart');
    if (impactCtx && typeof Chart !== 'undefined') {
        new Chart(impactCtx, {
            type: 'bar',
            data: {
                labels: ['Reducción Abstención', 'Inclusión Zonas Rurales', 'Satisfacción Esperada', 'Reducción Costos Logísticos'],
                datasets: [{
                    label: 'Impacto Proyectado (%)',
                    data: [15, 20, 90, 50], 
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',  
                        'rgba(16, 185, 129, 0.7)', 
                        'rgba(234, 179, 8, 0.7)',   
                        'rgba(239, 68, 68, 0.7)'    
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4, 
                    barPercentage: 0.7, 
                    categoryPercentage: 0.8 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Clave para que respete la altura del contenedor CSS
                indexAxis: 'y', 
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100, 
                        ticks: {
                            callback: function(value) { return value + "%" },
                            font: { family: 'Inter' },
                            color: '#4b5563' 
                        },
                        grid: {
                            color: '#e5e7eb' 
                        }
                    },
                    y: {
                        ticks: {
                             font: { size: 11, family: 'Inter' },
                             color: '#4b5563' 
                        },
                        grid: {
                            display: false 
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false 
                    },
                    title: {
                        display: true,
                        text: 'Métricas Clave de Impacto Esperado',
                        padding: { top: 10, bottom: 20 },
                        font: { size: 16, weight: '600', family: 'Inter' },
                        color: '#1a237e' 
                    },
                    tooltip: {
                        backgroundColor: '#1f2937', 
                        titleFont: { family: 'Inter', weight: 'bold' },
                        bodyFont: { family: 'Inter' },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.x !== null) { label += context.parsed.x + '%'; }
                                return label;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1200, 
                    easing: 'easeOutQuart' 
                }
            }
        });
    } else {
         if (!impactCtx) console.error("Canvas 'impactChart' not found.");
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            formStatus.textContent = 'Gracias por su mensaje. Nos pondremos en contacto pronto.';
            formStatus.className = 'mt-4 text-center text-green-300'; 
            contactForm.reset();
            setTimeout(() => { 
                formStatus.textContent = ''; 
                formStatus.className = 'mt-4 text-center'; 
            }, 5000);
        });
    }
    
    const sandboxRequestBtn = document.getElementById('sandbox-request-btn');
    if (sandboxRequestBtn) {
        sandboxRequestBtn.addEventListener('click', () => {
            alert('Gracias por su interés en el Sandbox. Esta funcionalidad se activará pronto. Por ahora, puede usar el formulario de contacto general.');
        });
    }

    const langSwitcher = document.getElementById('lang-switcher');
    let currentLang = 'es'; 
    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            alert('La funcionalidad de cambio de idioma aún no está implementada completamente.');
        });
    }

    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

}); // End of DOMContentLoaded
