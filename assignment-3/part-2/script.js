const positions = getVertices()

const indices = getFaces()

const canvas = document.querySelector("#glcanvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.")
}

// Initialize a shader program; this is where all the lighting
// for the vertices and so forth is established.
const shaderProgram = create.shader.program(gl, vertexShaderSource, fragmentShaderSource)

// Collect all the info needed to use the shader program.
// Look up which attributes our shader program is using
// for aVertexPosition, aVevrtexColor and also
// look up uniform locations.
const shader = {
    program: shaderProgram,
    a: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition")
    },
    u: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")
    }
}
gl.useProgram(shader.program)

const bunny = new Model(gl, positions, indices)

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

    bunny.draw(gl, shader)

    requestAnimationFrame(now => render(now, camera))
}

const camera = new Camera(shader.u.modelViewMatrix)
camera.initControls()
camera.reset()

render(0, camera)
