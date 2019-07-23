class Model {
    constructor(gl, vertices, faces, color = [0.8, 0.8, 0.8, 1]) {
        this.size = faces.flat().length
        this.color = color
        this.transformationMatrix = new Matrix()

        this.positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces.flat()), gl.STATIC_DRAW)

        this.normalBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        const normals = []
        for (let i = 0; i < vertices.length; i++) {
            normals.push([0, 0, 0])
        }
        faces.forEach(face => {
            const normal = vector.surface.normals(face.map(index => vertices[index]))
            face.forEach(index => {
                normals[index][0] += normal[0]
                normals[index][1] += normal[1]
                normals[index][2] += normal[2]
            })
        })
        normals.map(normal => vector.normalize(normal))
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)
    }

    transform(matrix) {
        this.transformationMatrix = this.transformationMatrix.dot(matrix)
    }

    draw(gl, shader) {
        // gl.uniformMatrix4fv(shader.u.modelMatrix, false, this.transformationMatrix.out)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shader.a.position)

        // gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        // gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
        // gl.enableVertexAttribArray(shader.a.normal)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.drawElements(gl.TRIANGLES, this.size, gl.UNSIGNED_SHORT, 0)
    }
}
