// The same world-space light choreography on both sides of the 22 -> 23 cut.
// Absolute seconds since the breach; all geometry is built once and every seek is independent.
export const threatGLSL = `
vec3 archiveExposure(vec3 p, float t, vec3 base) {
  float exposureGain = smoothstep(1.8, 5.5, t) * (1. - smoothstep(11.7, 12.9, t));
  float longitude = atan(p.x, p.z);
  float scan = abs(sin(longitude * 1.5 - t * .68 + p.y * .035));
  float edge = exp(-scan * scan * 95.);
  float ripple = pow(.5 + .5 * sin(p.y * 4. + longitude * 11. - t * 4.), 12.);
  vec3 hot = mix(vec3(.14,.77,.94), vec3(.65,.28,.98), .5 + .5 * sin(p.y * .24 + t));
  vec3 exposed = mix(base, vec3(1.,.24,.035), exposureGain * (.70 + .22 * ripple));
  return mix(exposed, hot * 1.2, exposureGain * edge);
}
vec3 archivePosition(vec3 p, float t) {
  float seed = fract(sin(dot(floor(p * 3.), vec3(12.9898,78.233,37.719))) * 43758.5453);
  float wake = smoothstep(5.6,7.8,t) * (1. - smoothstep(11.7,12.9,t));
  float longitude = atan(p.x,p.z);
  float scan = sin(longitude * 1.5 - t * .68 + p.y * .035);
  float edge = exp(-scan * scan * 100.);
  vec3 q = p * (1. + .028 * wake * edge);
  float selected = step(.91,seed) * step(0.,p.z);
  float travel = clamp((t - 7.15 - seed * 1.4) / 2.7,0.,1.) * selected;
  vec3 bend = p * 1.32 + vec3(0.,0.,3.);
  return (1.-travel)*(1.-travel)*q + 2.*travel*(1.-travel)*bend + travel*travel*vec3(7.7,-.7,15.5);
}`;

export function createArchiveThreat(THREE, scene) {
  const group = new THREE.Group(); scene.add(group);
  const clock = {value: 0}, gain = {value: 0};
  const ringUniforms = {uTime: clock, uGain: gain};
  const ringVertex = `attribute float aU; uniform float uTime,uGain;
    varying vec3 vColor; varying float vAlpha;
    void main(){vColor=mix(vec3(.15,.8,1.),vec3(.72,.25,1.),aU);vColor=mix(vColor,vec3(1.),pow(aU,10.));
    vAlpha=uGain*pow(max(0.,sin(aU*3.14159265)),.6)*(.66+.34*sin(aU*24.-uTime*7.));
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const lineFragment = `varying vec3 vColor;varying float vAlpha;void main(){gl_FragColor=vec4(vColor,vAlpha);}`;
  const ringMat = new THREE.ShaderMaterial({uniforms:ringUniforms,vertexShader:ringVertex,fragmentShader:lineFragment,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const rings = [];
  for(let k=0;k<3;k++) {
    const positions=[], u=[];
    for(let j=0;j<=180;j++) {
      const v=j/180,a=-1.4+v*2.8;
      positions.push(12.10*Math.sin(a),12.10*Math.cos(a),0);u.push(v);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('aU',new THREE.Float32BufferAttribute(u,1));
    const curve=new THREE.CatmullRomCurve3(Array.from({length:181},(_,j)=>new THREE.Vector3().fromArray(positions,j*3)));
    const tube=new THREE.TubeGeometry(curve,180,.019,4,false);
    tube.setAttribute('aU',new THREE.Float32BufferAttribute(Array.from({length:tube.attributes.uv.count},(_,j)=>tube.attributes.uv.getX(j)),1));
    const ring=new THREE.Mesh(tube,ringMat);group.add(ring);rings.push(ring);
    const glowMat=new THREE.ShaderMaterial({uniforms:ringUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:ringVertex.replace('gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);',
        'gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=7.;vAlpha*=.24;'),
      fragmentShader:'varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,vAlpha*exp(-d*d*4.)*(1.-smoothstep(.7,1.,d)));}'});
    const glow=new THREE.Points(geometry,glowMat);ring.add(glow);
  }
  // Cracks follow the spherical data rows; pulse heads travel along the paths.
  const fractures=[],fractureU=[],fractureRoute=[];
  for(let k=0;k<18;k++) {
    const lon0=-1.15+k*.135,lat0=-.8+(k%7)*.23;
    for(let j=0;j<42;j++)for(const n of [j,j+1]) {
      const u=n/42,lon=lon0+(u-.5)*.62,lat=lat0+Math.sin(u*5.4+k)*.12+(u-.5)*.32;
      fractures.push(12.055*Math.cos(lat)*Math.sin(lon),12.055*Math.sin(lat),12.055*Math.cos(lat)*Math.cos(lon));
      fractureU.push(u);fractureRoute.push(k);
    }
  }
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fractures,3));
  fg.setAttribute('aU',new THREE.Float32BufferAttribute(fractureU,1));fg.setAttribute('aRoute',new THREE.Float32BufferAttribute(fractureRoute,1));
  const fractureMat=new THREE.ShaderMaterial({uniforms:ringUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aU,aRoute;uniform float uTime,uGain;varying vec3 vColor;varying float vAlpha;
    void main(){float head=fract(uTime*.24+aRoute*.071);float d=abs(aU-head);
    float pulse=exp(-d*d*210.);vAlpha=uGain*(.04+.8*pulse)*smoothstep(3.4,6.,uTime);
    vColor=mix(vec3(.97,.27,.055),vec3(.63,.25,1.),pulse*.75);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:lineFragment});
  group.add(new THREE.LineSegments(fg,fractureMat));
  // Extraction is made of the archive's own lit records, carried along curved trajectories.
  const positions=[], progress=[], routes=[];
  for(let k=0;k<28;k++) {
    const lon=-.9+(k%7)*.27,lat=-.7+Math.floor(k/7)*.45;
    const start=new THREE.Vector3(12*Math.cos(lat)*Math.sin(lon),12*Math.sin(lat),12*Math.cos(lat)*Math.cos(lon));
    const end=new THREE.Vector3(7.5+(k%3)*.10,-.9+(k%4)*.13,15.5);
    const control=start.clone().multiplyScalar(1.23);control.z+=2.3;
    for(let j=0;j<=80;j++) {
      const u=j/80,inv=1-u,p=start.clone().multiplyScalar(inv*inv).addScaledVector(control,2*inv*u).addScaledVector(end,u*u);
      positions.push(p.x,p.y,p.z);progress.push(u);routes.push(k);
    }
  }
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  pg.setAttribute('aU',new THREE.Float32BufferAttribute(progress,1));pg.setAttribute('aRoute',new THREE.Float32BufferAttribute(routes,1));
  const particleVertex=`attribute float aU,aRoute;uniform float uTime,uGain,uHalo;varying vec3 vColor;varying float vAlpha;
    void main(){float launch=7.25+aRoute*.032;float alive=smoothstep(launch,launch+.5,uTime)*(1.-smoothstep(11.1,11.7,uTime));
    float head=fract(max(0.,uTime-launch)*.42+aRoute*.173);float d=mod(head-aU+1.,1.);
    float tail=exp(-d*35.);vAlpha=alive*uGain*tail*(uHalo>.5?.38:1.);
    vColor=mix(vec3(1.,.28,.055),mix(vec3(.2,.8,1.),vec3(.72,.25,1.),.5+.5*sin(aRoute)),aU);
    vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=(uHalo>.5?20.:4.2)*min(1.5,27./max(1.,-mv.z));}`;
  for(const halo of [true,false]) {
    const material=new THREE.ShaderMaterial({uniforms:{...ringUniforms,uHalo:{value:halo?1:0}},transparent:true,depthWrite:false,
      blending:THREE.AdditiveBlending,vertexShader:particleVertex,
      fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;
      float a=vAlpha*exp(-d*d*3.)*(1.-smoothstep(.65,1.,d));if(a<.002)discard;gl_FragColor=vec4(vColor,a);}`});
    const particles=new THREE.Points(pg,material);particles.frustumCulled=false;group.add(particles);
  }
  return {
    update(seconds) {
      clock.value=seconds;
      const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
      gain.value=smooth((seconds-1.8)/2.5)*(1-smooth((seconds-12.1)/.7));
      group.visible=gain.value>.0001;
      rings.forEach((ring,k)=>{
        ring.rotation.set(.62+k*.74,.3+seconds*(.20+k*.035),-.38+k*1.05);
      });
    }
  };
}
