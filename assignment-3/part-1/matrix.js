const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

const vector = {
    multiply: (vec1, vec2) => vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0),
    cross: (vec1, vec2) => [
        (vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0])
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
    length: vec => Math.sqrt(vec.reduce((acc, cur) => acc + cur * cur)),
    normalize: vec => length => vec.map(n => n / length)(vector.length(vec)),
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
            this.m = new Array(4)
            for (let i = 0; i < 4; i++) {
                this.m[i] = new Array(4).fill(0)
                this.m[i][i] = 1
            }
        }
        return this
    }
    scale(x, y, z) {
        if (y !== undefined) {
            this.m[0][0] * x
            this.m[1][1] * y
            this.m[2][2] * z
        } else {
            this.m[3][3] * x
        }
    }
    get transpose() {
        return new Matrix(
            this.m.map((row, rowNum) => row.map((_, colNum) => this.m[colNum][rowNum]))
        )
    }
    dot(vec_mat) {
        if (Array.isArray(vec_mat)) {
            return this.transpose.m.map(vec => vector.multiply(vec, vec_mat))
        }
        return new Matrix(
            this.transpose.m.map(vec => vec.map((_, i) => vector.multiply(vec, vec_mat.m[i])))
        ).transpose
    }
    get out() {
        return new Float32Array(this.transpose.m.flat())
    }
    get string() {
        return "[" + this.transpose.m.map(vec => vec.join(", ")).join("]\n[") + "]"
    }
    colMajor(...arr) {
        const matrix = []
        for (let col = 0; col < 4; col++) {
            const vec = []
            for (let row = 0; row < 4; row++) {
                vec.push(arr[4 * row + col])
            }
            matrix.push(vec)
        }
        this.m = matrix
    }
}

const vec1 = [1, 2, 3, 4]
console.log(vector.length(vec1))

const sup = str => console.log(str)

// const mat1 = new Matrix()
// // prettier-ignore
// mat1.colMajor(
//      1,  2,  3,  4,
//      5,  6,  7,  8,
//      9, 10, 11, 12,
//     13, 14, 15, 16,
// )

// const mat2 = new Matrix()
// // prettier-ignore
// mat2.colMajor(
//      4,  2,  3,  4,
//      5,  12,  7,  10,
//      9, 10, 11, 12,
//     13, 14, 15, 16,
// )

// console.log(mat1.dot(vec1))
