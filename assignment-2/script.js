const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

const config = {
    ambient: [0.01, 0.01, 0.005],
    diffuse: [0.83, 0.69, 0.22],
    specular: [1, 1, 1],
    shine: 0,
    pointLightPosition: [5, -5, 0, 0],
    spotLightPosition: [5, -10, -15, 0]
}

const createProjectionMat = (fovy, aspect, near, far) => {
    const f = 1.0 / Math.tan(fovy / 2)
    const d = far - near
    const result = new Matrix()
    result.m[0][0] = f / aspect
    result.m[1][1] = f
    result.m[2][2] = -(near + far) / d
    result.m[2][3] = (-2 * near * far) / d
    result.m[3][2] = -1
    result.m[3][3] = 0
    return result
}

const createRotationMatrix = (theta, x, y, z, mat = new Matrix()) => {
    // prettier-ignore
    mat.r = t([
        [cos(theta) + (1 - cos(theta)) * x * x      , (1 - cos(theta)) * x * y - z * sin(theta) , (1 - cos(theta)) * x * z + y * sin(theta) ,],
        [(1 - cos(theta)) * x * y + z * sin(theta)  , cos(theta) + (1 - cos(theta)) * y * y     , (1 - cos(theta)) * y * z - x * sin(theta) ,],
        [(1 - cos(theta)) * x * z - y * sin(theta)  , (1 - cos(theta)) * y * z + x * sin(theta) , cos(theta) + (1 - cos(theta)) * z * z     ,]
    ])
    return mat
}

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        new Error(`
            An error occurred compiling the shaders:
            ${gl.getShaderInfoLog(shader)}
            `)
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
        throw new Error(`
            Unable to initialize the shader program:
            ${gl.getProgramInfoLog(program)}
            `)
    }

    return program
}

const getSurfaceNormal = positions => {
    const t1 = subtract(positions[1], positions[0])
    const t2 = subtract(positions[2], positions[0])
    const normal = normalize(cross(t2, t1))
    return normal
}

const initBuffers = gl => {
    const lines = getCubeLines()
    const linesCount = lines.length

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const vertices = get_vertices()
    vertices.flat()
    const verticesLength = vertices.flat().length
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    const faces = get_faces().map(face => face.map(index => index - 1))
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces.flat()), gl.STATIC_DRAW)

    const normals = []
    for (let i = 0; i < vertices.length; i++) {
        normals.push([0, 0, 0])
    }
    faces.forEach(face => {
        const normal = getSurfaceNormal(face.map(index => vertices[index]))
        face.forEach(index => {
            normals[index][0] += normal[0]
            normals[index][1] += normal[1]
            normals[index][2] += normal[2]
        })
    })
    normals.map(normal => normalize(normal))

    lines.forEach(() => normals.push([0, 0, 0]))

    const normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)

    // const lightsBuffer = gl.createBuffer()
    // gl.bindBuffer(gl.ARRAY_BUFFER, lightsBuffer)
    // gl.bufferData(
    //     gl.ARRAY_BUFFER,
    //     new Float32Array(lines.flat().map(coord => coord + 3)),
    //     gl.STATIC_DRAW
    // )

    return {
        // lights: lightsBuffer,
        // lightsLength: linesCount,
        position: positionBuffer,
        length: verticesLength,
        indices: indexBuffer,
        indicesLength: faces.flat().length,
        normals: normalsBuffer,
        normalsLength: normals.flat(2).length
    }
}
let log = true
setInterval(() => (log = true), 500)
const draw = (gl, shader, buffers, transformationMat, pointLightPosition) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0

    const projectionMat = createProjectionMat(fieldOfView, aspect, zNear, zFar)

    const modelViewMat = new Matrix()

    modelViewMat.dot(transformationMat)

    pointLightPosition = vecDotMat(pointLightPosition, modelViewMat.m)

    pointLightPosition[2] += -10

    if (log) {
        log = false
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.lines)
    // gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    // gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram(shader.program)

    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMat.out)
    gl.uniformMatrix4fv(shader.u.modelViewMatrix, false, modelViewMat.out)
    gl.uniformMatrix4fv(shader.u.normalMatrix, false, projectionMat.out)

    gl.uniform3fv(shader.u.pointLightPosition, new Float32Array(pointLightPosition.slice(0, 3)))
    gl.uniform3fv(
        shader.u.spotLightPosition,
        new Float32Array(config.spotLightPosition.slice(0, 3))
    )
    gl.uniform3fv(shader.u.ambientColor, new Float32Array(config.ambient))
    gl.uniform3fv(shader.u.diffuseColor, new Float32Array(config.diffuse))
    gl.uniform3fv(shader.u.specularColor, new Float32Array(config.specular))
    gl.uniform1f(shader.u.shine, config.shine)

    gl.drawElements(gl.TRIANGLES, buffers.indicesLength, gl.UNSIGNED_SHORT, 0)

    // gl.drawArrays(gl.LINES, buffers.length, buffers.lightsLength)
}

const render = (then, now, theta, transformationMat, lastPosition) => {
    now *= 0.001 // convert to seconds
    const delta = now - then
    then = now
    theta += delta

    const movement = {
        x: input.mouse.x - lastPosition.x,
        y: input.mouse.y - lastPosition.y
    }

    lastPosition = {
        x: input.mouse.x,
        y: input.mouse.y
    }

    if (input.mouse.rightClick && (movement.x != 0 || movement.y != 0)) {
        const vec = [-movement.y, -movement.x, 0]
        transformationMat.rotate(getLength(vec) / 100, ...vecNorm(vec))
    }

    if (input.mouse.leftClick && (movement.x != 0 || movement.y != 0)) {
        transformationMat.translate(movement.x / 100, -movement.y / 100, 0)
    }

    if (input.r) {
        transformationMat = new Matrix()
        transformationMat.translate(0, 0, -10)
        input.r = false
    }

    if (input.wheel) {
        transformationMat.translate(0, 0, input.wheel)
        input.wheel = 0
    }

    const lightRotationMat = createRotationMatrix(theta, 0, 1, 0)

    const pointLightPosition = vecDotMat(config.pointLightPosition, lightRotationMat.m)

    draw(gl, shader, buffers, transformationMat, pointLightPosition)

    requestAnimationFrame(now => render(then, now, theta, transformationMat, lastPosition))
}

// new source
const vertexShaderSource = `
attribute vec3 a_Position, a_Normal;

uniform mat4 u_ProjectionMatrix, u_ModelViewMatrix, u_NormalMatrix;

varying vec3 v_NormalInterp, v_Position;

void main() {
    gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position, 1.0);
    vec4 Position = u_ModelViewMatrix * vec4(a_Position, 1.0);
    v_Position = vec3(Position) / Position.w;
    v_NormalInterp = vec3(u_NormalMatrix * vec4(a_Normal, 0.0));
}
`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 u_PointLightPosition, u_SpotLightPosition, u_AmbientColor, u_DiffuseColor, u_SpecularColor;
uniform float u_Shine;

varying vec3 v_NormalInterp, v_Position;

void main() {
    vec3 Normal = normalize(v_NormalInterp);
    vec3 ViewDirection = normalize(-v_Position);

    // Point
    vec3 PointLightDirection = normalize(u_PointLightPosition - v_Position);
    vec3 ReflectDirection = reflect(-PointLightDirection, Normal);

    float Lambertian = max(dot(PointLightDirection, Normal), 0.0);
    float SpecularAngle = 0.0;
    float Specular = 0.0;

    if (Lambertian > 0.0) {
        float SpecularAngle = max(dot(ReflectDirection, ViewDirection), 0.0);
        float Specular = pow(SpecularAngle, u_Shine);
    }

    vec4 PointLighting = vec4(u_AmbientColor + Lambertian * u_DiffuseColor + Specular * u_SpecularColor, 1.0);

    // Spot
    vec3 SpotLightDirection = normalize(u_SpotLightPosition - v_Position);
    vec3 SpotReflectDirection = reflect(-SpotLightDirection, Normal);

    float SpotLambertian = max(dot(SpotLightDirection, Normal), 0.0);
    float SpotSpecularAngle = 0.0;
    float SpotSpecular = 0.0;

    if (SpotLambertian > 0.0) {
        float SpotSpecularAngle = max(dot(SpotReflectDirection, ViewDirection), 0.0);
        float SpotSpecular = pow(SpotSpecularAngle, u_Shine);
    }

    vec4 SpotLighting = vec4(u_AmbientColor + SpotLambertian * u_DiffuseColor + SpotSpecular * u_SpecularColor, 1.0);
    
    // #phonglyfe
    gl_FragColor = PointLighting + SpotLighting;
}
`

const canvas = document.querySelector("#canvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.")

const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

const shader = {
    program: shaderProgram,
    a: {
        position: gl.getAttribLocation(shaderProgram, "a_Position"),
        normal: gl.getAttribLocation(shaderProgram, "a_Normal")
    },
    u: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "u_ProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "u_ModelViewMatrix"),
        normalMatrix: gl.getUniformLocation(shaderProgram, "u_NormalMatrix"),
        pointLightPosition: gl.getUniformLocation(shaderProgram, "u_PointLightPosition"),
        spotLightPosition: gl.getUniformLocation(shaderProgram, "u_SpotLightPosition"),
        ambientColor: gl.getUniformLocation(shaderProgram, "u_AmbientColor"),
        diffuseColor: gl.getUniformLocation(shaderProgram, "u_DiffuseColor"),
        specularColor: gl.getUniformLocation(shaderProgram, "u_SpecularColor"),
        shine: gl.getUniformLocation(shaderProgram, "u_Shine")
    }
}

const input = {
    mouse: {
        leftClick: false,
        rightClick: false,
        x: 0,
        y: 0
    },
    wheel: 0,
    r: false
}

const leftClick = isClicked => (input.mouse.leftClick = isClicked)

const rightClick = isClicked => (input.mouse.rightClick = isClicked)

window.addEventListener("contextmenu", event => event.preventDefault())

window.addEventListener("mousedown", event => {
    if (event.button === 0) leftClick(true)
    if (event.button === 2) rightClick(true)
})

window.addEventListener("mousemove", event => {
    input.mouse.x = event.clientX
    input.mouse.y = event.clientY
})

window.addEventListener("mouseup", event => {
    if (event.button === 0) leftClick(false)
    if (event.button === 2) rightClick(false)
})

window.addEventListener("wheel", event => {
    input.wheel = event.deltaY
})

window.addEventListener("keydown", event => {
    if (event.key === "r") {
        input.r = true
    }
})

const buffers = initBuffers(gl)

const transformationMat = new Matrix()
transformationMat.translate(0, 0, -10)

requestAnimationFrame(now => render(0, now, 0, transformationMat, { x: 0, y: 0 }))
