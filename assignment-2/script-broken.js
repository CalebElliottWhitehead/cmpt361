// helpers
const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)
const toRadians = degrees => (degrees * Math.PI) / 180

const config = {
    ambient: [0.01, 0.01, 0.005],
    diffuse: [0.83, 0.69, 0.22],
    specular: [1, 0.9, 0.3],
    shine: 1,
    limit: -0.992,
    pointLightPosition: [5, -5, 0],
    spotLightPosition: [0, -1, 0],
    spotLightDirection: [0, 0, -1],
    cameraPosition: [0, 0, -10]
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

const createBunnyBuffer = gl => {
    // Position Buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    const vertices = get_vertices()
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

    const normals = vertices.map(() => [0, 0, 0])
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat()), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        normals: normalsBuffer,
        length: vertices.length
    }
}

const createSpotLightBuffer = gl => {}

const drawBunny = (gl, shader, buffer) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices)
    gl.useProgram(shader.program)
    gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0)
}

const drawPointLight = (gl, shader, buffer, startPosition, theta) => {
    const rotationMat = createRotationMatrix(theta, 0, 1, 0)
    const position = vecDotMat([...startPosition, 0], rotationMat.m)
    gl.uniform3fv(shader.u.pointLightPosition, new Float32Array(position.slice(0, 3)))

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position)
    gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.position)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals)
    gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shader.a.normal)

    gl.useProgram(shader.program)
    gl.drawArrays(gl.TRIANGLES, 0, buffer.length)
}

const drawSpotLight = (gl, shader, buffer, startPosition, theta, direction) => {
    gl.uniform3fv(shader.u.spotLightPosition, new Float32Array(spotLightPosition.slice(0, 3)))

    const spotLightPosition = config.spotLightPosition
    spotLightPosition[0] += Math.sin(now) / 50
}

const setView = (gl, cameraTransformMat) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const fieldOfView = toRadians(45)
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const near = 0.1
    const far = 100.0
    const projectionMat = createProjectionMat(fieldOfView, aspect, near, far)

    const modelViewMat = new Matrix()
    modelViewMat.dot(cameraTransformMat)

    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMat.out)
    gl.uniformMatrix4fv(shader.u.modelViewMatrix, false, modelViewMat.out)
    gl.uniformMatrix4fv(shader.u.normalMatrix, false, projectionMat.out)
}

const setUniforms = (gl, shader, config) => {
    gl.uniform3fv(shader.u.spotLightDirection, new Float32Array(config.spotLightDirection))
    gl.uniform3fv(shader.u.ambientColor, new Float32Array(config.ambient))
    gl.uniform3fv(shader.u.diffuseColor, new Float32Array(config.diffuse))
    gl.uniform3fv(shader.u.specularColor, new Float32Array(config.specular))
    gl.uniform1f(shader.u.shine, config.shine)
    gl.uniform1f(shader.u.limit, config.limit)
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

uniform vec3 u_PointLightPosition, u_SpotLightPosition, u_AmbientColor, 
    u_DiffuseColor, u_SpecularColor, u_LightDirection;

uniform float u_Shine, u_Limit;

varying vec3 v_NormalInterp, v_Position;

void main() {
    vec3 Normal = normalize(v_NormalInterp);
    vec3 ViewDirection = normalize(-v_Position);

    // Point *****************************************************************
    vec3 PointLightDirection = normalize(u_PointLightPosition - v_Position);
    vec3 ReflectDirection = reflect(-PointLightDirection, Normal);

    float Lambertian = max(dot(PointLightDirection, Normal), 0.0);
    float SpecularAngle = 0.0;
    float Specular = 0.0;

    if (Lambertian > 10.0) {
        SpecularAngle = max(dot(ReflectDirection, ViewDirection), 0.0);
        Specular = pow(SpecularAngle, u_Shine);
    }

    vec4 PointLighting = vec4(u_AmbientColor + Lambertian * u_DiffuseColor + Specular * u_SpecularColor, 1.0);

    // Spot *****************************************************************
    vec3 SpotLightDirection = normalize(-u_SpotLightPosition - v_Position);
    vec3 SpotReflectDirection = reflect(-SpotLightDirection, Normal);

    float SpotLambertian = 0.0;
    float SpotSpecularAngle = 0.0;
    float SpotSpecular = 0.0;

    float AngleFromCenter = dot(-SpotLightDirection, -u_LightDirection);

    if (AngleFromCenter < u_Limit) {
        SpotLambertian = dot(SpotLightDirection, Normal);
        // if (SpotLambertian > 0.0) {
        //     SpotSpecular = pow(dot(Normal, SpotReflectDirection), u_Shine);
        // }
    }

    vec4 SpotLighting = vec4(u_AmbientColor + SpotLambertian * u_DiffuseColor + SpotSpecular * u_SpecularColor, 1.0);
    
    // Final *****************************************************************
    // gl_FragColor = PointLighting + SpotLighting;
    // gl_FragColor = SpotLighting;
    gl_FragColor = vec4(0, 1, 1, 1);

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
        normalMatrix: gl.getUniformLocation(shaderProgram, "u_NormalMatrix"),
        pointLightPosition: gl.getUniformLocation(shaderProgram, "u_PointLightPosition"),
        spotLightPosition: gl.getUniformLocation(shaderProgram, "u_SpotLightPosition"),
        spotLightDirection: gl.getUniformLocation(shaderProgram, "u_LightDirection"),
        ambientColor: gl.getUniformLocation(shaderProgram, "u_AmbientColor"),
        diffuseColor: gl.getUniformLocation(shaderProgram, "u_DiffuseColor"),
        specularColor: gl.getUniformLocation(shaderProgram, "u_SpecularColor"),
        shine: gl.getUniformLocation(shaderProgram, "u_Shine"),
        limit: gl.getUniformLocation(shaderProgram, "u_Limit")
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

setUniforms(gl, shader, config)

const render = (now, cameraTransformMat, mousePosition) => {
    const theta = now * 0.001

    const mouseVec = [input.mouse.x - mousePosition.x, input.mouse.y - mousePosition.y, 0]
    mousePosition = {
        x: input.mouse.x,
        y: input.mouse.y
    }

    if (input.mouse.rightClick && (mouseVec[0] != 0 || mouseVec[1] != 0)) {
        cameraTransformMat.rotate(getLength(mouseVec) / 100, ...vecNorm(mouseVec))
    }

    if (input.mouse.leftClick && (mouseVec[0] != 0 || mouseVec[1] != 0)) {
        cameraTransformMat.translate(vecDiv(mouseVec, 100))
    }

    if (input.r) {
        cameraTransformMat = new Matrix()
        cameraTransformMat.translate(config.cameraPosition)
        input.r = false
    }

    if (input.wheel) {
        cameraTransformMat.translate(0, 0, input.wheel)
        input.wheel = 0
    }

    setView(gl, cameraTransformMat)

    drawBunny(gl, shader, bunnyBuffer)

    // drawPointLight(gl, shader, pointLightBuffer, config.pointLightPosition, theta)

    requestAnimationFrame(now => render(now, cameraTransformMat, mousePosition))
}

const cameraTransformMat = new Matrix()
cameraTransformMat.translate(config.cameraPosition)

requestAnimationFrame(now => render(now, cameraTransformMat, input.mouse))
