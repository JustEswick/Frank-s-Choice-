import Phaser from 'phaser';

const fragShader = `
#define SHADER_NAME CHROMA_KEY_FS
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main()
{
    vec4 color = texture2D(uMainSampler, outTexCoord);
    float maxRB = max(color.r, color.b);
    
    // Only key out pixels where Green significantly overpowers Red/Blue
    if (color.g - maxRB > 0.12) {
        color.a = 0.0;
    }
    // Spill suppression for the edges (anti-aliasing fringes)
    else if (color.a > 0.0 && color.g > maxRB) {
        color.g = maxRB;
    }
    
    // Premultiply
    color.rgb *= color.a;
    
    gl_FragColor = color;
}
`;

export default class ChromaKeyPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game,
            name: 'ChromaKeyPipeline',
            fragShader
        });
    }
}
