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

console.log(vector.cross([1, 2, 3], [0, 1, 0]))

class Branch extends Cylinder {
    constructor(gl, radius, total, current = total, branchable = true) {
        const topRadius = (current - 1) / total
        const bottomRadius = current / total
        const sides = Math.floor(Math.max(bottomRadius * 14, 3))
        const length = Math.pow(bottomRadius, 2) * 2 + 2

        super(gl, length, radius * topRadius, radius * bottomRadius, sides)

        // rotate self
        if (Math.random() < 0.3) {
            this.rotate(topRadius - 0.7, 0.71, 0, 0.71)
        } else {
            this.rotate(-(topRadius - 0.7), 0.71, 0, 0.71)
        }

        // twigs
        for (let i = 0; i < 6; i++) {
            if (Math.random() < Math.pow(1 - bottomRadius, 3) && 2 < current && branchable) {
                console.log("twig!")
                const axis = vector.normalize([Math.random() - 0.5, 0, Math.random() - 0.5, 0])
                this.children.push(
                    new Branch(gl, topRadius, total, current - 1, false).rotate(1, ...axis)
                )
            }
        }

        // continue current
        if (2 < current) {
            if (Math.random() < Math.pow(bottomRadius, 2)) {
                // branch
                const axis = vector.normalize([Math.random() - 0.5, 0, Math.random() - 0.5, 0])
                this.children.push(
                    new Branch(gl, topRadius, total, current - 1).rotate(0.6, ...axis),
                    new Branch(gl, topRadius, total, current - 1).rotate(-0.6, ...axis)
                )
            } else {
                // don't branch
                this.children.push(new Branch(gl, topRadius, total, current - 1))
            }
        }
    }
}

class Tree {
    constructor(gl) {
        const pointers = {
            breaks: 4
        }
        this.trunk = new Cylinder(gl, 3, 1, 2)
        this.trunk.children.push(new Branch(gl, 1, 9))
    }

    draw(gl, shader, delta) {
        this.trunk.rotateY(delta)
        this.trunk.draw(gl, shader)
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

const tree = new Tree(gl)

const render = (now, then, camera) => {
    now *= 0.001 // convert to seconds
    const delta = now - then

    camera.control()
    camera.clear(gl)
    camera.view(gl)

    cube.draw(gl, shader)
    tree.draw(gl, shader, delta)

    then = now
    requestAnimationFrame(now => render(now, then, camera))
}

const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)
camera.initControls(window)
camera.reset()

render(0, 0, camera)
