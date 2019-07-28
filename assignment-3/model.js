class Model extends Entity {
    constructor(gl, vertices, faces, normals, color = [0.8, 0.8, 0.8, 1]) {
        super(new Matrix())

        this.size = faces.flat().length
        this.color = color

        this.positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces.flat()), gl.STATIC_DRAW)

        this.normalBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        if (!normals) {
            normals = []
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
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat(2)), gl.STATIC_DRAW)
    }

    draw(gl, shader, parentMatrix = new Matrix(), translation = [0, 0, 0]) {
        const modelMatrix = parentMatrix.dot(this.matrix)
        gl.uniformMatrix4fv(shader.u.modelMatrix, false, modelMatrix.out)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.vertexAttribPointer(shader.a.position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shader.a.position)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        gl.vertexAttribPointer(shader.a.normal, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shader.a.normal)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.drawElements(gl.TRIANGLES, this.size, gl.UNSIGNED_SHORT, 0)

        this.children.forEach(child =>
            child.draw(gl, shader, modelMatrix.dot(create.matrix.translation(...translation)))
        )
    }

    // get child() {
    //     return this.children[0]
    // }
}

class Cylinder extends Model {
    constructor(gl, height = 4, topRadius = 0.5, bottomRadius = 0.5, sides = 12) {
        const stepTheta = (2 * Math.PI) / sides
        const verticesPerCap = 9 * sides

        const vertices = []

        let index = 0

        // top cap
        let theta = 0
        while (index < verticesPerCap) {
            vertices[index] = Math.cos(theta) * topRadius
            vertices[index + 1] = height
            vertices[index + 2] = Math.sin(theta) * topRadius
            theta += stepTheta

            vertices[index + 3] = 0.0
            vertices[index + 4] = height
            vertices[index + 5] = 0.0

            vertices[index + 6] = Math.cos(theta) * topRadius
            vertices[index + 7] = height
            vertices[index + 8] = Math.sin(theta) * topRadius

            index += 9
        }

        // bottom cap
        theta = 0
        while (index < verticesPerCap + verticesPerCap) {
            vertices[index + 6] = Math.cos(theta) * bottomRadius
            vertices[index + 7] = 0
            vertices[index + 8] = Math.sin(theta) * bottomRadius
            theta += stepTheta

            vertices[index + 3] = 0.0
            vertices[index + 4] = 0
            vertices[index + 5] = 0.0

            vertices[index] = Math.cos(theta) * bottomRadius
            vertices[index + 1] = 0
            vertices[index + 2] = Math.sin(theta) * bottomRadius

            index += 9
        }

        // sides
        for (let j = 0; j < sides; j++) {
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[0 + k + 9 * j]
            }
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[6 + k + 9 * j]
            }
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[verticesPerCap + k + 9 * j]
            }
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[0 + k + 9 * j]
            }
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[verticesPerCap + k + 9 * j]
            }
            for (let k = 0; k < 3; k++, index++) {
                vertices[index] = vertices[verticesPerCap + 6 + k + 9 * j]
            }
        }

        const indices = []
        for (index = 0; index < vertices.length / 3; index += 3) {
            indices.push([index, index + 1, index + 2])
        }

        const normals = []
        for (index = 0; index < vertices.length; index += 9) {
            const a = [vertices[index], vertices[index + 1], vertices[index + 2]]
            const b = [vertices[index + 3], vertices[index + 4], vertices[index + 5]]
            const c = [vertices[index + 6], vertices[index + 7], vertices[index + 8]]
            const normal = vector.normalize(
                vector.cross(vector.subtract(a, b), vector.subtract(a, c))
            )
            normals.push(normal, normal, normal)
        }
        super(gl, vertices, indices, normals)

        this.height = height
    }

    draw(gl, shader, parentMatrix) {
        super.draw(gl, shader, parentMatrix, [0, this.height, 0])
    }
}
