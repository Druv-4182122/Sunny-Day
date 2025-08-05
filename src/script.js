import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import {Pane} from 'tweakpane'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import coffeeSmokeVertexShader from './smokey/coffeeSmoke/vertex.glsl'
import coffeeSmokeFragmentShader from './smokey/coffeeSmoke/fragment.glsl'
import { label, min } from 'three/tsl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Sky } from 'three/addons/objects/Sky.js'

/**
 * Base
 */
// Debug
// const gui = new GUI({ width: 340 })
const pane = new Pane({title:'GUI Manipulation', expanded:false})
const ssky = pane.addFolder({ title: 'Sky', expanded: false });
const Grass = pane.addFolder({ title: 'Grass', expanded: false });
const cameraFolder = pane.addFolder({ title: 'Camera', expanded: false });
const coffeeSmokey = pane.addFolder({ title: 'Coffee Smoke', expanded: false });
const Tweakpane = {
    directionallightIntensity: 0,
    directionallight2Intensity: 4.5,
    directionalLightColor: '#86cdff',
    turbidity: 15,         
    rayleigh: 0.2,        
    mieCoefficient: 0.08,   
    mieDirectionalG: 0.99,   
    fogdensity:0.05,
    uTwistStrength: 10.0,
    uWindStrength: 10.0,
    uTwistSpeed: 0.005,
    uWindSpeed: 0.01,
    enableOrbitControls: true
}
Tweakpane.ambientlightintensity = 0.5
Tweakpane.ambientlightcolor = '#ffffff'
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
const sky = new Sky()
sky.scale.setScalar(100)
scene.add(sky)
const sun = new THREE.Vector3();
sky.material.uniforms['turbidity'].value = 20
sky.material.uniforms['rayleigh'].value = 0.70
sky.material.uniforms['mieCoefficient'].value = 0.035
sky.material.uniforms['mieDirectionalG'].value = 0.371
const inclination = 0.49; // Sun elevation (0 = horizon, 0.5 = zenith)
const azimuth = 0.25;     // Sun angle around Y axis (0 = north)

const theta = Math.PI * inclination;
const phi = 2 * Math.PI * azimuth;

sun.setFromSphericalCoords(1, theta, phi);
sky.material.uniforms['sunPosition'].value.copy(sun);
// sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95)

const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64)
smokeGeometry.translate(0, 0.5, 0)
smokeGeometry.scale(1.5, 6, 1.5)

// Perlin texture
const textureLoader = new THREE.TextureLoader()
const perlinTexture = textureLoader.load('./img/perlin.png')
perlinTexture.wrapS = THREE.RepeatWrapping
perlinTexture.wrapT = THREE.RepeatWrapping

// Material
const smokeMaterial = new THREE.ShaderMaterial({
    vertexShader: coffeeSmokeVertexShader,
    fragmentShader: coffeeSmokeFragmentShader,
    uniforms:
    {
        uTime: new THREE.Uniform(0),
        uTwistStrength: {value: 10.0},
        uWindStrength: {value: 10.0},
        uTwistSpeed: {value: 0.005},
        uWindSpeed: {value: 0.01},
        uPerlinTexture: new THREE.Uniform(perlinTexture)
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
    // wireframe: true
})

// Mesh
const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
// smoke.position.y = 1.83
smoke.position.x = -0.45
smoke.position.z = 0.038
smoke.position.y = 0.147
smoke.scale.setScalar(0.02)
scene.add(smoke)

// const axisHelper = new THREE.AxesHelper(5);
// scene.add(axisHelper)

const ambientLight = new THREE.AmbientLight(Tweakpane.ambientlightcolor, Tweakpane.ambientlightintensity)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(Tweakpane.directionalLightColor, Tweakpane.directionallightIntensity)
directionalLight.position.z = 1.32
directionalLight.position.x = -0.5
directionalLight.position.y = 0.75
scene.add(directionalLight)

// directionalLight.castShadow = true;

const lightTarget = new THREE.Object3D();
lightTarget.position.set(-0.45, 0.15, 0.038); // near the top of the cup
scene.add(lightTarget);

directionalLight.target = lightTarget;
scene.add(directionalLight.target);


// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.5)
// scene.add(directionalLightHelper)

directionalLight.shadow.mapSize.width = 1024; // Increase shadow map resolution
directionalLight.shadow.mapSize.height = 1024;

const d = 1.5; // Size of the shadow camera's frustum
directionalLight.shadow.camera.left = -d /2;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d /2;
directionalLight.shadow.camera.bottom = -d/2;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 2.5;

// Optional: Helper to visualize the shadow camera frustum
// const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(shadowHelper);

const directionalLight2 = new THREE.DirectionalLight(Tweakpane.directionalLightColor, Tweakpane.directionallight2Intensity);
directionalLight2.position.set(0.5, 0.8, 0.185); // From the left side (mirror of the first light)


// Reuse the same target or create a new one if needed
directionalLight2.target = lightTarget;
scene.add(directionalLight2);
scene.add(directionalLight2.target);
directionalLight2.castShadow = true;

// const directionalLightHelper2 = new THREE.DirectionalLightHelper(directionalLight2, 0.5)
// scene.add(directionalLightHelper2)

directionalLight2.shadow.mapSize.width = 2048; // Increase shadow map resolution
directionalLight2.shadow.mapSize.height = 2048;

const e = 1.5; // Size of the shadow camera's frustum
directionalLight2.shadow.camera.left = -e /2;
directionalLight2.shadow.camera.right = e/2;
directionalLight2.shadow.camera.top = e /2;
directionalLight2.shadow.camera.bottom = -e/4;
directionalLight2.shadow.camera.near = 1;
directionalLight2.shadow.camera.far = 2;

// const shadowHelper = new THREE.CameraHelper(directionalLight2.shadow.camera);
// scene.add(shadowHelper);
/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512)

// Colors
Tweakpane.depthColor = '#000000'
Tweakpane.surfaceColor = '#599e33'



// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },
        
        uBigWavesElevation: { value: 0.017 },
        uBigWavesFrequency: { value: new THREE.Vector2(1.875, 0) },
        uBigWavesSpeed: { value: 0.75 },

        uSmallWavesElevation: { value: 0.073 },
        uSmallWavesFrequency: { value: 30 },
        uSmallWavesSpeed: { value: 0.101 },
        uSmallIterations: { value: 5 },

        uDepthColor: { value: new THREE.Color(Tweakpane.depthColor) },
        uSurfaceColor: { value: new THREE.Color(Tweakpane.surfaceColor) },
        uColorOffset: { value: 0.073 },
        uColorMultiplier: { value: 8.042 }
    }
})


// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
water.receiveShadow = true; 
scene.add(water)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer  
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


//gltf

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

gltfLoader.load(
    '/models/outdoor_table_chair_set_01_1k.gltf',
    (gltf) =>
    {
        const model  = gltf.scene
        model.rotation.y = Math.PI * 3
        model.position.x = -0.5
        model.position.y = -0.1
        model.scale.setScalar(0.30)
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model)
    }
)
// const fbxLoader = new FBXLoader();

gltfLoader.load(
    '/models/new/testingss/mugwithsaucer03_v3.1_Cycles.gltf',
    (gltf) =>
    {
        const model  = gltf.scene
        console.log(model)
        // // model.rotation.y = Math.PI * 0.5
        model.position.x = -0.45
        model.position.z = 0.038
        model.position.y = 0.116
        model.scale.setScalar(0.511)
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });
        scene.add(model)
    }
)




/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
// camera.position.set(-0.654, 0.203, 0.243)
// camera.rotation.set(-0.690, -1.145, -0.645)
camera.position.set(-0.655, 0.241, 0.201)
camera.rotation.set(-0.876, -1.124, -0.824)

scene.add(camera)

// Assuming your camera is named 'camera'
// and your Tweakpane instance is named 'pane'

// 1. Create a folder for the camera controls


const cameraConfig = {
    positionX: camera.position.x,
    positionY: camera.position.y,
    positionZ: camera.position.z,
    rotationX: camera.rotation.x,
    rotationY: camera.rotation.y,
    rotationZ: camera.rotation.z,
};

cameraFolder.addBinding(cameraConfig, 'positionX', {
    min: -10,
    max: 10,
    step: 0.001,
    label: 'Position X',
}).on('change', () => {
    camera.position.x = cameraConfig.positionX;
});

cameraFolder.addBinding(cameraConfig, 'positionY', {
    min: -10,
    max: 10,
    step: 0.001,
    label: 'Position Y',
}).on('change', () => {
    camera.position.y = cameraConfig.positionY;
});

cameraFolder.addBinding(cameraConfig, 'positionZ', {
    min: -10,
    max: 10,
    step: 0.001,
    label: 'Position Z',
}).on('change', () => {
    camera.position.z = cameraConfig.positionZ;
});

cameraFolder.addBinding(Tweakpane, 'enableOrbitControls', {
    label: 'To Tweak Camera Rotation disable Orbit Controls',
}).on('change', () => {
    controls.enabled = Tweakpane.enableOrbitControls;
});

cameraFolder.addBinding(cameraConfig, 'rotationX', {
    min: -Math.PI,
    max: Math.PI,
    step: 0.001,
    label: 'Rotation X',
}).on('change', () => {
    camera.rotation.x = cameraConfig.rotationX;
});

cameraFolder.addBinding(cameraConfig, 'rotationY', {
    min: -Math.PI,
    max: Math.PI,
    step: 0.001,
    label: 'Rotation Y',
}).on('change', () => {
    camera.rotation.y = cameraConfig.rotationY;
});

cameraFolder.addBinding(cameraConfig, 'rotationZ', {
    min: -Math.PI,
    max: Math.PI,
    step: 0.001,
    label: 'Rotation Z',
}).on('change', () => {
    camera.rotation.z = cameraConfig.rotationZ;
});

cameraFolder.addButton({ title: 'Reset' }).on('click', () => {
    // Default values for Camera controls
    cameraConfig.positionX = -0.655;
    cameraConfig.positionY = 0.241;
    cameraConfig.positionZ = 0.201;
    cameraConfig.rotationX = -0.876;
    cameraConfig.rotationY = -1.124;
    cameraConfig.rotationZ = -0.824;

    camera.position.set(cameraConfig.positionX, cameraConfig.positionY, cameraConfig.positionZ);
    camera.rotation.set(cameraConfig.rotationX, cameraConfig.rotationY, cameraConfig.rotationZ);

    pane.refresh();
});

const updateCameraConfig = () => {
    cameraConfig.positionX = camera.position.x;
    cameraConfig.positionY = camera.position.y;
    cameraConfig.positionZ = camera.position.z;
    cameraConfig.rotationX = camera.rotation.x;
    cameraConfig.rotationY = camera.rotation.y;
    cameraConfig.rotationZ = camera.rotation.z;
    pane.refresh(); // Refresh Tweakpane to reflect updated values
};

// 2. Add controls for the camera's position
// cameraFolder.addBinding(camera.position, 'x', {
//     min: -10,
//     max: 10,
//     step: 0.001,
//     label: 'Position X',
// });
// cameraFolder.addBinding(camera.position, 'y', {
//     min: -10,
//     max: 10,
//     step: 0.001,
//     label: 'Position Y',
// });
// cameraFolder.addBinding(camera.position, 'z', {
//     min: -10,
//     max: 10,
//     step: 0.001,
//     label: 'Position Z',
// });


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//Tweakpane

// gui.addColor(debugObject, 'depthColor').onChange(() => { waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor) })
Grass.addBinding(Tweakpane, 'depthColor', {
    view: 'color',
    label: 'Depth Color',
    color: { alpha: false }
}).on('change',() => { 
    waterMaterial.uniforms.uDepthColor.value.set(Tweakpane.depthColor) 
})

// gui.addColor(debugObject, 'surfaceColor').onChange(() => { waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor) })
Grass.addBinding(Tweakpane, 'surfaceColor', {
    view: 'color',
    label: 'Surface Color',
    color: { alpha: false }
}).on('change',() => { 
    waterMaterial.uniforms.uSurfaceColor.value.set(Tweakpane.surfaceColor) 
})

// gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
Grass.addBinding(waterMaterial.uniforms.uBigWavesElevation, 'value',{
    min: 0,
    max: 1,
    step: 0.001,
    label: 'Big Waves Elevation'
})

// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
// gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
Grass.addBinding(waterMaterial.uniforms.uBigWavesFrequency, 'value',{
    min: 0,
    max: 10,
    step: 0.001,
    label: 'Big Waves Frequency'
})

// gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed')
Grass.addBinding(waterMaterial.uniforms.uBigWavesSpeed, 'value',{
    min: 0,
    max: 4,
    step: 0.001,
    label: 'Big Waves Speed'
})

// gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
Grass.addBinding(waterMaterial.uniforms.uSmallWavesElevation, 'value',{
    min: 0,
    max: 1,
    step: 0.001,
    label: 'Small Waves Elevation'
})

// gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
Grass.addBinding(waterMaterial.uniforms.uSmallWavesFrequency, 'value',{
    min: 0,
    max: 30,
    step: 0.001,
    label: 'Small Waves Frequency'
})

// gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
Grass.addBinding(waterMaterial.uniforms.uSmallWavesSpeed, 'value',{
    min: 0,
    max: 4,
    step: 0.001,
    label: 'Small Waves Speed'
})

// gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations')
Grass.addBinding(waterMaterial.uniforms.uSmallIterations, 'value',{
    min: 0,
    max: 5,
    step: 1,
    label: 'Small Waves Iterations'
})

// gui.add(waterMaterial.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset')
Grass.addBinding(waterMaterial.uniforms.uColorOffset, 'value',{
    min: 0,
    max: 1,
    step: 0.001,
    label: 'Color Offset'
})

// gui.add(waterMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier')
Grass.addBinding(waterMaterial.uniforms.uColorMultiplier, 'value',{
    min: 0,
    max: 10,
    step: 0.001,
    label: 'Color Multiplier'
})

Grass.addButton({ title: 'Reset' }).on('click', () => {
    // Default values for Grass controls
    Tweakpane.depthColor = '#000000';
    Tweakpane.surfaceColor = '#599e33';
    waterMaterial.uniforms.uBigWavesElevation.value = 0.017;
    waterMaterial.uniforms.uBigWavesFrequency.value.set(1.875, 0);
    waterMaterial.uniforms.uBigWavesSpeed.value = 0.75;
    waterMaterial.uniforms.uSmallWavesElevation.value = 0.073;
    waterMaterial.uniforms.uSmallWavesFrequency.value = 30;
    waterMaterial.uniforms.uSmallWavesSpeed.value = 0.101;
    waterMaterial.uniforms.uSmallIterations.value = 5;
    waterMaterial.uniforms.uDepthColor.value.set(Tweakpane.depthColor);
    waterMaterial.uniforms.uSurfaceColor.value.set(Tweakpane.surfaceColor);
    waterMaterial.uniforms.uColorOffset.value = 0.073;
    waterMaterial.uniforms.uColorMultiplier.value = 8.042;

    // Refresh Tweakpane UI
    pane.refresh();
});

// Grass.addBinding(Tweakpane, 'ambientlightintensity', {
//     min: -5,
//     max: 5,
//     step: 0.1,
//     label: 'Ambient Light Intensity'
// }).on('change', () => {
//     ambientLight.intensity = Tweakpane.ambientlightintensity
// })


ssky.addBinding(Tweakpane, 'turbidity', {
    label: 'Sky Turbidity',
    min: 0,
    max: 20,
    step: 0.1
}).on('change', () => {
    sky.material.uniforms['turbidity'].value = Tweakpane.turbidity;
});

ssky.addBinding(Tweakpane, 'rayleigh', {
    label: 'Sky Rayleigh',
    min: 0,
    max: 20,
    step: 0.01
}).on('change', () => {
    sky.material.uniforms['rayleigh'].value = Tweakpane.rayleigh;
});

ssky.addBinding(Tweakpane, 'mieCoefficient', {
    label: 'Sky Mie Coefficient',
    min: 0,
    max: 1,
    step: 0.001
}).on('change', () => {
    sky.material.uniforms['mieCoefficient'].value = Tweakpane.mieCoefficient;
});

ssky.addBinding(Tweakpane, 'mieDirectionalG', {
    label: 'Sky Mie Directional G',
    min: 0,
    max: 1,
    step: 0.001
}).on('change', () => {
    sky.material.uniforms['mieDirectionalG'].value = Tweakpane.mieDirectionalG;
});


coffeeSmokey.addBinding(Tweakpane, 'uTwistStrength', {
    min: 0,
    max: 20,
    step: 0.1,
    label: 'Twist Strength'
}).on('change', () => {
    smokeMaterial.uniforms.uTwistStrength.value = Tweakpane.uTwistStrength;
});

coffeeSmokey.addBinding(Tweakpane, 'uWindStrength', {
    min: 0,
    max: 20,
    step: 0.1,
    label: 'Wind Strength'
}).on('change', () => {
    smokeMaterial.uniforms.uWindStrength.value = Tweakpane.uWindStrength;
});

coffeeSmokey.addBinding(Tweakpane, 'uTwistSpeed', {
    min: 0,
    max: 1,
    step: 0.001,
    label: 'Twist Speed'
}).on('change', () => {
    smokeMaterial.uniforms.uTwistSpeed.value = Tweakpane.uTwistSpeed;
});

coffeeSmokey.addBinding(Tweakpane, 'uWindSpeed', {
    min: 0,
    max: 1,
    step: 0.001,
    label: 'Wind Speed'
}).on('change', () => {
    smokeMaterial.uniforms.uWindSpeed.value = Tweakpane.uWindSpeed;
});

coffeeSmokey.addButton({ title: 'Reset' }).on('click', () => {
    // Default values
    Tweakpane.uTwistStrength = 10.0;
    Tweakpane.uWindStrength = 10.0;
    Tweakpane.uTwistSpeed = 0.005;
    Tweakpane.uWindSpeed = 0.01;

    // Update uniforms
    smokeMaterial.uniforms.uTwistStrength.value = Tweakpane.uTwistStrength;
    smokeMaterial.uniforms.uWindStrength.value = Tweakpane.uWindStrength;
    smokeMaterial.uniforms.uTwistSpeed.value = Tweakpane.uTwistSpeed;
    smokeMaterial.uniforms.uWindSpeed.value = Tweakpane.uWindSpeed;

    // Refresh Tweakpane UI
    pane.refresh();
});

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime
    smokeMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    if (Tweakpane.enableOrbitControls) {
        controls.update();
    }
    
    updateCameraConfig();

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()