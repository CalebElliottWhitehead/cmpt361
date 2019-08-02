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

    rotate(theta, x = 0, y = 0, z = 0) {
        const rotation = create.matrix.rotation.axis(theta, x, y, z)
        this.matrix = this.matrix.dot(rotation)
        return this
    }

    translate(x = 0, y = 0, z = 0) {
        const translation = create.matrix.translation(x, y, z)
        this.matrix = this.matrix.dot(translation)
        return this
    }

    scale(x, y = x, z = x) {
        const scale = create.matrix.scale(x, y, z)
        this.matrix = this.matrix.dot(scale)
        return this
    }
}
