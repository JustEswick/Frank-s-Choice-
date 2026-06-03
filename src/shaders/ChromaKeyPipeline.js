import Phaser from 'phaser';

const fragShader = `
#define SHADER_NAME CHROMA_KEY_FS
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main()
{
    vec4 color = texture2D(uMainSampler, outTexCoord);
    
    // Simple Green Spill Suppression
    // Since the image already has a transparent background, we just need
    // to remove the green fringe (where green is greater than red and blue).
    if (color.a > 0.0) {
        float maxRB = max(color.r, color.b);
        if (color.g > maxRB) {
            // Limit green to the max of red and blue, turning the fringe grey/neutral
            color.g = maxRB;
        }
    }
    
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
