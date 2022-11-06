in vec2 vUv;

uniform sampler2D tDiffuse;

void main() {
    vec4 currentScreen = texture(tDiffuse, vUv);

    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // return;

    gl_FragColor = vec4(
        currentScreen.xyz,
        currentScreen.w
    ) * max(
        sign(currentScreen.w - 0.999),
        0.0
    );
}