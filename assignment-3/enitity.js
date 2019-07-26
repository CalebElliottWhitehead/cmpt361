class Entity {
    constructor(matrix) {
        this.matrix = matrix
    }

    transform(matrix) {
        this.matrix = this.matrix.dot(matrix)
        return this
    }

    rotate(theta, x, y, z) {
        const rotation = create.matrix.rotation.axis(theta, x, y, z)
        this.matrix = this.matrix.dot(rotation)
        return this
    }

    translate(x, y, z) {
        const translation = create.matrix.translation(x, y, z)
        this.matrix = this.matrix.dot(translation)
        return this
    }
}
