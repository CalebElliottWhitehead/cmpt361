class Camera extends Entity {
    constructor(modelViewUniform, projectionUniform) {
        super(new Matrix())
        this.uniform = modelViewUniform
        this.controllable = false

        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const near = 0.1
        const far = 100.0
        this.projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)
        gl.uniformMatrix4fv(projectionUniform, false, this.projectionMatrix.out)
    }

    initControls(window) {
        this.controllable = true

        this.wheel = 0

        this.r = false

        this.click = {
            left: false,
            right: false
        }

        this.mousePosition = {
            x: 0,
            y: 0
        }

        this.lastMousePosition = {
            x: 0,
            y: 0
        }

        window.addEventListener("contextmenu", event => event.preventDefault())

        window.addEventListener("mousedown", event => {
            if (event.button === 0) this.click.left = true
            if (event.button === 2) this.click.right = true
        })

        window.addEventListener("mouseup", event => {
            if (event.button === 2) this.click.right = false
        })

        window.addEventListener("mousemove", event => {
            this.mousePosition.x = event.clientX
            this.mousePosition.y = event.clientY
        })

        window.addEventListener("wheel", event => {
            this.wheel = event.deltaY
        })

        window.addEventListener("keydown", event => {
            if (event.key === "r") {
                this.r = true
            }
        })
    }

    control() {
        if (!this.controllable) {
            throw new Error("Camera controls have not been initialized")
        }

        if (this.r) {
            this.r = false
            this.lookAt([0, 0, 0])
            return
        }

        if (this.wheel) {
            this.matrix = create.matrix.translation(0, 0, this.wheel).dot(this.matrix)
            this.wheel = 0
        }

        const movement = {
            x: this.mousePosition.x - this.lastMousePosition.x,
            y: this.mousePosition.y - this.lastMousePosition.y
        }

        this.lastMousePosition = {
            x: this.mousePosition.x,
            y: this.mousePosition.y
        }

        // if (this.click.right && (movement.x != 0 || movement.y != 0)) {
        //     const axis = [movement.y, movement.x, 0]
        //     const theta = vector.length(axis) / 100
        //     this.matrix = create.matrix.rotation
        //         .axis(theta, ...vector.normalize(axis))
        //         .dot(this.matrix)
        // }

        if (this.click.right && (movement.x != 0 || movement.y != 0)) {
            const position = this.matrix.position
            this.matrix = create.matrix.rotation.y(-movement.x / 500).dot(this.matrix)
            this.matrix = create.matrix.rotation.x(-movement.y / 500).dot(this.matrix)
            this.matrix.m[3] = [...position, 1]
        }

        // if (this.click.left && (movement.x != 0 || movement.y != 0)) {
        //     this.matrix = create.matrix
        //         .translation(movement.x / 100, -movement.y / 100, 0)
        //         .dot(this.matrix)
        // }

        if (this.click.left) {
            console.log("clicked!")
        }
    }

    lookAt(position) {
        const direction = vector.normalize(vector.subtract(position, this.matrix.position))
        console.log("direction:", vector.string(direction))
        const right = vector.normalize(vector.cross(direction, [0, 1, 0]))
        console.log("right:", vector.string(right))
        const up = vector.normalize(vector.cross(right, direction))
        console.log("up:", vector.string(up))
        console.log(this.matrix.string)
        // prettier-ignore
        this.matrix = new Matrix([
            [                   ...right, 0],
            [                      ...up, 0],
            [...vector.negate(direction), 0],
            [                  0, 0, -15, 1]
        ])
        console.log(this.matrix.string)
    }

    reset() {
        this.matrix = new Matrix()
        this.matrix = create.matrix.translation(0, -10, -25)
        this.matrix = create.matrix.rotation.x(0.4).dot(this.matrix)
    }

    view(gl) {
        gl.uniformMatrix4fv(this.uniform, false, this.matrix.out)
    }

    clear(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}

// var v = normalize(subtract(at, eye)) // view direction vector
// var n = normalize(cross(v, up)) // perpendicular vector
// var u = normalize(cross(n, v)) // "new" up vector

// v = negate(v)

// var result = mat4(vec4(n, -dot(n, eye)), vec4(u, -dot(u, eye)), vec4(v, -dot(v, eye)), vec4())

// return result
