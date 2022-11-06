uniform sampler2D uTexture;
uniform float uProgress;

in vec2 vUv;

const float EDGE_FALLBACK = 0.03;
const float TEXTURE_RATIO = 2.0;
const float TEXTURE_RATIO_DIVIDED = 0.5;
const float TEXTURE_RAW_DISPLAY_DIAMETER = 1.0 - EDGE_FALLBACK - TEXTURE_RATIO_DIVIDED;


void main() {
    gl_FragColor = texture(
        uTexture,
        (vUv - vec2(0.5, 0.5)) * TEXTURE_RATIO + vec2(0.5, 0.5)
    );

    float distToCenter = distance(
        vec2(0.5, 0.5),
        vUv
    ) * 2.0;

    

    // prevent dark edge
    if (distToCenter > TEXTURE_RAW_DISPLAY_DIAMETER) {
        gl_FragColor = texture(uTexture, vec2(0.5, EDGE_FALLBACK));

        float edgeGlow = smoothstep(
            1.0 ,
            TEXTURE_RAW_DISPLAY_DIAMETER,
            distToCenter
        );

        gl_FragColor.a = edgeGlow * edgeGlow * edgeGlow;
        return;
    }

    if (distToCenter < uProgress) {
        gl_FragColor.a = 0.0;
        return;
    }

    gl_FragColor.a = smoothstep(
        uProgress,
        uProgress * 2.0,
        distToCenter
    );
}

