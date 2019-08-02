const gl = create.canvas(window)

class fpsCounter {
    constructor() {
        this.fpsCounter = document.createElement("div")
        this.fpsCounter.style.position = "absolute"
        this.fpsCounter.style.top = 0
        this.fpsCounter.style.color = "white"
        document.body.appendChild(this.fpsCounter)

        this.min = Infinity
        this.fps = 60

        setInterval(() => {
            this.fpsCounter.innerHTML = `${Math.floor(this.min)} fps`
            this.min = Infinity
        }, 250)
    }

    update(fps) {
        if (fps < this.min) {
            this.min = fps
        }
    }
}

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

const bunny = new Model(gl, getVertices(), getFaces())
bunny.translate(0, 0.2, 0)

const cube = create.shape.cube(gl, 100, 1)
cube.translate(0, -0.5, 0)
cube.color = [0.2, 0.5, 0.2, 1]

const tree = new Tree(gl)

const counter = new fpsCounter()

const render = (now, then, camera) => {
    now *= 0.001 // convert to seconds
    const delta = now - then

    counter.update(1 / delta)

    camera.control()
    camera.clear(gl)
    camera.view(gl)

    cube.draw(gl, shader)
    tree.draw(gl, shader)

    then = now
    requestAnimationFrame(now => render(now, then, camera))
}

const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)
camera.initControls(window)
camera.reset()

render(0, 0, camera)
