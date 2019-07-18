const config = {
    ambient: [0.01, 0.01, 0.005],
    diffuse: [0.83, 0.69, 0.22],
    specular: [1, 0.9, 0.3],
    shine: 1,
    pointLightPosition: [5, 5, 0, 0],
    spotLight: {
        position: [0, 4, 2],
        direction: [0, -2, -2],
        movementBound: [-2, 2],
        limit: 0.5
    },
    cameraPosition: [0, 0, -15]
}

const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

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
    const normal = normalize(cross(t1, t2))
    return normal
}

const createBunnyBuffer = gl => {
    // Position Buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    const vertices = get_vertices()
    vertices.flat()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

    // Index Buffer
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    const faces = get_faces().map(face => face.map(index => index - 1))
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces.flat()), gl.STATIC_DRAW)

    // Normals Buffer
    const normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)

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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        indices: indexBuffer,
        normals: normalsBuffer,
        length: faces.flat().length
    }
}

const createPointLightBuffer = gl => {
    // Position Buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    const vertices = getCubeVertices()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

    // Normals Buffer
    const normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)

    console.log(vertices)
    const surfaces = []
    for (let i = 0; i < vertices.length; i += 3) {
        surfaces.push([vertices[i], vertices[i + 1], vertices[i + 2]])
    }
    const normals = surfaces.map(surface => [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        normals: normalsBuffer,
        length: vertices.length
    }
}

const createSpotLightBuffer = gl => {
    // Position Buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    const vertices = getConeVertices()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

    // Normals Buffer
    const normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)

    console.log(vertices)
    const surfaces = []
    for (let i = 0; i < vertices.length; i += 3) {
        surfaces.push([vertices[i], vertices[i + 1], vertices[i + 2]])
    }
    const normals = surfaces.map(surface => [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        normals: normalsBuffer,
        length: vertices.length
    }
}

const drawBunny = (gl, shader, buffer) => {
    gl.uniform1f(shader.u.shape, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices)

    gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0)
}

const drawPointLight = (gl, shader, buffer, position) => {
    gl.uniform1f(shader.u.shape, 1)
    gl.uniform3fv(shader.u.pointLightPosition, new Float32Array(position.slice(0, 3)))

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    gl.drawArrays(gl.LINE_STRIP, 0, buffer.length)
}

const drawSpotLight = (gl, shader, buffer, config) => {
    gl.uniform1f(shader.u.shape, 2)
    gl.uniform3fv(shader.u.spotLightPosition, new Float32Array(config.position))
    gl.uniform3fv(shader.u.spotLightDirection, new Float32Array(config.direction))
    gl.uniform1f(shader.u.limit, config.limit)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    gl.drawArrays(gl.LINE_STRIP, 0, buffer.length)
}

const setView = (gl, shader, transformationMat, pointLightPosition, spotLightPosition) => {
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

    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMat.out)
    gl.uniformMatrix4fv(shader.u.modelViewMatrix, false, modelViewMat.out)
}

const setUniforms = (gl, config) => {
    gl.uniform3fv(shader.u.ambientColor, new Float32Array(config.ambient))
    gl.uniform3fv(shader.u.diffuseColor, new Float32Array(config.diffuse))
    gl.uniform3fv(shader.u.specularColor, new Float32Array(config.specular))
    gl.uniform1f(shader.u.shine, config.shine)
}

// new source
const vertexShaderSource = `
precision mediump float;

attribute vec3 a_Position, a_Normal;

uniform mat4 u_ProjectionMatrix, u_ModelViewMatrix;

uniform vec3 u_PointLightPosition, u_SpotLightPosition, u_LightDirection;

uniform float u_Shape;

varying vec3 v_NormalInterp, v_Position, v_LightDirection;

void main() {
    vec4 Position;

    if (u_Shape == 1.0) {
        Position = u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position + u_PointLightPosition, 1.0);
    } else if (u_Shape == 2.0) {
        Position = u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position + u_SpotLightPosition, 1.0);
    } else {
        Position = u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position, 1.0);
    }

    gl_Position = Position;

    v_Position = vec3(Position) / Position.w;

    v_NormalInterp = vec3(u_ProjectionMatrix * vec4(a_Normal, 0.0));

    v_LightDirection = normalize(vec3(u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position + u_LightDirection, 1.0)));
}
`

const fragmentShaderSource = `
precision mediump float;

uniform mat4 u_ProjectionMatrix, u_ModelViewMatrix;

uniform vec3 u_PointLightPosition, u_SpotLightPosition, u_AmbientColor, 
    u_DiffuseColor, u_SpecularColor, u_LightDirection;

uniform float u_Shine, u_Limit, u_Shape;

varying vec3 v_NormalInterp, v_Position, v_LightDirection;

void main() { // *****************************************************************
    vec3 Normal = normalize(v_NormalInterp);
    vec3 ViewDirection = normalize(-v_Position);

    // Point *****************************************************************
    vec3 PointLightDirection = normalize(vec3(u_ProjectionMatrix * vec4(u_PointLightPosition, 0.0)) - v_Position);
    vec3 ReflectDirection = reflect(PointLightDirection, Normal);
    float Lambertian = max(dot(PointLightDirection, Normal), 0.0);
    float SpecularAngle = 0.0;
    float Specular = 0.0;
    if (Lambertian > 2.0) {
        SpecularAngle = max(dot(ReflectDirection, ViewDirection), 0.0);
        Specular = pow(SpecularAngle, u_Shine);
    }
    vec4 PointLighting = vec4(u_AmbientColor + Lambertian * u_DiffuseColor + Specular * u_SpecularColor, 1.0);
    
    // Spot *****************************************************************

    vec3 SpotLightDirection = normalize(vec3(u_ProjectionMatrix * vec4(u_SpotLightPosition, 0.0)) - v_Position);
    vec3 SpotReflectDirection = reflect(SpotLightDirection, Normal);
    float SpotLambertian = 0.0;
    float SpotSpecularAngle = 0.0;
    float SpotSpecular = 0.0;

    float DotFromDirection = dot(v_LightDirection, -SpotLightDirection);
    if (DotFromDirection < u_Limit) {
        SpotLambertian = max(dot(SpotLightDirection, Normal), 0.0);
        // if (Lambertian > 2.0) {
        //     SpotReflectDirection = reflect(SpotLightDirection, Normal);
        //     SpotSpecularAngle = dot(SpotReflectDirection, ViewDirection);
        //     SpotSpecular = pow(SpotSpecularAngle, u_Shine);
        // }
    }
    vec4 SpotLighting = vec4(u_AmbientColor + SpotLambertian * u_DiffuseColor + SpotSpecular * u_SpecularColor, 1.0);
    
    // Final *****************************************************************
    
    if (1.0 <= u_Shape) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        // gl_FragColor = PointLighting + SpotLighting;
        gl_FragColor = SpotLighting;
    }
}
`

const canvas = document.querySelector("#canvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.")

const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource)
gl.useProgram(shaderProgram)

const shader = {
    program: shaderProgram,
    a: {
        position: gl.getAttribLocation(shaderProgram, "a_Position"),
        normal: gl.getAttribLocation(shaderProgram, "a_Normal")
    },
    u: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "u_ProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "u_ModelViewMatrix"),
        normalMatrix: gl.getUniformLocation(shaderProgram, "u_normalMatrix"),
        pointLightPosition: gl.getUniformLocation(shaderProgram, "u_PointLightPosition"),
        spotLightPosition: gl.getUniformLocation(shaderProgram, "u_SpotLightPosition"),
        spotLightDirection: gl.getUniformLocation(shaderProgram, "u_LightDirection"),
        ambientColor: gl.getUniformLocation(shaderProgram, "u_AmbientColor"),
        diffuseColor: gl.getUniformLocation(shaderProgram, "u_DiffuseColor"),
        specularColor: gl.getUniformLocation(shaderProgram, "u_SpecularColor"),
        shine: gl.getUniformLocation(shaderProgram, "u_Shine"),
        limit: gl.getUniformLocation(shaderProgram, "u_Limit"),
        shape: gl.getUniformLocation(shaderProgram, "u_Shape")
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

const bunnyBuffer = createBunnyBuffer(gl)

const pointLightBuffer = createPointLightBuffer(gl)

const spotLightBuffer = createSpotLightBuffer(gl)

setUniforms(gl, config)

const render = (then, now, transformationMat, lastPosition) => {
    const theta = now * 0.001 // convert to seconds

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

    setView(gl, shader, transformationMat)

    drawBunny(gl, shader, bunnyBuffer)

    const lightRotationMat = createRotationMatrix(theta, 0, 1, 0)
    const pointLightPosition = vecDotMat(config.pointLightPosition, lightRotationMat.m)
    drawPointLight(gl, shader, pointLightBuffer, pointLightPosition)

    const spotLightPosition = config.spotLight.position
    spotLightPosition[0] += Math.sin(theta) / 50
    drawSpotLight(gl, shader, spotLightBuffer, config.spotLight)

    requestAnimationFrame(now => render(then, now, transformationMat, lastPosition))
}

const transformationMat = new Matrix()
transformationMat.translate(...config.cameraPosition)

requestAnimationFrame(now => render(0, now, transformationMat, { x: 0, y: 0 }))
