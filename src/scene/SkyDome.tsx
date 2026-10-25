import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BackSide, Color, Vector3 } from "three";

/** The sky's colour at the horizon, exactly as it shows on screen. Fog uses it so the far water melts in. */
export const HORIZON = "#b3cfe4";
const ZENITH = "#3b7cc6";
const SUN_GLOW = "#fff4e0";
const CLOUD_LIT = "#f6f8fb";
const CLOUD_SHADE = "#9ea3c0"; // lavender-grey undersides

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 sunGlow;
  uniform vec3 cloudLit;
  uniform vec3 cloudShade;
  uniform vec3 sunDir;
  uniform float time;
  varying vec3 vWorld;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) { v += a * noise(p); p = r * p; a *= 0.5; }
    return v;
  }
  // Cloud thickness (0..1) on the plane above the viewer.
  float clouds(vec2 p) {
    vec2 q = p + 0.8 * vec2(fbm(p * 0.6 + 3.1), fbm(p * 0.6 - 1.7)); // domain warp: billows, not blobs
    float big = fbm(p * 0.15 + 7.0); // where the clumps gather
    float n = fbm(q) + 0.5 * (big - 0.5);
    return clamp((n - 0.52) / 0.3, 0.0, 1.0);
  }

  void main() {
    vec3 d = normalize(vWorld - cameraPosition);
    float y = max(d.y, 0.0);

    // Thin pale band at the horizon, clear blue by ~20 degrees up.
    vec3 col = mix(horizon, zenith, 1.0 - pow(1.0 - y, 5.0));

    // Clouds: project onto a plane, drift with time, fade out under ~3 degrees.
    if (d.y > 0.04) {
      vec2 p = d.xz / d.y * 0.6 + vec2(time * 0.006, time * 0.002);
      float t = clouds(p);
      // Thick bellies go lavender-grey; the side facing the sun catches light.
      float toSun = t - clouds(p + normalize(sunDir.xz + 1e-4) * 0.08);
      float lit = clamp(1.0 - 0.9 * smoothstep(0.15, 0.9, t) + 3.0 * toSun, 0.0, 1.0);
      vec3 cloud = mix(cloudShade, cloudLit, lit);
      float a = smoothstep(0.0, 0.3, t) * smoothstep(0.05, 0.2, d.y);
      // Distant clouds sink into the haze.
      cloud = mix(horizon, cloud, smoothstep(0.04, 0.3, d.y));
      col = mix(col, cloud, a);
    }

    // Soft sun glow, no disc.
    float s = max(dot(d, normalize(sunDir)), 0.0);
    col += sunGlow * (0.08 * pow(s, 6.0) + 0.2 * pow(s, 48.0) + 0.3 * pow(s, 400.0));

    // Below the horizon only the water's reflection looks: hold the horizon colour.
    if (d.y < 0.0) col = horizon;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither the gradient
  }
`;

/**
 * Painted sky: blue gradient, soft sun glow, drifting clouds. Drawn first and untouched by
 * tone mapping, so its horizon on screen is exactly HORIZON. R3F disposes geometry and material.
 */
export function SkyDome({ sun }: { sun: [number, number, number] }) {
  const uniforms = useMemo(
    () => ({
      zenith: { value: new Color(ZENITH) },
      horizon: { value: new Color(HORIZON) },
      sunGlow: { value: new Color(SUN_GLOW) },
      cloudLit: { value: new Color(CLOUD_LIT) },
      cloudShade: { value: new Color(CLOUD_SHADE) },
      sunDir: { value: new Vector3(...sun).normalize() },
      time: { value: 0 },
    }),
    [sun],
  );

  useFrame((_, delta) => {
    uniforms.time.value += delta;
  });

  // Radius 400: inside the environment cube camera's far plane (1000).
  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
      />
    </mesh>
  );
}
