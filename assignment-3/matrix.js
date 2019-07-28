const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

const vector = {
    multiply: (vec1, vec2) => vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0),
    cross: (vec1, vec2) => [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0]
    ],
    combine: (vec1, vec2) => vec1.map((num, i) => vec2[i] * num),
    add: (vec, num_vec) => {
        if (Array.isArray(num_vec)) return vec.map((n, i) => n + num_vec[i])
        else return vec.map(n => n + num_vec)
    },
    subtract: (vec, num_vec) => {
        if (Array.isArray(num_vec)) return vec.map((n, i) => n - num_vec[i])
        else return vec.map(n => n - num_vec)
    },
    divide: (vec, num) => vec.map(n => n / num),
    length: vec => Math.sqrt(Math.abs(vec.reduce((acc, cur) => acc + cur * cur, 0))),
    // prettier-ignore
    normalize: vec => {
        const length = vector.length(vec)
        return vec.map(n => n / length || 0)
    },
    negate: vec => vec.map(n => -1 * n),
    string: vec => "[" + vec.map(n => n.toFixed(2)).join(", ") + "]",
    surface: {
        normals: surface => {
            const t1 = vector.subtract(surface[1], surface[0])
            const t2 = vector.subtract(surface[2], surface[0])
            return vector.normalize(vector.cross(t1, t2))
        }
    }
}

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
        return this
    }

    dot(vec_mat) {
        if (Array.isArray(vec_mat)) {
            return this.transpose.m.map(vec => vector.multiply(vec, vec_mat))
        }
        return new Matrix(
            this.transpose.m.map(vec => vec.map((_, i) => vector.multiply(vec, vec_mat.m[i])))
        ).transpose
    }

    get inverse() {
        const partialTranspose = [
            [this.m[0][0], this.m[1][0], this.m[2][0]],
            [this.m[0][1], this.m[1][1], this.m[2][1]],
            [this.m[0][2], this.m[1][2], this.m[2][2]]
        ]
        const partialAffine = partialTranspose.map(
            vec => -1 * vector.multiply(vec, this.m[3].slice(0, 3))
        )
        const inverse = partialTranspose.map(vec => [...vec, 0])
        inverse.push([...partialAffine, 1])
        return new Matrix(inverse)
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
