const vertexShaderSource = `
precision mediump float;

attribute vec3 a_Position, a_Normal;

uniform mat4 u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;

void main() {
    mat4 MVP = u_ModelMatrix * u_ViewMatrix * u_ProjectionMatrix;
    vec4 Position = vec4(a_Position, 1.0);
    gl_Position = MVP * Position;
}
`

const fragmentShaderSource = `
precision mediump float;

void main() {
    gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
`

const canvas = document.querySelector("#canvas")
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.")

const shaderProgram = create.shader.program(gl, vertexShaderSource, fragmentShaderSource)
gl.useProgram(shaderProgram)

const shader = {
    program: shaderProgram,
    a: {
        position: gl.getAttribLocation(shaderProgram, "a_Position"),
        normal: gl.getAttribLocation(shaderProgram, "a_Normal")
    },
    u: {
        modelMatrix: gl.getUniformLocation(shaderProgram, "u_ModelMatrix"),
        viewMatrix: gl.getUniformLocation(shaderProgram, "u_ViewMatrix"),
        projectionMatrix: gl.getUniformLocation(shaderProgram, "u_ProjectionMatrix")
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
    r: false,
    p: false,
    s: false
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

window.addEventListener("keydown", event => {
    if (event.key === "p") {
        input.p = true
    }
})

window.addEventListener("keydown", event => {
    if (event.key === "s") {
        input.s = true
    }
})

const render = (now, model, lastPosition, camera) => {
    const movement = {
        x: input.mouse.x - lastPosition.x,
        y: input.mouse.y - lastPosition.y
    }

    lastPosition = {
        x: input.mouse.x,
        y: input.mouse.y
    }

    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const near = 0.1
    const far = 100.0
    const projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)
    gl.uniformMatrix4fv(shader.u.projectionMatrix, false, projectionMatrix.out)

    const cameraTransform = create.matrix.translation(0, 0, -20)
    camera.transform(cameraTransform)

    camera.reset(gl)
    camera.setView(gl)

    bunny.draw(gl, shader)

    if (input.mouse.rightClick && (movement.x != 0 || movement.y != 0)) {
        const vec = [-movement.y, -movement.x, 0]
        const cameraRotationMatrix = create.matrix.rotation.axis(
            vector.length(vec) / 100,
            ...vector.normalize(vec)
        )
        camera.transform(cameraRotationMatrix)
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

    requestAnimationFrame(now => render(now, model, lastPosition, camera))
}

const camera = new Camera(shader.u.viewMatrix)
const cameraTransform = create.matrix.translation(0, 0, -20)
camera.transform(cameraTransform)

const bunny = new Model(gl, getVertices(), getFaces())

requestAnimationFrame(now => render(now, bunny, { x: 0, y: 0 }, camera))

// const createProjectionMat = (fovy, aspect, near, far) => {
//     const f = 1.0 / Math.tan(fovy / 2)
//     const d = far - near
//     const result = new Matrix()
//     result.m[0][0] = f / aspect
//     result.m[1][1] = f
//     result.m[2][2] = -(near + far) / d
//     result.m[2][3] = (-2 * near * far) / d
//     result.m[3][2] = -1
//     result.m[3][3] = 0
//     return result
// }
