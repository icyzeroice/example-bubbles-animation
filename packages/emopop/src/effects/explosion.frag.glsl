uniform sampler2D uTexture;
uniform float uProgress;

in vec2 vUv;


void main() {
    gl_FragColor.rgb = texture(uTexture, vUv).rgb;

    float distToCenter = distance(vec2(0.5, 0.5), vUv);

    if (distToCenter >= uProgress) {
        gl_FragColor.a = 1.0;
        return;
    }

    gl_FragColor.a = smoothstep(uProgress, uProgress * 2.0, distToCenter);
}