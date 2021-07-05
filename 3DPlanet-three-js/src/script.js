import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { Vector3 } from 'three'
import { randFloat } from 'three/src/math/mathutils'
import gsap from 'gsap'

/*****Shader*****/
//--Vertex--//
const vertex = `varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() {
    vertexUV = uv;
    vertexNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

//--Fragment--//
const fragment = `uniform sampler2D globeTexture;

varying vec2 vertexUV;
varying vec3 vertexNormal;


void main() {
    float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0));
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

    gl_FragColor = vec4( atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0);
}`

//--AtmoWorldVertex--/
const atmoWorldVertex = `varying vec3 vertexNormal;

void main() {
    vertexNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

//--AtmoWorldFragment--//
const atmoWorldFragment = `varying vec3 vertexNormal;
void main() {
    float intensity = pow(0.6 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}`

//--AtmoMoonFragment--//
const atmoMoonFragment = `varying vec3 vertexNormal;
void main() {
    float intensity = pow(0.6 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity;
}`

//--AtmoSunFragment--//
const atmoSunFragment = `varying vec3 vertexNormal;
void main() {
    float intensity = pow(0.6 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
    gl_FragColor = vec4(1.0, 0, 0, 1.0) * intensity;
}`

//--Debug--//
// const gui = new dat.GUI()

//--Canvas--//
const canvas = document.querySelector('canvas.webgl')

//--Scene--//
const scene = new THREE.Scene()

//--Texture Loader--//
const loader = new THREE.TextureLoader();
const cross = loader.load('./cross.png');
const moonTexture = loader.load('moon.jpg');
const normalTexture = loader.load('normal.jpg');
const sunTexture = loader.load('./sun.jpg');

/*****Objects*****/
//--Sfera--//
const geometry = new THREE.SphereBufferGeometry( 5, 50, 50 );

//--Stelle--//
const particlesGeometry = new THREE.BufferGeometry;
const particlesCnt = 5000;
const posArray = new Float32Array(particlesCnt * 3);

for(let i = 0; i < particlesCnt * 300; i++){
    posArray[i] = (Math.random() - .5) * (Math.random() * 500)
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))

/*****Materials*****/
//--World--//
const worldMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
        globeTexture: {
            value: new THREE.TextureLoader().load('/earthMap.jpg')
        }
    }
})

//--Atmosfera World--//
const atmoWorldMaterial = new THREE.ShaderMaterial({
    vertexShader: atmoWorldVertex,
    fragmentShader: atmoWorldFragment,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
})

//--Moon--//
const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture
})

//--Atmosfera Moon--//
const atmoMoonMaterial = new THREE.ShaderMaterial({
    vertexShader: atmoWorldVertex,
    fragmentShader: atmoMoonFragment,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
})

//--Sun--//
const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    normalMap: normalTexture
})

//--Atmosfera Sun--//
const atmoSunMaterial = new THREE.ShaderMaterial({
    vertexShader: atmoWorldVertex,
    fragmentShader: atmoSunFragment,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
})

//--Stelle--//
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.5,
    map: cross,
    transparent: true,
})

/*****Mesh*****/
const scalePreset = 1.25

//--World--//
const sphereWorld = new THREE.Mesh(geometry,worldMaterial)

//--Atmosfera World--//
const atmosphereWorld = new THREE.Mesh(geometry,atmoWorldMaterial)
atmosphereWorld.position.y = sphereWorld.position.y
atmosphereWorld.scale.set(scalePreset, scalePreset, scalePreset)

//--Moon--//
const sphereMoon = new THREE.Mesh(geometry,moonMaterial)
sphereMoon.translateY(-25)

//--Atmosfera Moon--//
const atmosphereMoon = new THREE.Mesh(geometry,atmoMoonMaterial)
atmosphereMoon.position.y = sphereMoon.position.y
atmosphereMoon.scale.set(scalePreset, scalePreset, scalePreset)

//--Sun--//
const sphereSun = new THREE.Mesh(geometry,sunMaterial)
sphereSun.translateY(-50)

//--Atmosfera Sun--//
const atmosphereSun = new THREE.Mesh(geometry,atmoSunMaterial)
atmosphereSun.position.y = sphereSun.position.y
atmosphereSun.scale.set(scalePreset, scalePreset, scalePreset)

//--Stelle--//
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);

//--Group--//
const group = new THREE.Group()
group.add(sphereWorld)

//--Add All In Scene--//
scene.add(sphereWorld, atmosphereWorld, particlesMesh, group, sphereMoon, atmosphereMoon, sphereSun, atmosphereSun)

/*****Lights*****/
const ambientLight = new THREE.AmbientLight(0xffffff);

scene.add(ambientLight)

/*****Sizes*****/
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

/*****Camera*****/
//--Base camera--//
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 18
scene.add(camera)

//--Controls--//
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/*****Renderer*****/
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/*****Animate*****/
//--Scroll Animation--//
// const moltiplicatoreScroll = 0.062
// const windowScroll = (event) => {
//     sphereWorld.position.x = window.scrollY * moltiplicatoreScroll
//     atmosphereWorld.position.x = window.scrollY * moltiplicatoreScroll
//     sphereMoon.position.x = window.scrollY * moltiplicatoreScroll -54
//     atmosphereMoon.position.x = window.scrollY * moltiplicatoreScroll -54
//     sphereSun.position.y = window.scrollY * moltiplicatoreScroll -105
//     atmosphereSun.position.y = window.scrollY * moltiplicatoreScroll -105
//     particlesMesh.rotation.z = window.scrollY * moltiplicatoreScroll
// }

function updatePosition(){
    atmosphereWorld.position.y = sphereWorld.position.y
    atmosphereMoon.position.y = sphereMoon.position.y
    atmosphereSun.position.y = sphereSun.position.y
}

let speed = 0;
let position = 0;
let rounded = 0;
window.addEventListener('wheel', (e) => {
    speed += e.deltaY*0.0002; 
})

let meshes = [sphereWorld, sphereMoon, sphereSun]
let objs = Array(3).fill({meshes})

function raf(){
    position += speed;
    speed *= 0.8;
    objs.forEach((o, i) => {
        o.dist = Math.min(Math.abs(position - i), 1);
        o.dist = 1 - o.dist**2;
        let scale = 1 + 0.1*o.dist;
        meshes[i].position.y = - (i*30 - position*30);
        meshes[i].scale.set(scale, scale, scale);
    })

    rounded = Math.round(position);

    let diff = (rounded - position);

    position += Math.sign(diff)*Math.pow(Math.abs(diff), 0.7) * 0.035;
    updatePosition();
    window.requestAnimationFrame(raf);
}

// if (sunPosition == center) {
//     scro
// }
raf()

// window.addEventListener('scroll', windowScroll);

//--Earth Rotation--//
const mouse = {
    x: undefined,
    y: undefined
}

var tl = gsap.timeline({defaults:{duration: 1}});

const worldPosition = new THREE.Vector3();
const moonPosition = new THREE.Vector3();
const sunPosition = new THREE.Vector3();

const center = new Vector3(0, 0, 0);

function textVisualization(){
    const soonStyle = document.getElementsByClassName("soon");

    sphereWorld.getWorldPosition(worldPosition);
    var worldDist = worldPosition.distanceTo(center);
    const worldStyle = document.getElementsByClassName("world");
    const worldInfoStyle = document.getElementsByClassName("worldInfo");
    if (worldDist >= 0 && worldDist <= 15){
        worldStyle[0].style.visibility = "visible";
        worldInfoStyle[0].style.visibility = "visible";
        soonStyle[0].style.visibility = "hidden";
    }else{
        worldStyle[0].style.visibility = "hidden";
        worldInfoStyle[0].style.visibility = "hidden";
        soonStyle[0].style.visibility = "visible";
    }

    sphereMoon.getWorldPosition(moonPosition);
    var moonDist = moonPosition.distanceTo(center);
    const moonStyle = document.getElementsByClassName("moon");
    const moonInfoStyle = document.getElementsByClassName("moonInfo");
    if (moonDist >= 0 && moonDist <= 15){
        moonStyle[0].style.visibility = "visible";
        moonInfoStyle[0].style.visibility = "visible";
    }else{
        moonStyle[0].style.visibility = "hidden";
        moonInfoStyle[0].style.visibility = "hidden";
    }

    sphereSun.getWorldPosition(sunPosition);
    var sunDist = sunPosition.distanceTo(center);
    const sunStyle = document.getElementsByClassName("sun");
    const sunInfoStyle = document.getElementsByClassName("sunInfo");
    if (sunDist >= 0 && sunDist <= 15){
        sunStyle[0].style.visibility = "visible";
        sunInfoStyle[0].style.visibility = "visible";
    }else{
        sunStyle[0].style.visibility = "hidden";
        sunInfoStyle[0].style.visibility = "hidden";
    }

    if (worldDist >= 0 && worldDist <= 15 || moonDist >= 0 && moonDist <= 15 || sunDist >= 0 && sunDist <= 15){
        soonStyle[0].style.visibility = "hidden";
    }else{
        soonStyle[0].style.visibility = "visible";
    }
}

//--Clock--//
const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    //--Update objects--//
    sphereWorld.rotation.y = .1 * elapsedTime
    group.rotation.y = mouse.x
    sphereMoon.rotation.y = .1 * elapsedTime
    sphereSun.rotation.y = .1 * elapsedTime
    particlesMesh.rotation.y = -0.05 * elapsedTime

    textVisualization();
    
    //--Update Orbital Controls--//
    // controls.update()

    //--Render--//
    renderer.render(scene, camera)

    //--Call tick again on the next frame--//
    window.requestAnimationFrame(tick)
}

tick()