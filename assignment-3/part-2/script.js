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

varying vec3 v_Normal, v_LightDirection;

void main(void) {
    vec3 Normal = normalize(v_Normal);
    float light = max(dot(Normal, v_LightDirection), 0.1);
    gl_FragColor = vec4(0.0, 0.6, 0.6, 0.6) * light;
}
`

class Arm {
    constructor(gl) {
        this.base = new Cylinder(gl, 0.5, 1, 1)
        this.rotator = new Cylinder(gl, 0.25, 0.75, 0.75)
        this.upperArm = new Cylinder(gl, 4, 0.25, 0.25)
        this.lowerArm = new Cylinder(gl, 4, 0.25, 0.25)

        const joint = new Cylinder(gl, 0.6).translate(0.3, 0, 0).rotateZ(Math.PI / 2)
        this.base.children.push(this.rotator)
        this.base.children[0].children.push(this.upperArm, joint)
        this.base.children[0].children[0].children.push(this.lowerArm, joint)

        this.lowerArm.rotateX(0.3)

        this.speed = {
            bend: 1,
            rotation: 1
        }

        this.current = {
            bend: 0,
            rotation: 0
        }

        this.target = {
            bend: 0,
            rotation: 0
        }
    }

    moveTo(bend, rotation) {
        this.target = {
            bend: bend,
            rotation: rotation
        }
    }

    move(distance) {
        const delta = {
            bend: this.target.bend - this.current.bend,
            rotation: this.target.rotation - this.current.rotation
        }

        if (delta.bend != 0) {
            // prettier-ignore
            delta.bend = Math.sign(delta.bend) * Math.min(Math.abs(delta.bend), distance * this.speed.bend)
            this.current.bend += delta.bend
            this.upperArm.matrix = create.matrix.rotation.x(this.current.bend / 2)
            this.lowerArm.matrix = create.matrix.rotation.x(this.current.bend / 2)
        }

        if (delta.rotation != 0) {
            // prettier-ignore
            delta.rotation = Math.sign(delta.rotation) * Math.min(Math.abs(delta.rotation), distance * this.speed.rotation)
            this.current.rotation += delta.rotation
            this.rotator.matrix = create.matrix.rotation.y(this.current.bend)
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
        modelMatrix: gl.getUniformLocation(shaderProgram, "u_ModelMatrix")
    }
}
gl.useProgram(shader.program)

const bunny = new Model(gl, getVertices(), getFaces())
bunny.translate(0, 0.2, 0)

const cube = create.shape.cube(gl, 20, 1)
cube.translate(0, -0.5, 0)

const arm = new Arm(gl)
arm.moveTo(2, -1)

const render = (now, then, camera) => {
    now *= 0.001 // convert to seconds
    const delta = now - then

    camera.control()
    camera.clear(gl)
    camera.view(gl)

    // bunny.draw(gl, shader)
    cube.draw(gl, shader)
    // cylinder.draw(gl, shader)
    arm.move(delta)
    arm.draw(gl, shader)

    then = now
    requestAnimationFrame(now => render(now, then, camera))
}

const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)
camera.initControls(window)
camera.reset()

render(0, 0, camera)
