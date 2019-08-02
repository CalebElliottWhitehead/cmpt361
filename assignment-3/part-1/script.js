const gl = create.canvas(window)

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

class Arm {
    constructor(gl) {
        this.base = new Cylinder(gl, 0.5, 1, 1)
        this.base.translate(0, -0.75, 0)
        this.rotator = new Cylinder(gl, 0.25, 0.75, 0.75)
        this.upperArm = new Cylinder(gl, 4, 0.25, 0.25)
        this.lowerArm = new Cylinder(gl, 4, 0.25, 0.25)

        const joint = new Cylinder(gl, 0.6).translate(0.3, 0, 0).rotateZ(Math.PI / 2)
        this.base.children.push(this.rotator)
        this.base.children[0].children.push(this.upperArm, joint)
        this.base.children[0].children[0].children.push(this.lowerArm, joint)

        this.current = {
            bend: {
                upper: 0,
                lower: 0
            },
            rotation: 0
        }

        this.target = {
            bend: {
                upper: 0,
                lower: 0
            },
            rotation: 0
        }
    }

    initControls() {
        const sliders = [
            {
                name: "upper",
                max: Math.PI,
                lambda: this.bendUpper.bind(this)
            },
            {
                name: "lower",
                max: Math.PI,
                lambda: this.bendLower.bind(this)
            },
            {
                name: "rotation",
                max: Math.PI * 2,
                lambda: this.rotate.bind(this)
            }
        ].map(slider => {
            const input = document.createElement("input")
            input.type = "range"
            input.name = slider.name
            input.min = 1
            input.max = slider.max * 100
            input.oninput = function() {
                slider.lambda(-this.value / 100)
            }

            const label = document.createElement("label")
            label.innerHTML = slider.name
            label.style.display = "block"
            label.style.color = "#eee"
            label.append(input)

            return label
        })

        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.top = 0
        div.style.padding = "5px"
        div.append(...sliders)

        document.body.append(div)
    }

    bendUpper(theta) {
        this.target.bend.upper = theta
    }

    bendLower(theta) {
        this.target.bend.lower = theta
    }

    rotate(theta) {
        this.target.rotation = theta
    }

    touch(x, y) {
        if (x < 0) {
            arm.rotate(Math.PI / 2)
            x = -x
        } else {
            arm.rotate(-Math.PI / 2)
        }
        const distance = Math.sqrt(Math.abs(x * x + y * y))
        const armLength = 0.4
        const theta = Math.acos(distance / (armLength * 2)) || 0
        this.bendUpper(Math.atan2(y, x) - Math.PI / 2 + theta)
        this.bendLower(-2 * theta)
    }

    move(distance) {
        const delta = {
            bend: {
                upper: this.target.bend.upper - this.current.bend.upper,
                lower: this.target.bend.lower - this.current.bend.lower
            },
            rotation: this.target.rotation - this.current.rotation
        }

        if (delta.bend.upper != 0) {
            // prettier-ignore
            delta.bend.upper = Math.sign(delta.bend.upper) * Math.min(Math.abs(delta.bend.upper), distance)
            this.current.bend.upper += delta.bend.upper
            this.upperArm.matrix = create.matrix.rotation.x(this.current.bend.upper)
        }

        if (delta.bend.lower != 0) {
            // prettier-ignore
            delta.bend.lower = Math.sign(delta.bend.lower) * Math.min(Math.abs(delta.bend.lower), distance * 1.5)
            this.current.bend.lower += delta.bend.lower
            this.lowerArm.matrix = create.matrix.rotation.x(this.current.bend.lower)
        }

        if (delta.rotation != 0) {
            // prettier-ignore
            delta.rotation = Math.sign(delta.rotation) * Math.min(Math.abs(delta.rotation), distance * 2)
            this.current.rotation += delta.rotation
            this.rotator.matrix = create.matrix.rotation.y(this.current.rotation)
        }
    }

    draw(gl, shader) {
        this.base.draw(gl, shader)
    }
}

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

const arm = new Arm(gl)
arm.rotate(-Math.PI / 2)
arm.initControls()
// arm.bendUpper(Math.PI / 2)
// const cylinder = new Cylinder(gl, 1)
// const sphere = create.shape.sphere(gl, 4)
const bunny = new Model(gl, getVertices(), getFaces())
bunny.color = [0.7, 0.1, 0.1, 1]
bunny.scale(0.5)

const render = (now, then, camera) => {
    now *= 0.001 // convert to seconds
    const delta = now - then

    camera.control()
    camera.clear(gl)
    camera.view(gl)

    arm.move(delta)
    arm.draw(gl, shader)
    // arm.touch(camera.clickPosition.x, camera.clickPosition.y)

    bunny.draw(gl, shader)
    // bunny.translate(camera.clickPosition.x, camera.clickPosition.y, 0)

    then = now
    requestAnimationFrame(now => render(now, then, camera))
}

const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)

camera.initControls(window, arm.touch.bind(arm), (x, y) => {
    bunny.matrix.m[3] = [x * 10, y * 10 - 0.3, 0, 1]
})

camera.reset(0, 0, 0, -24)
// INVERSE:
// [1.00,  0.00,  0.00, 0.00]
// [0.00,  0.83, -0.56, 0.00]
// [0.00,  0.56,  0.83, 0.00]
// [0.00, 21.82, 24.11, 1.00]

console.log(bunny.color)

render(0, 0, camera)
