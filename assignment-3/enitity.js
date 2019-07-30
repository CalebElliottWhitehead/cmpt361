class Entity {
    constructor(matrix) {
        this.matrix = matrix
        this.children = []
    }

    transform(matrix) {
        this.matrix = this.matrix.dot(matrix)
        return this
    }

    rotateX(theta) {
        const rotation = create.matrix.rotation.x(theta)
        this.matrix = this.matrix.dot(rotation)
        return this
    }

    rotateY(theta) {
        const rotation = create.matrix.rotation.y(theta)
        this.matrix = this.matrix.dot(rotation)
        return this
    }

    rotateZ(theta) {
        const rotation = create.matrix.rotation.z(theta)
        this.matrix = this.matrix.dot(rotation)
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
