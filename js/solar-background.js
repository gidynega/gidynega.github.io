
/* =====================================================
   GIDY NEGA — GOLDEN SOLAR ANIMATION ENGINE
   Three.js | Mobile Optimized | Version 1.0
===================================================== */

import * as THREE from
    "https://unpkg.com/three@0.160.0/build/three.module.js";

const container = document.getElementById("solar-background");

if (!container) {
    console.warn("Solar background container not found.");
} else {

    // -----------------------------------------------
    // 1. PERFORMANCE SETTINGS
    // -----------------------------------------------

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const particleCount = isMobile ? 850 : 2400;
    const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        isMobile ? 1.25 : 1.6
    );

    // -----------------------------------------------
    // 2. SCENE AND CAMERA
    // -----------------------------------------------

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        150
    );

    camera.position.set(0, 1.1, 10);

    // -----------------------------------------------
    // 3. WEBGL RENDERER
    // -----------------------------------------------

    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile,
            powerPreference: "low-power"
        });
    } catch (error) {
        console.warn("WebGL is unavailable:", error);
    }

    if (!renderer) {
        container.style.background =
            "radial-gradient(circle, #70400b, #100b09 55%, #08070b)";
    } else {

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderer.setClearColor(0x000000, 0);

        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;

        container.appendChild(renderer.domElement);

        // -------------------------------------------
        // 4. MAIN SOLAR CORE
        // -------------------------------------------

        const solarGroup = new THREE.Group();
        scene.add(solarGroup);

        const sunGeometry = new THREE.SphereGeometry(
            1.65,
            isMobile ? 40 : 64,
            isMobile ? 40 : 64
        );

        const sunMaterial = new THREE.ShaderMaterial({

            uniforms: {
                uTime: { value: 0 },
                uSurge: { value: 0 }
            },

            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);

                    gl_Position = projectionMatrix *
                        modelViewMatrix *
                        vec4(position, 1.0);
                }
            `,

            fragmentShader: `
                uniform float uTime;
                uniform float uSurge;

                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {

                    float wave =
                        sin(vPosition.x * 7.0 + uTime * 1.2) *
                        cos(vPosition.y * 8.0 - uTime) *
                        sin(vPosition.z * 6.0 + uTime * 0.8);

                    float heat = smoothstep(-0.8, 0.8, wave);

                    vec3 darkGold = vec3(0.85, 0.22, 0.015);
                    vec3 orangeGold = vec3(1.0, 0.48, 0.025);
                    vec3 hotGold = vec3(1.0, 0.86, 0.42);

                    vec3 color = mix(
                        darkGold,
                        orangeGold,
                        heat
                    );

                    color = mix(
                        color,
                        hotGold,
                        smoothstep(0.25, 0.95, heat)
                    );

                    float fresnel = pow(
                        1.0 - abs(vNormal.z),
                        2.0
                    );

                    color += vec3(1.0, 0.62, 0.18) *
                        fresnel * (0.8 + uSurge);

                    gl_FragColor = vec4(
                        color * (1.15 + uSurge * 0.4),
                        1.0
                    );
                }
            `
        });

        const sun = new THREE.Mesh(
            sunGeometry,
            sunMaterial
        );

        solarGroup.add(sun);

        // -------------------------------------------
        // 5. OUTER GOLDEN CORONA
        // -------------------------------------------

        const corona = new THREE.Mesh(
            new THREE.SphereGeometry(
                1.95,
                isMobile ? 32 : 48,
                isMobile ? 32 : 48
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffa31a,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );

        solarGroup.add(corona);

        // -------------------------------------------
        // 6. ENERGY ORBIT RINGS
        // -------------------------------------------

        const ringGroup = new THREE.Group();
        solarGroup.add(ringGroup);

        function createRing(radius, color, opacity) {

            const geometry = new THREE.TorusGeometry(
                radius,
                0.018,
                8,
                isMobile ? 90 : 150
            );

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                blending: THREE.AdditiveBlending
            });

            return new THREE.Mesh(geometry, material);
        }

        const ring1 = createRing(2.35, 0xffbd42, 0.8);
        const ring2 = createRing(2.75, 0xff7900, 0.45);
        const ring3 = createRing(3.1, 0xffd47a, 0.25);

        ring1.rotation.x = 1.1;
        ring1.rotation.y = 0.25;

        ring2.rotation.x = 0.8;
        ring2.rotation.y = -0.5;

        ring3.rotation.x = 1.35;
        ring3.rotation.y = 0.65;

        ringGroup.add(ring1, ring2, ring3);

        // -------------------------------------------
        // 7. GOLDEN PARTICLE FIELD
        // -------------------------------------------

        const positions = new Float32Array(
            particleCount * 3
        );

        const particleSizes = new Float32Array(
            particleCount
        );

        const particleColors = new Float32Array(
            particleCount * 3
        );

        const particleSpeeds = new Float32Array(
            particleCount
        );

        for (let i = 0; i < particleCount; i++) {

            const radius = 3 + Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(
                2 * Math.random() - 1
            );

            positions[i * 3] =
                radius * Math.sin(phi) * Math.cos(theta);

            positions[i * 3 + 1] =
                radius * Math.cos(phi) * 0.75;

            positions[i * 3 + 2] =
                radius * Math.sin(phi) * Math.sin(theta);

            particleSizes[i] =
                0.5 + Math.random() * 1.5;

            particleSpeeds[i] =
                0.15 + Math.random() * 0.7;

            const gold = 0.65 + Math.random() * 0.35;

            particleColors[i * 3] = 1;
            particleColors[i * 3 + 1] = gold * 0.72;
            particleColors[i * 3 + 2] = gold * 0.25;
        }

        const particleGeometry = new THREE.BufferGeometry();

        particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        particleGeometry.setAttribute(
            "color",
            new THREE.BufferAttribute(particleColors, 3)
        );

        particleGeometry.setAttribute(
            "size",
            new THREE.BufferAttribute(particleSizes, 1)
        );

        const particleMaterial = new THREE.PointsMaterial({

            size: isMobile ? 0.055 : 0.075,

            vertexColors: true,

            transparent: true,

            opacity: 0.85,

            blending: THREE.AdditiveBlending,

            depthWrite: false,

            sizeAttenuation: true
        });

        const particles = new THREE.Points(
            particleGeometry,
            particleMaterial
        );

        scene.add(particles);

        // -------------------------------------------
        // 8. BACKGROUND LIGHT
        // -------------------------------------------

        const ambientLight = new THREE.AmbientLight(
            0xffb347,
            0.8
        );

        scene.add(ambientLight);

        const solarLight = new THREE.PointLight(
            0xffa500,
            2.5,
            30
        );

        solarLight.position.set(0, 0, 0);

        scene.add(solarLight);

        // -------------------------------------------
        // 9. INTERACTION
        // -------------------------------------------

        let mouseX = 0;
        let mouseY = 0;

        let targetRotationX = 0;
        let targetRotationY = 0;

        let surge = 0;

        window.addEventListener(
            "pointermove",
            (event) => {

                mouseX =
                    (event.clientX / window.innerWidth - 0.5) * 2;

                mouseY =
                    (event.clientY / window.innerHeight - 0.5) * 2;

                targetRotationY = mouseX * 0.18;
                targetRotationX = mouseY * 0.12;
            },
            { passive: true }
        );

        window.triggerSolarSurge = () => {
            surge = 1.0;
        };

        // -------------------------------------------
        // 10. RESIZE HANDLER
        // -------------------------------------------

        window.addEventListener("resize", () => {

            camera.aspect =
                window.innerWidth / window.innerHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );
        });

        // -------------------------------------------
        // 11. ANIMATION ENGINE
        // -------------------------------------------

        const clock = new THREE.Clock();

        let animationId = null;
        let isPageVisible = !document.hidden;

        function animate() {

            if (!isPageVisible) return;

            animationId = requestAnimationFrame(animate);

            const delta = Math.min(
                clock.getDelta(),
                0.04
            );

            const time = clock.elapsedTime;

            if (!reducedMotion) {

                sunMaterial.uniforms.uTime.value = time;

                surge = THREE.MathUtils.lerp(
                    surge,
                    0,
                    delta * 1.8
                );

                sunMaterial.uniforms.uSurge.value = surge;

                solarGroup.rotation.y += delta * 0.09;
                solarGroup.rotation.x = THREE.MathUtils.lerp(
                    solarGroup.rotation.x,
                    targetRotationX,
                    delta * 1.5
                );

                solarGroup.rotation.y = THREE.MathUtils.lerp(
                    solarGroup.rotation.y,
                    targetRotationY + time * 0.09,
                    delta * 0.7
                );

                ringGroup.rotation.z += delta * 0.08;

                particles.rotation.y += delta * 0.012;

                corona.material.opacity =
                    0.10 + Math.sin(time * 1.5) * 0.025;

            }

            renderer.render(scene, camera);
        }

        // -------------------------------------------
        // 12. PAUSE WHEN TAB IS NOT VISIBLE
        // -------------------------------------------

        document.addEventListener(
            "visibilitychange",
            () => {

                isPageVisible = !document.hidden;

                if (isPageVisible) {
                    clock.getDelta();
                    animate();
                } else {
                    cancelAnimationFrame(animationId);
                }
            }
        );

        animate();

        // -------------------------------------------
        // 13. CLEANUP ON PAGE EXIT
        // -------------------------------------------

        window.addEventListener("pagehide", () => {

            cancelAnimationFrame(animationId);

            particleGeometry.dispose();
            particleMaterial.dispose();

            sunGeometry.dispose();
            sunMaterial.dispose();

            renderer.dispose();
        });
    }
}
