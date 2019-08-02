class Input {
    constructor() {}

    initControls(window) {
        this.controllable = true

        this.wheel = 0

        this.r = false

        this.click = {
            left: false,
            right: false
        }

        this.clickPosition = {
            x: 0,
            y: 0
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
            this.mousePosition.x = (event.clientX * 2) / this.width - 1
            this.mousePosition.y = ((event.clientY * 2) / this.height - 1) * -1
            console.log(this.mousePosition.x, this.mousePosition.y)
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
            const position = this.matrix.position
            // nod-yes
            this.matrix = create.matrix.rotation.axis(-movement.x / 500, 0, 1, 0).dot(this.matrix)
            // shake-no
            this.matrix = create.matrix.rotation.axis(-movement.y / 500, 1, 0, 0).dot(this.matrix)
            this.matrix.m[3] = [...position, 1]
        }

        if (this.click.left) {
            this.clickPosition.x = this.mousePosition.x
            this.clickPosition.y = this.mousePosition.y
            this.click.left = false
            console.log(this.clickPosition.x, this.clickPosition.y)
        }
    }
}
