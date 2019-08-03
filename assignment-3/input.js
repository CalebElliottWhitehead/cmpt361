class Input {
    constructor(window) {
        this.inputs = {}
        this.mousePosition = { x: 0, y: 0 }
        this.size = Math.min(window.innerWidth, window.innerHeight)
    }

    initMouseClick(window, button, lambda) {
        let buttonNum = 0
        if (button == "right") {
            window.addEventListener("contextmenu", event => event.preventDefault())
            buttonNum = 2
        }
        window.addEventListener("mousedown", event => {
            if (event.button === buttonNum) {
                lambda(
                    (event.clientX * 2) / this.size - 1,
                    -1 * ((event.clientY * 2) / this.size - 1)
                )
            }
        })
    }

    initMouseHold(window, button, lambda) {
        let buttonNum = 0
        if (button == "right") {
            window.addEventListener("contextmenu", event => event.preventDefault())
            buttonNum = 2
        }
        this.inputs[button] = false
        window.addEventListener("mousedown", event => {
            if (event.button === buttonNum) {
                this.inputs[button] = true
            }
        })
        window.addEventListener("mouseup", event => {
            if (event.button === buttonNum) {
                this.inputs[button] = false
                this.mousePosition = { x: 0, y: 0 }
            }
        })
        window.addEventListener("mousemove", event => {
            if (this.inputs[button]) {
                const currentX = (event.clientX * 2) / this.size - 1
                const currentY = -1 * ((event.clientY * 2) / this.size - 1)
                if (this.mousePosition.x != 0 || this.mousePosition.y != 0) {
                    lambda(currentX - this.mousePosition.x, currentY - this.mousePosition.y)
                }
                this.mousePosition.x = currentX
                this.mousePosition.y = currentY
            }
        })
    }

    initKeyPress(window, key, lambda) {
        window.addEventListener("keydown", event => {
            if (event.key === key) {
                lambda()
            }
        })
    }

    initScroll(window, lambda) {
        window.addEventListener("wheel", event => {
            lambda(event.deltaY)
        })
    }
}
