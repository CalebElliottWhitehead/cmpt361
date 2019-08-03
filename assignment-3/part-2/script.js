const vertexShaderSource = `
precision mediump float;

attribute vec4 a_Position;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix, u_ModelViewMatrix, u_ProjectionMatrix;

varying vec3 v_Normal, v_LightDirection;

void main(void) {
    gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * u_ModelMatrix * a_Position;
    v_Normal = mat3(u_ModelViewMatrix * u_ModelMatrix) * a_Normal;
    v_LightDirection = mat3(u_ModelViewMatrix) *  vec3(0.7, 0.9, 1.0);
}
`

const fragmentShaderSource = `
precision mediump float;

uniform vec4 u_Color;

varying vec3 v_Normal, v_LightDirection;

void main(void) {
    vec3 Normal = normalize(v_Normal);
    float light = max(dot(Normal, v_LightDirection), 0.4);
    gl_FragColor = u_Color * light;
}
`

// initialize canvas
const gl = create.canvas(window)

// initialize shader
const shaderProgram = create.shader.program(gl, vertexShaderSource, fragmentShaderSource)
const shader = {
    program: shaderProgram,
    a: {
        position: gl.getAttribLocation(shaderProgram, "a_Position"),
        normal: gl.getAttribLocation(shaderProgram, "a_Normal")
    },
    u: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "u_ProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "u_ModelViewMatrix"),
        modelMatrix: gl.getUniformLocation(shaderProgram, "u_ModelMatrix"),
        color: gl.getUniformLocation(shaderProgram, "u_Color")
    }
}
gl.useProgram(shader.program)

// initialize cube
const cube = create.cube(gl, 100, 1)
cube.translate(0, -0.5, 0)
cube.color = [0.2, 0.5, 0.2, 1]

// initialize tree
const tree = new Tree(gl)

// initialize camera
const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)
camera.reset()

// initialize input
const input = new Input(window)
input.initKeyPress(window, "r", camera.reset.bind(camera))
input.initScroll(window, z => (camera.matrix.m[3][2] += z * -1))
input.initMouseHold(window, "right", (x, y) => {
    camera.rotateY(x)
    camera.translate(0, y * 10, 0)
})

// initialize scene
const scene = new Scene()
scene.append(cube, tree, camera)
scene.onRenderCall(() => camera.clear(gl), () => camera.view(gl))
scene.render(gl, shader)
