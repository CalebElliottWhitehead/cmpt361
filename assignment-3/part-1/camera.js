class Camera {
    constructor(viewUniform) {
        this.viewUniform = viewUniform
        this.viewMatrix = new Matrix()
    }
    transform(matrix) {
        this.viewMatrix = this.viewMatrix.dot(matrix)
    }
    setView(gl) {
        gl.uniformMatrix4fv(this.viewUniform, false, this.viewMatrix.out)
    }
    reset(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}
