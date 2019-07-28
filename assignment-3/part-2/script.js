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
console.log("hi")
class Branch extends Cylinder {
    constructor(gl, pointers, radius, total, current = total, rotation = 0.15) {
        const topRadius = (current - 1) / total
        const bottomRadius = current / total

        super(gl, 3, radius * topRadius, radius * bottomRadius)

        if (Math.random() < 0.3) {
        } else {
            this.rotateZ(rotation)
        }

        this.rotateY(Math.sign(rotation) * 0.12)

        console.log(current)

        if (0 < current - 1) {
            if (Math.random() < 0.4) {
                let randomVec = vector.normalize([
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ])
                const scalar = rotation * 7 * (Math.random() - 0.5)
                this.children.push(
                    new Branch(
                        gl,
                        pointers,
                        radius,
                        total,
                        current - 1,
                        rotation * (Math.random() - 0.5) * 2
                    ).rotate(scalar, ...randomVec)
                )
                if (Math.random() < 0.4 && 0 < pointers.breaks) {
                    pointers.breaks--
                    this.children.push(
                        new Branch(
                            gl,
                            pointers,
                            radius,
                            total,
                            current - 1,
                            rotation * (Math.random() - 0.5) * 2
                        ).rotate(-scalar, ...randomVec)
                    )
                }
            } else {
                this.children.push(
                    new Branch(gl, pointers, radius, total, current - 1, rotation * 1.2)
                )
            }
        }
    }
}

class Tree {
    constructor(gl) {
        const pointers = {
            breaks: 4
        }
        this.trunk = new Branch(gl, pointers, 1, 8)
    }

    draw(gl, shader) {
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
    tree.draw(gl, shader)

    then = now
    requestAnimationFrame(now => render(now, then, camera))
}

const camera = new Camera(shader.u.modelViewMatrix, shader.u.projectionMatrix)
camera.initControls(window)
camera.reset()

render(0, 0, camera)
