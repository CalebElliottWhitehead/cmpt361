const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

const config = {
    normalize: false
}

const perspective = (fovy, aspect, near, far) => {
    const f = 1.0 / Math.tan(fovy / 2)
    const d = far - near
    const result = new Matrix()
    result.m[0][0] = f / aspect
    result.m[1][1] = f
    result.m[2][2] = -(near + far) / d
    result.m[2][3] = (-2 * near * far) / d
    result.m[3][2] = -1
    result.m[3][3] = 0.0
    return result
}

const createRotationMatrix = (theta, x, y, z, mat = new Matrix()) => {
    // prettier-ignore
    mat.r = [
        [cos(theta) + (1 - cos(theta)) * x * x,     (1 - cos(theta)) * x * y - z * sin(theta),  (1 - cos(theta)) * x * z + y * sin(theta),],
        [(1 - cos(theta)) * x * y + z * sin(theta), cos(theta) + (1 - cos(theta)) * y * y,      (1 - cos(theta)) * y * z - x * sin(theta),],
        [(1 - cos(theta)) * x * z - y * sin(theta), (1 - cos(theta)) * y * z + x * sin(theta),  cos(theta) + (1 - cos(theta)) * z * z,]
    ]
    return mat
}

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        new Error(
            `
            An error occurred compiling the shaders:
            ${gl.getShaderInfoLog(shader)}
            `
        )
    }

    return shader
}

const createShaderProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
            `
            Unable to initialize the shader program:
            ${gl.getProgramInfoLog(shaderProgram)}
            `
        )
    }

    return program
}

// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
const initBuffers = gl => {
    // Create a buffer for the cube's vertex positions.
    const positionBuffer = gl.createBuffer()

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    const vertices = get_vertices()

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

    // Now set up the colors for the faces. We'll use solid colors
    // for each face.
    // prettier-ignore
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0],    // Front face: white
        [1.0, 0.0, 0.0, 1.0],    // Back face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];

    // Convert the array of colors into a table for all the vertices.
    var colors = []

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j]

        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c)
    }

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    const indices = get_faces()
        .flat()
        .map(index => index - 1)

    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        indicesLength: indices.length
    }
}
const first = new Array(10).fill(true)
const draw = (gl, shader, buffers, theta) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0

    const projectionMatrix2 = perspective(fieldOfView, aspect, zNear, zFar)

    const modelViewMatrix2 = new Matrix()

    modelViewMatrix2.translate(0, -0.6, -6.0)

    const rotation1 = createRotationMatrix(theta * 0.7, 0, 0, 1)

    const rotation2 = createRotationMatrix(theta, 1, 0, 0)

    modelViewMatrix2.dot(rotation1).dot(rotation2)

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(shader.a.vertexPosition, 3, gl.FLOAT, config.normalize, 0, 0)
    gl.enableVertexAttribArray(shader.a.vertexPosition)

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
    // gl.vertexAttribPointer(shader.a.vertexColor, 4, gl.FLOAT, config.normalize, 0, 0)
    // gl.enableVertexAttribArray(shader.a.vertexColor)

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram(shader.program)

    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMatrix2.out)
    gl.uniformMatrix4fv(shader.u.modelViewMatrix, false, modelViewMatrix2.out)

    gl.drawElements(gl.TRIANGLES, buffers.indicesLength, gl.UNSIGNED_SHORT, 0)
}

const vertexShaderSource = `
    attribute vec4 a_VertexPosition;
    attribute vec4 a_VertexColor;
    uniform mat4 u_ModelViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    varying lowp vec4 v_Color;
    void main(void) {
        gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * a_VertexPosition;
        // v_Color = a_VertexColor;
        v_Color = vec4(1, 0, 1, 1);
    }
    `

const fragmentShaderSource = `
    varying lowp vec4 v_Color;
    void main(void) {
        gl_FragColor = v_Color;
    }
    `

const canvas = document.querySelector("#canvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.")

const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

const shader = {
    program: shaderProgram,
    a: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "a_VertexPosition"),
        vertexColor: gl.getAttribLocation(shaderProgram, "a_VertexColor")
    },
    u: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "u_ProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "u_ModelViewMatrix")
    }
}

// Here's where we call the routine that builds all the
// objects we'll be drawing.
const buffers = initBuffers(gl)

// Draw the scene repeatedly
const render = (then, now, theta) => {
    now *= 0.001 // convert to seconds
    const delta = now - then
    then = now
    theta += delta

    draw(gl, shader, buffers, theta)

    requestAnimationFrame(now => render(then, now, theta))
}

requestAnimationFrame(now => render(0, now, 0.0))
