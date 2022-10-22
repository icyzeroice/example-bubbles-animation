uniform sampler2D uTexture;
uniform float uProgress;

in vec2 vUv;

const float EDGE_FALLBACK = 0.03;


void main() {
    gl_FragColor = texture(uTexture, vUv);

    float distToCenter = distance(vec2(0.5, 0.5), vUv) * 2.0;

    // prevent dark edge
    if (distToCenter > 1.0 - EDGE_FALLBACK) {
        return;
    }

    if (distToCenter < uProgress) {
        gl_FragColor.a = 0.0;
        return;
    }

    gl_FragColor.a = smoothstep(uProgress, uProgress * 2.0, distToCenter);
}
