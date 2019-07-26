class Grid {
    constructor(gl, x, y) {
        this.lines = []
        const xBound = [-y / 2, y / 2]
        const yBound = [-x / 2, x / 2]
        for (let i = yBound[0]; i < yBound[1]; i++) {
            this.lines.push([0, i, xBound[0]])
            this.lines.push([0, i, xBound[1]])
        }
        for (let i = xBound[0]; i < xBound[1]; i++) {
            this.lines.push([0, i, yBound[0]])
            this.lines.push([0, i, yBound[1]])
        }

        this.size = this.lines.length

        this.positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.lines.flat()), gl.STATIC_DRAW)
    }

    draw(gl, shader) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shader.a.position)

        gl.drawArrays(gl.LINES, this.size, gl.UNSIGNED_SHORT, 0)
    }
}
