/* KANIKA SHARMA — PORTFOLIO INTERACTIONS */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 3D TREE INTRO ---------- */
const intro = $("#treeIntro");
const shell = $("#siteShell");
const progress = $("#introProgress");
let introDone = false;
function enterPortfolio() {
  if (introDone) return;
  introDone = true;
  intro.classList.add("is-leaving");
  shell.classList.add("is-visible");
  window.setTimeout(() => { intro.hidden = true; }, 1100);
}
$("#enterPortfolio").addEventListener("click", enterPortfolio);
const introDuration = reducedMotion ? 900 : 7600;
const startedAt = performance.now();
function progressLoop(now) {
  const amount = Math.min(100, ((now - startedAt) / introDuration) * 100);
  progress.style.width = amount + "%";
  if (amount < 100 && !introDone) requestAnimationFrame(progressLoop);
  else if (!introDone) enterPortfolio();
}
requestAnimationFrame(progressLoop);

/* Load Three.js dynamically. If the CDN is unavailable, show a small visual fallback. */
async function createGrowingTree() {
  const canvas = $("#treeCanvas");
  const fallback = $("#treeFallback");
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c1c, 0.035);
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.8, 10.5);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    scene.add(new THREE.HemisphereLight(0xc8d9ff, 0x172034, 2.0));
    const key = new THREE.PointLight(0x9c83ff, 75, 18); key.position.set(3, 4, 4); scene.add(key);
    const rim = new THREE.PointLight(0x42dced, 65, 16); rim.position.set(-4, 1, -2); scene.add(rim);
    const tree = new THREE.Group(); scene.add(tree);
    const bark = new THREE.MeshStandardMaterial({ color: 0x8d6a55, roughness: .78 });
    const barkLight = new THREE.MeshStandardMaterial({ color: 0xb18a6c, roughness: .72 });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x5fc9a5, roughness: .65, emissive: 0x123d3b, emissiveIntensity: .22 }),
      new THREE.MeshStandardMaterial({ color: 0x8edbba, roughness: .7, emissive: 0x163b36, emissiveIntensity: .18 }),
      new THREE.MeshStandardMaterial({ color: 0x91a9f5, roughness: .6, emissive: 0x242e68, emissiveIntensity: .3 })
    ];
    const growParts = [];
    function branch(start, end, radius, material, delay=0) {
      const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
      const direction = new THREE.Vector3().subVectors(b,a);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius*.62, radius, direction.length(), 7), material);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize());
      mesh.scale.y = .001; tree.add(mesh); growParts.push({mesh, delay, kind:"branch"});
      return mesh;
    }
    function leafCluster(x,y,z,scale,delay,index) {
      const group = new THREE.Group(); group.position.set(x,y,z); tree.add(group);
      for (let i=0;i<9;i++) {
        const geo = new THREE.IcosahedronGeometry(scale*(.38+Math.random()*.42),1);
        const leaf = new THREE.Mesh(geo,leafMats[(index+i)%leafMats.length]);
        leaf.position.set((Math.random()-.5)*scale*1.4,(Math.random()-.5)*scale*1.15,(Math.random()-.5)*scale*1.1);
        group.add(leaf);
      }
      group.scale.setScalar(.001); growParts.push({mesh:group,delay,kind:"leaf"});
    }
    // Main trunk and spreading roots.
    branch([0,-2.35,0],[0,.75,0],.23,bark,0);
    branch([0,-2.28,0],[-.8,-2.62,.1],.13,barkLight,.05);
    branch([0,-2.28,0],[.85,-2.58,.08],.13,bark,.05);
    branch([0,-2.28,0],[-.25,-2.72,.65],.09,barkLight,.08);
    branch([0,-2.28,0],[.2,-2.68,-.62],.09,bark,.08);
    const limbs = [
      [[0,-.2,0],[-1.15,.75,.05],.13],[[0,.1,0],[1.12,1.05,.1],.13],
      [[0,.55,0],[-.65,1.55,-.05],.105],[[0,.65,0],[.55,1.85,-.1],.105],
      [[-.65,.38,.02],[-1.65,1.35,.12],.075],[[1,.75,.05],[1.72,1.65,.02],.075],
      [[-.95,.85,.05],[-1.95,1.55,-.12],.055],[[.85,1.15,-.08],[1.35,2.15,-.1],.06],
      [[-.35,1.2,0],[-.9,2.2,.1],.065],[[.35,1.45,0],[.15,2.55,.05],.06]
    ];
    limbs.forEach((p,i)=>branch(p[0],p[1],p[2],i%2?barkLight:bark,.16+i*.055));
    const crowns = [
      [-1.9,1.55,0,.68,.72],[-1.2,2.05,0,.72,.86],[-.55,2.25,0,.7,1.0],
      [.2,2.55,0,.75,1.08],[.95,2.15,0,.78,1.0],[1.65,1.9,0,.7,.9],
      [0,1.75,.55,.75,.95],[-.95,1.25,-.3,.65,.83],[.95,1.35,-.25,.7,.88]
    ];
    crowns.forEach((p,i)=>leafCluster(p[0],p[1],p[2],p[3],p[4],i));
    // Floating motes around the canopy.
    const moteCount = 115, motePositions = new Float32Array(moteCount*3);
    for(let i=0;i<moteCount;i++){
      const angle=Math.random()*Math.PI*2, radius=2.1+Math.random()*2.4;
      motePositions[i*3]=Math.cos(angle)*radius;
      motePositions[i*3+1]=Math.random()*5.8-1.3;
      motePositions[i*3+2]=Math.sin(angle)*radius*.55;
    }
    const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute("position",new THREE.BufferAttribute(motePositions,3));
    const moteMat = new THREE.PointsMaterial({color:0x8be9ed,size:.035,transparent:true,opacity:.8});
    const motes = new THREE.Points(moteGeo,moteMat); scene.add(motes);
    const groundRing = new THREE.Mesh(new THREE.TorusGeometry(2.1,.008,8,100),new THREE.MeshBasicMaterial({color:0x7f7af0,transparent:true,opacity:.45}));
    groundRing.rotation.x=Math.PI/2;groundRing.position.y=-2.42;tree.add(groundRing);

    const resize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)};
    window.addEventListener("resize",resize);
    const start=performance.now();
    function animate(now){
      const t=(now-start)/1000;
      const growth=Math.min(1,t/(reducedMotion?1.2:5.1));
      growParts.forEach(({mesh,delay,kind})=>{
        const local=Math.max(0,Math.min(1,(growth-delay)/(1-delay)));
        const eased=1-Math.pow(1-local,3);
        if(kind==="branch") mesh.scale.y=Math.max(.001,eased);
        else mesh.scale.setScalar(Math.max(.001,eased));
      });
      tree.rotation.y=Math.sin(t*.22)*.12;
      tree.position.y=Math.sin(t*.65)*.09;
      motes.rotation.y=t*.035;
      renderer.render(scene,camera);
      if(!introDone) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  } catch(error) {
    canvas.style.display="none";
    fallback.classList.add("show");
    console.warn("3D tree could not load; showing fallback artwork.",error);
  }
}
createGrowingTree();

/* ---------- PROJECT SHOWCASE ---------- */
const projects = [
  {name:"Clustering Analysis",description:"A data analysis project exploring clustering techniques and patterns in datasets.",tags:["Data analysis","Clustering"],url:"https://github.com/Kanika15133333/clustering-Analysis",art:"clusters"},
  {name:"Diabetes Analysis",description:"Exploring diabetes-related data to identify patterns and communicate useful insights.",tags:["Healthcare data","Analysis"],url:"https://github.com/Kanika15133333/Diabetes-Project",art:"diabetes"},
  {name:"House Price Prediction",description:"A machine-learning project focused on estimating house prices from available features.",tags:["Machine learning","Prediction"],url:"https://github.com/Kanika15133333/houseprice",art:"house"},
  {name:"Heart Disease Analysis",description:"A healthcare data analysis project exploring heart-disease-related indicators and patterns.",tags:["Healthcare data","Analysis"],url:"https://github.com/Kanika15133333/heart",art:"heart"},
  {name:"COVID-19 Data Analysis",description:"A data analysis project exploring COVID-19 data and visualising important trends.",tags:["Data analysis","Visualisation"],url:"https://github.com/Kanika15133333/Covid_19-analysis",art:"covid"}
];
function artMarkup(type){
 const common=`<svg viewBox="0 0 520 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#20264b"/><stop offset="1" stop-color="#0b1225"/></linearGradient><linearGradient id="line" x2="1"><stop stop-color="#b18aff"/><stop offset="1" stop-color="#4de3f2"/></linearGradient></defs><rect width="520" height="210" fill="url(#bg)"/>`;
 let drawing="";
 if(type==="clusters"){
   drawing=`<g opacity=".22" stroke="#aab4d6"><path d="M35 30V178H485" fill="none"/>${[65,105,145].map(y=>`<path d="M35 ${y}H485" stroke-dasharray="3 7"/>`).join("")}</g>`;
   const sets=[[100,85,"#9f83f4"],[250,125,"#4de3f2"],[390,70,"#f1a5d7"]];
   sets.forEach(([x,y,c],k)=>{for(let i=0;i<18;i++){let a=i*2.4+k,rx=25+(i%4)*7,ry=16+(i%3)*8;drawing+=`<circle cx="${x+Math.cos(a)*rx}" cy="${y+Math.sin(a)*ry}" r="${3+i%3}" fill="${c}" opacity=".85"/>`;}});
 } else if(type==="diabetes"){
   drawing=`<rect x="35" y="30" width="450" height="150" rx="12" fill="#101a31" stroke="#34405f"/><path d="M55 145 C95 135 100 88 145 100 S205 140 245 93 S315 65 350 90 S420 52 465 62" fill="none" stroke="url(#line)" stroke-width="4"/><path d="M55 145 C95 135 100 88 145 100 S205 140 245 93 S315 65 350 90 S420 52 465 62V165H55Z" fill="#6b9ce9" opacity=".12"/>${[0,1,2,3,4].map(i=>`<rect x="${75+i*82}" y="${47+(i%2)*14}" width="34" height="${20+i*8}" rx="5" fill="${i%2?'#4de3f2':'#a78bfa'}" opacity=".65"/>`).join("")}`;
 } else if(type==="house"){
   drawing=`<g stroke="#8f9bc0" opacity=".45"><path d="M50 168H470M50 130H470M50 92H470M50 54H470"/></g><path d="M70 150 L130 125 L190 135 L250 95 L310 105 L370 58 L445 40" fill="none" stroke="url(#line)" stroke-width="5" stroke-linecap="round"/>${[70,130,190,250,310,370,445].map((x,i)=>`<circle cx="${x}" cy="${[150,125,135,95,105,58,40][i]}" r="6" fill="#d6c7ff" stroke="#4de3f2" stroke-width="2"/>`).join("")}<path d="M340 160V115L385 82L430 115V160H340Z" fill="#8e82d8" opacity=".25" stroke="#b9a8ff" stroke-width="2"/><path d="M330 116L385 72L440 116" fill="none" stroke="#4de3f2" stroke-width="3"/>`;
 } else if(type==="heart"){
   drawing=`<path d="M260 157 C220 124 145 78 180 48 C207 25 245 43 260 69 C277 41 317 26 344 49 C381 81 302 133 260 157Z" fill="#ed7d9e" opacity=".85"/><path d="M65 112H155L180 85L210 143L245 65L270 118H455" fill="none" stroke="#4de3f2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="260" cy="110" r="82" fill="none" stroke="#c6a8ff" stroke-dasharray="4 9" opacity=".45"/>`;
 } else {
   drawing=`<circle cx="260" cy="105" r="67" fill="none" stroke="#4de3f2" stroke-width="2" opacity=".7"/><circle cx="260" cy="105" r="43" fill="none" stroke="#a78bfa" stroke-width="10" stroke-dasharray="80 190" transform="rotate(-80 260 105)"/><circle cx="260" cy="105" r="22" fill="#a78bfa" opacity=".18"/><path d="M260 38V15M260 195V172M193 105H170M350 105H327" stroke="#aab4d6" stroke-width="2" opacity=".6"/>${[0,1,2,3,4,5].map(i=>`<rect x="${65+i*67}" y="${165-(i*17%70)}" width="28" height="${i*17%70}" rx="4" fill="${i%2?'#4de3f2':'#a78bfa'}" opacity=".75"/>`).join("")}`;
 }
 return common+drawing+`<text x="30" y="195" fill="#9ba8c8" font-size="9" letter-spacing="3" font-family="Arial">PROJECT VISUAL / CONCEPT PREVIEW</text></svg>`;
}
let activeProject=0;
function renderProject(index,animate=true){
 activeProject=(index+projects.length)%projects.length;
 const p=projects[activeProject],card=$("#projectCard");
 if(animate) card.classList.add("switching");
 window.setTimeout(()=>{
  $("#projectName").textContent=p.name;$("#projectDescription").textContent=p.description;
  $("#projectIndex").innerHTML=`${String(activeProject+1).padStart(2,"0")} / 05 <span>FEATURED PROJECT</span>`;
  $("#projectTech").innerHTML=p.tags.map(t=>`<span>${t}</span>`).join("");
  $("#projectGithub").href=p.url;
  const art=artMarkup(p.art);$("#projectArt").innerHTML=art;$("#phoneArt").innerHTML=art;
  $("#phoneTitle").textContent=p.name;$("#phoneCount").textContent=`PROJECT ${String(activeProject+1).padStart(2,"0")} / 05`;
  $("#currentProjectNumber").textContent=String(activeProject+1).padStart(2,"0");
  $("#phoneDots").innerHTML=projects.map((_,i)=>`<i class="${i===activeProject?"active":""}"></i>`).join("");
  card.classList.remove("switching");
 },animate?220:0);
}
$("#prevProject").addEventListener("click",()=>renderProject(activeProject-1));
$("#nextProject").addEventListener("click",()=>renderProject(activeProject+1));
renderProject(0,false);

/* ---------- REVEAL ON SCROLL + SKILL BARS ---------- */
const observer=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("in-view");observer.unobserve(entry.target);}});
},{threshold:.14});
$$(".reveal,.skill-card").forEach(el=>observer.observe(el));

/* ---------- MOBILE NAV ---------- */
const menuToggle=$("#menuToggle"),navbar=$("#navbar");
menuToggle.addEventListener("click",()=>{
 const open=navbar.classList.toggle("open");
 menuToggle.setAttribute("aria-expanded",String(open));
 menuToggle.setAttribute("aria-label",open?"Close navigation":"Open navigation");
 menuToggle.textContent=open?"×":"☰";
});
navbar.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
 navbar.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");menuToggle.textContent="☰";
}));

/* Keyboard support for the project carousel. */
document.addEventListener("keydown",event=>{
 if(event.key==="ArrowRight" && introDone) renderProject(activeProject+1);
 if(event.key==="ArrowLeft" && introDone) renderProject(activeProject-1);
});
