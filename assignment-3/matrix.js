class Matrix {
    constructor(mat) {
        if (mat) {
            this.m = mat
        } else {
            // prettier-ignore
            this.m = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]
        }
    }

    dot(vec_mat) {
        if (Array.isArray(vec_mat)) {
            return this.transpose.m.map(vec => vector.multiply(vec, vec_mat))
        }
        return new Matrix(
            this.transpose.m.map(vec => vec.map((_, i) => vector.multiply(vec, vec_mat.m[i])))
        ).transpose
    }

    // Only for orthonormal matrices. Transformation given by:
    // [            inv(M), 0]
    // [-inv(M) * position, 1]
    get inverse() {
        const inversePosition = this.m
            .slice(0, 3)
            .map(vec => vector.multiply(vector.negate(vec), this.m[3]))

        // prettier-ignore
        return new Matrix([
            [this.m[0][0], this.m[1][0], this.m[2][0], 0],
            [this.m[0][1], this.m[1][1], this.m[2][1], 0],
            [this.m[0][2], this.m[1][2], this.m[2][2], 0],
            [                      ...inversePosition, 1]
        ])
    }

    get transpose() {
        return new Matrix(
            this.m.map((row, rowNum) => row.map((_, colNum) => this.m[colNum][rowNum]))
        )
    }

    get position() {
        return this.m[3].slice(0, 3)
    }

    get out() {
        return new Float32Array(this.m.flat())
    }

    get string() {
        return "[" + this.m.map(vec => vec.map(n => n.toFixed(2)).join(", ")).join("]\n[") + "]"
    }
}
