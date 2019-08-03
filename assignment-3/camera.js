class Camera extends Entity {
    constructor(modelViewUniform, projectionUniform) {
        super(new Matrix())
        this.uniform = modelViewUniform
        this.controllable = false
        this.width = gl.canvas.clientWidth
        this.height = gl.canvas.clientHeight

        const fieldOfView = (45 * Math.PI) / 180
        const aspect = this.width / this.height
        const near = 0.1
        const far = 300.0
        this.projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)
        gl.uniformMatrix4fv(projectionUniform, false, this.projectionMatrix.out)
    }

    reset(theta = 0.4, x = 0, y = -25, z = -35) {
        this.matrix = new Matrix()
        this.matrix = create.matrix.translation(x, y, z)
        this.matrix = create.matrix.rotation.x(theta).dot(this.matrix)
    }

    view(gl) {
        gl.uniformMatrix4fv(this.uniform, false, this.matrix.out)
    }

    clear(gl) {
        gl.clearColor(0.6, 0.6, 0.9, 1.0)
        gl.clearDepth(1.0)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}
