import { VRButton } from "three/addons/webxr/VRButton.js";
import {
  SkyGeometry,
  TreesGeometry,
  RollerCoasterGeometry,
  RollerCoasterShadowGeometry,
  RollerCoasterLiftersGeometry,
} from "three/addons/misc/RollerCoaster.js";
import "./style.scss";
import {
  Mesh,
  Color,
  Scene,
  Vector3,
  Object3D,
  DoubleSide,
  WebGLRenderer,
  CylinderGeometry,
  HemisphereLight,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
} from "three";

let mesh, material, geometry;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType("local");
document.body.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

//

const scene = new Scene();
scene.background = new Color(0xf0f0ff);

const light = new HemisphereLight(0xfff0f0, 0x60606, 3);
light.position.set(1, 1, 1);
scene.add(light);

const train = new Object3D();
scene.add(train);

const camera = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
train.add(camera);

// environment

geometry = new PlaneGeometry(500, 500, 15, 15);
geometry.rotateX(-Math.PI / 2);

const positions = geometry.attributes.position.array;
const vertex = new Vector3();

for (let i = 0; i < positions.length; i += 3) {
  vertex.fromArray(positions, i);

  vertex.x += Math.random() * 10 - 5;
  vertex.z += Math.random() * 10 - 5;

  const distance = vertex.distanceTo(scene.position) / 5 - 25;
  vertex.y = Math.random() * Math.max(0, distance);

  vertex.toArray(positions, i);
}

geometry.computeVertexNormals();

material = new MeshLambertMaterial({
  color: 0x407333,
});

mesh = new Mesh(geometry, material);
scene.add(mesh);

geometry = new TreesGeometry(mesh);
material = new MeshBasicMaterial({
  side: DoubleSide,
  vertexColors: true,
});
mesh = new Mesh(geometry, material);
scene.add(mesh);

geometry = new SkyGeometry();
material = new MeshBasicMaterial({ color: 0xffffff });
mesh = new Mesh(geometry, material);
scene.add(mesh);

//

const PI2 = Math.PI * 2;

const curve = (function () {
  const vector = new Vector3();
  const vector2 = new Vector3();

  return {
    getPointAt: function (t: number) {
      t = t * PI2;

      const x = Math.sin(t * 3) * Math.cos(t * 4) * 50;
      const y = Math.sin(t * 10) * 2 + Math.cos(t * 17) * 2 + 5;
      const z = Math.sin(t) * Math.sin(t * 4) * 50;

      return vector.set(x, y, z).multiplyScalar(2);
    },

    getTangentAt: function (t: number) {
      const delta = 0.0001;
      const t1 = Math.max(0, t - delta);
      const t2 = Math.min(1, t + delta);

      return vector2
        .copy(this.getPointAt(t2))
        .sub(this.getPointAt(t1))
        .normalize();
    },
  };
})();

geometry = new RollerCoasterGeometry(curve, 1500);
material = new MeshPhongMaterial({
  vertexColors: true,
});
mesh = new Mesh(geometry, material);
scene.add(mesh);

geometry = new RollerCoasterLiftersGeometry(curve, 100);
material = new MeshPhongMaterial();
mesh = new Mesh(geometry, material);
mesh.position.y = 0.1;
scene.add(mesh);

geometry = new RollerCoasterShadowGeometry(curve, 500);
material = new MeshBasicMaterial({
  color: 0x305000,
  depthWrite: false,
  transparent: true,
});
mesh = new Mesh(geometry, material);
mesh.position.y = 0.1;
scene.add(mesh);

const funfairs: Mesh[] = [];

//

geometry = new CylinderGeometry(10, 10, 5, 15);
material = new MeshLambertMaterial({
  color: 0x118484,
});
mesh = new Mesh(geometry, material);
mesh.position.set(-80, 10, -70);
mesh.rotation.x = Math.PI / 2;
scene.add(mesh);

funfairs.push(mesh);

geometry = new CylinderGeometry(5, 6, 4, 10);
material = new MeshLambertMaterial({
  color: 0x808011,
});
mesh = new Mesh(geometry, material);
mesh.position.set(50, 2, 30);
scene.add(mesh);

funfairs.push(mesh);

//

addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
}

//

const position = new Vector3();
const tangent = new Vector3();

const lookAt = new Vector3();

let velocity = 0;
let progress = 0;

let prevTime = performance.now();

function render() {
  const time = performance.now();
  const delta = time - prevTime;

  for (let i = 0; i < funfairs.length; i++) {
    funfairs[i].rotation.y = time * 0.0004;
  }

  //

  progress += velocity;
  progress = progress % 1;

  position.copy(curve.getPointAt(progress));
  position.y += 0.3;

  train.position.copy(position);

  tangent.copy(curve.getTangentAt(progress));

  velocity -= tangent.y * 0.000001 * delta;
  velocity = Math.max(0.00010, Math.min(0.00100, velocity));

  train.lookAt(lookAt.copy(position).sub(tangent));

  //

  renderer.render(scene, camera);

  prevTime = time;
}

renderer.setAnimationLoop(render);
