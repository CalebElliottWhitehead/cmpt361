class Scene {
    constructor() {
        this.children = []
        this.lambdas = []
    }

    append(...children) {
        this.children.push(...children)
    }

    onRenderCall(...lambdas) {
        this.lambdas.push(...lambdas)
    }

    draw(gl, shader, delta) {
        this.lambdas.forEach(lambda => lambda(delta))
        this.children.forEach(child => child.draw(gl, shader))
    }

    render(gl, shader, now = 0, then = 0) {
        this.lambdas.forEach(lambda => lambda((now - then) * 0.001))
        this.children.forEach(child => child.draw(gl, shader))

        then = now
        requestAnimationFrame(now => this.render(gl, shader, now, then))
    }
}
