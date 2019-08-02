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

    draw(gl, shader, parentMatrix = new Matrix()) {
        super.draw(gl, shader, parentMatrix, [0, this.height, 0])
    }
}
