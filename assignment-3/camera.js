class Camera extends Entity {
    constructor(uniform) {
        super(new Matrix())
        this.uniform = uniform
        this.controllable = false
    }

    initControls() {
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
            if (event.button === 0) this.click.left = false
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
            this.reset()
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

        if (this.click.right && (movement.x != 0 || movement.y != 0)) {
            const axis = [movement.y, movement.x, 0]
            const theta = vector.length(axis) / 100
            this.matrix = create.matrix.rotation
                .axis(theta, ...vector.normalize(axis))
                .dot(this.matrix)
        }

        if (this.click.left && (movement.x != 0 || movement.y != 0)) {
            this.matrix = create.matrix
                .translation(movement.x / 100, -movement.y / 100, 0)
                .dot(this.matrix)
        }
    }

    reset() {
        this.matrix = create.matrix.translation(0, 0, 15)
    }

    view(gl) {
        gl.uniformMatrix4fv(this.uniform, false, this.matrix.inverse.out)
    }

    clear(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}
