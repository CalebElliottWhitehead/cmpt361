const gl = create.canvas(window)

const vertexShaderSource = `
precision mediump float;

attribute vec4 a_Position;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix, u_ModelViewMatrix, u_ProjectionMatrix;

varying vec3 v_Normal;

void main(void) {
    gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * u_ModelMatrix * a_Position;
    v_Normal = mat3(u_ModelViewMatrix) * a_Normal;
}
`

const fragmentShaderSource = `
precision mediump float;

varying vec3 v_Normal;

void main(void) {
    vec3 LightSourceDirection = vec3(0.7, 0.9, 1.0);
    vec3 Normal = normalize(v_Normal);
    float light = max(dot(Normal, LightSourceDirection), 0.1);
    gl_FragColor = vec4(0.0, 0.6, 0.6, 0.6) * light;
}
`

const positions = getVertices()

const indices = getFaces()

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
        modelMatrix: gl.getUniformLocation(shaderProgram, "u_ModelMatrix")
    }
}
gl.useProgram(shader.program)

const bunny = new Model(gl, positions, indices)
bunny.translate(0, 0.2, 0)

const cubeData = create.shape.cube(20, 1)
const cube = new Model(gl, cubeData.vertices, cubeData.faces)
cube.translate(0, -0.5, 0)

const grid = new Grid(gl, 10, 10)
console.log(grid.lines)

const cylinderData = create.shape.cylinder()
const cylinder = new Model(gl, cylinderData.vertices, cylinderData.faces)

// Draw the scene repeatedly
const render = (now, camera) => {
    now *= 0.001 // convert to seconds

    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const near = 0.1
    const far = 100.0
    const projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)
    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMatrix.out)

    camera.control()
    camera.clear(gl)
    camera.view(gl)

    // grid.draw(gl, shader)
    bunny.draw(gl, shader)
    cube.draw(gl, shader)
    cylinder.draw(gl, shader)

    requestAnimationFrame(now => render(now, camera))
}

const camera = new Camera(shader.u.modelViewMatrix)
camera.initControls()
camera.reset()

render(0, camera)
