const vertexShaderSource = `
precision mediump float;
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`

const fragmentShaderSource = `
precision mediump float;

void main(void) {
    gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
`
