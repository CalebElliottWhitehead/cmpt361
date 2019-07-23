const positions = getVertices()

const indices = getFaces()

var cubeRotation = 0.0

const canvas = document.querySelector("#glcanvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

// If we don't have a GL context, give up now

if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.")
}

// Vertex shader program
const vertexShaderSource = `
precision mediump float;
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`

// Fragment shader program
const fragmentShaderSource = `
precision mediump float;

void main(void) {
    gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
`

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

var then = 0

// Draw the scene repeatedly
function render(now) {
    now *= 0.001 // convert to seconds
    const deltaTime = now - then
    then = now

    drawScene(gl, shader, deltaTime)

    requestAnimationFrame(render)
}
requestAnimationFrame(render)

const cube = new Model(gl, positions, indices)

let log = true

//
// Draw the scene.
//
function drawScene(gl, shader, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const near = 0.1
    const far = 100.0
    const projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)

    if (log) {
        log = false
    }

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create()

    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0]
    ) // amount to translate
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation, // amount to rotate in radians
        [0, 0, 1]
    ) // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.7, // amount to rotate in radians
        [0, 1, 0]
    ) // axis to rotate around (X)

    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMatrix.out)
    gl.uniformMatrix4fv(shader.u.modelViewMatrix, false, modelViewMatrix)

    bunny.draw(gl, shader)

    cubeRotation += deltaTime
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    // Create the shader program

    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram))
        return null
    }

    return shaderProgram
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type)

    // Send the source to the shader object

    gl.shaderSource(shader, source)

    // Compile the shader program

    gl.compileShader(shader)

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}
